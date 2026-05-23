"""
DrugBank XML Parser — CSV Export Script
========================================
Parses the DrugBank Full Database XML file and exports structured CSV files
ready for PostgreSQL (Supabase) import.

Source:  full database.xml  (DrugBank 5.1, ~2.59 GB)
Output:  data/processed/*.csv

Datasets extracted:
  1. drugs.csv                    — drug entities
  2. drug_drug_interactions.csv   — DDI with description + mechanism
  3. drug_food_interactions.csv   — drug-food/herb interactions
  4. drug_conditions.csv          — indication + contraindication per drug
  5. targets.csv                  — protein targets (unique)
  6. drug_target_interactions.csv — drug ↔ target binding
  7. ddi_references.csv           — PubMed references for DDI

Usage:
  pip install -r requirements.txt
  python parse_drugbank.py [--xml PATH] [--out DIR] [--limit N]

  --xml    Path to full database.xml  (default: ../../../full database.xml)
  --out    Output directory           (default: ./processed)
  --limit  Only parse first N drugs   (default: all, useful for testing)
"""

import argparse
import csv
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

# ---------------------------------------------------------------------------
# Namespace
# ---------------------------------------------------------------------------
NS = "http://www.drugbank.ca"
TAG = lambda t: f"{{{NS}}}{t}"  # noqa: E731


# ---------------------------------------------------------------------------
# Severity mapping for DDI
# DrugBank descriptions contain keywords that map to severity levels.
# ---------------------------------------------------------------------------
SEVERITY_KEYWORDS = {
    "major": [
        "life-threatening", "contraindicated", "fatal", "severe", "serious",
        "significantly increase", "significantly decrease", "greatly increase",
        "greatly decrease", "markedly increase", "markedly decrease",
        "substantially increase", "substantially decrease",
    ],
    "moderate": [
        "increase the risk", "decrease the risk", "may increase", "may decrease",
        "can increase", "can decrease", "could increase", "could decrease",
        "risk of", "enhance", "reduce", "alter", "affect the efficacy",
        "impair", "inhibit", "induce",
    ],
    "minor": [
        "slightly", "minor", "small", "modest", "limited",
    ],
}


def classify_severity(description: str) -> str:
    """Classify DDI severity from description text."""
    desc_lower = description.lower()
    for severity, keywords in SEVERITY_KEYWORDS.items():
        if any(kw in desc_lower for kw in keywords):
            return severity
    return "unknown"


# ---------------------------------------------------------------------------
# XML helpers
# ---------------------------------------------------------------------------
def text(element, tag: str, default: str = "") -> str:
    """Get text content of a direct child element, or default."""
    child = element.find(TAG(tag))
    if child is not None and child.text:
        return child.text.strip()
    return default


def find_all(element, tag: str):
    """Find all direct children with given tag."""
    return element.findall(TAG(tag))


def find(element, tag: str):
    """Find first direct child with given tag."""
    return element.find(TAG(tag))


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------
def parse_drugbank(xml_path: Path, out_dir: Path, limit: int = 0) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    # --- Open CSV writers ---
    drugs_f = open(out_dir / "drugs.csv", "w", newline="", encoding="utf-8")
    ddi_f   = open(out_dir / "drug_drug_interactions.csv", "w", newline="", encoding="utf-8")
    food_f  = open(out_dir / "drug_food_interactions.csv", "w", newline="", encoding="utf-8")
    cond_f  = open(out_dir / "drug_conditions.csv", "w", newline="", encoding="utf-8")
    tgt_f   = open(out_dir / "targets.csv", "w", newline="", encoding="utf-8")
    dti_f   = open(out_dir / "drug_target_interactions.csv", "w", newline="", encoding="utf-8")
    ref_f   = open(out_dir / "ddi_references.csv", "w", newline="", encoding="utf-8")

    drugs_w = csv.writer(drugs_f)
    ddi_w   = csv.writer(ddi_f)
    food_w  = csv.writer(food_f)
    cond_w  = csv.writer(cond_f)
    tgt_w   = csv.writer(tgt_f)
    dti_w   = csv.writer(dti_f)
    ref_w   = csv.writer(ref_f)

    # Headers
    drugs_w.writerow(["drugbank_id", "name", "smiles", "cas_number", "description",
                      "indication", "pharmacodynamics", "mechanism_of_action",
                      "toxicity", "state", "groups"])
    ddi_w.writerow(["drug_a_drugbank_id", "drug_b_drugbank_id", "drug_b_name",
                    "severity", "description"])
    food_w.writerow(["drug_drugbank_id", "interaction"])
    cond_w.writerow(["drug_drugbank_id", "type", "text"])
    tgt_w.writerow(["target_id", "name", "uniprot_id", "gene_name",
                    "gene_symbol", "organism", "general_function", "specific_function"])
    dti_w.writerow(["drug_drugbank_id", "target_id", "known_action", "source"])
    ref_w.writerow(["drug_a_drugbank_id", "drug_b_drugbank_id", "pubmed_id", "citation"])

    # --- Tracking sets ---
    seen_targets: dict[str, str] = {}   # uniprot_id -> target_id (BE0000xxx)
    seen_ddi: set[tuple] = set()         # (drug_a_id, drug_b_id) pairs already written

    # Counters
    n_drugs = n_ddi = n_food = n_cond = n_tgt = n_dti = n_ref = 0

    print(f"Parsing {xml_path} ...")
    print(f"Output → {out_dir}")
    if limit:
        print(f"Limit: {limit} drugs")
    print()

    # Iterative parse — avoid loading 2.59 GB into memory at once
    context = ET.iterparse(str(xml_path), events=("end",))

    for event, elem in context:
        if elem.tag != TAG("drug"):
            continue

        # Skip metabolite/salt entries (they have no primary drugbank-id)
        primary_id = None
        for db_id_el in find_all(elem, "drugbank-id"):
            if db_id_el.get("primary") == "true":
                primary_id = db_id_el.text.strip() if db_id_el.text else None
                break
        if not primary_id:
            elem.clear()
            continue

        # ── Drug entity ──────────────────────────────────────────────────
        name          = text(elem, "name")
        description   = text(elem, "description")
        indication    = text(elem, "indication")
        pharmacodyn   = text(elem, "pharmacodynamics")
        mechanism     = text(elem, "mechanism-of-action")
        toxicity      = text(elem, "toxicity")
        cas_number    = text(elem, "cas-number")
        state         = text(elem, "state")

        groups_el = find(elem, "groups")
        groups = "|".join(
            g.text.strip() for g in (find_all(groups_el, "group") if groups_el is not None else [])
            if g.text
        )

        # SMILES from calculated-properties
        smiles = ""
        calc_props = find(elem, "calculated-properties")
        if calc_props is not None:
            for prop in find_all(calc_props, "property"):
                if text(prop, "kind") == "SMILES":
                    smiles = text(prop, "value")
                    break

        drugs_w.writerow([primary_id, name, smiles, cas_number, description,
                          indication, pharmacodyn, mechanism, toxicity, state, groups])
        n_drugs += 1

        # ── Drug-Drug Interactions ────────────────────────────────────────
        ddi_el = find(elem, "drug-interactions")
        if ddi_el is not None:
            for interaction in find_all(ddi_el, "drug-interaction"):
                b_id   = text(interaction, "drugbank-id")
                b_name = text(interaction, "name")
                desc   = text(interaction, "description")
                if not b_id:
                    continue
                severity = classify_severity(desc)

                # Deduplicate bidirectional pairs
                pair = tuple(sorted([primary_id, b_id]))
                if pair in seen_ddi:
                    continue
                seen_ddi.add(pair)

                ddi_w.writerow([primary_id, b_id, b_name, severity, desc])
                n_ddi += 1

        # ── DDI References (PubMed) ────────────────────────────────────────
        # References are on the drug itself; we attribute them to each DDI of that drug
        refs_el = find(elem, "general-references")
        if refs_el is not None and n_ddi > 0:
            articles_el = find(refs_el, "articles")
            if articles_el is not None:
                ddi_el2 = find(elem, "drug-interactions")
                if ddi_el2 is not None:
                    b_ids = [text(i, "drugbank-id") for i in find_all(ddi_el2, "drug-interaction") if text(i, "drugbank-id")]
                    for article in find_all(articles_el, "article"):
                        pubmed = text(article, "pubmed-id")
                        citation = text(article, "citation")
                        if pubmed:
                            for b_id in b_ids:
                                ref_w.writerow([primary_id, b_id, pubmed, citation])
                                n_ref += 1

        # ── Food Interactions ────────────────────────────────────────────
        food_el = find(elem, "food-interactions")
        if food_el is not None:
            for fi in find_all(food_el, "food-interaction"):
                if fi.text and fi.text.strip():
                    food_w.writerow([primary_id, fi.text.strip()])
                    n_food += 1

        # ── Indications & Contraindications (drug-conditions) ────────────
        if indication:
            cond_w.writerow([primary_id, "indication", indication])
            n_cond += 1
        if toxicity:
            cond_w.writerow([primary_id, "toxicity", toxicity])
            n_cond += 1

        # ── Targets (Drug-Target Interactions) ───────────────────────────
        targets_el = find(elem, "targets")
        if targets_el is not None:
            for target in find_all(targets_el, "target"):
                target_id  = text(target, "id")          # BE0000xxx
                known_act  = text(target, "known-action")

                poly = find(target, "polypeptide")
                if poly is not None:
                    uniprot_id       = poly.get("id", "")
                    tgt_name         = text(poly, "name")
                    gene_name_el     = text(poly, "gene-name")
                    organism_el      = text(poly, "organism")
                    gen_fn           = text(poly, "general-function")
                    spec_fn          = text(poly, "specific-function")
                    # gene symbol = same as gene-name in DrugBank polypeptide
                    gene_symbol      = gene_name_el
                else:
                    # target without polypeptide (rare)
                    uniprot_id = target_id
                    tgt_name   = ""
                    gene_name_el = gene_symbol = organism_el = ""
                    gen_fn = spec_fn = ""

                if target_id and target_id not in seen_targets:
                    seen_targets[target_id] = uniprot_id
                    tgt_w.writerow([target_id, tgt_name, uniprot_id, gene_name_el,
                                    gene_symbol, organism_el, gen_fn, spec_fn])
                    n_tgt += 1

                dti_w.writerow([primary_id, target_id, known_act, "DrugBank"])
                n_dti += 1

        # Free memory — critical for 2.59 GB file
        elem.clear()

        if n_drugs % 500 == 0:
            print(f"  [{n_drugs:>6} drugs]  DDI={n_ddi:,}  Food={n_food:,}  "
                  f"Targets={n_tgt:,}  DTI={n_dti:,}  Refs={n_ref:,}", end="\r")

        if limit and n_drugs >= limit:
            break

    # Close all files
    for f in [drugs_f, ddi_f, food_f, cond_f, tgt_f, dti_f, ref_f]:
        f.close()

    print()
    print()
    print("=" * 60)
    print("Parse complete!")
    print("=" * 60)
    print(f"  drugs.csv                     : {n_drugs:>10,}")
    print(f"  drug_drug_interactions.csv    : {n_ddi:>10,}")
    print(f"  drug_food_interactions.csv    : {n_food:>10,}")
    print(f"  drug_conditions.csv           : {n_cond:>10,}")
    print(f"  targets.csv                   : {n_tgt:>10,}")
    print(f"  drug_target_interactions.csv  : {n_dti:>10,}")
    print(f"  ddi_references.csv            : {n_ref:>10,}")
    print(f"\nCSV files saved to: {out_dir.resolve()}")
    print()
    print("Next steps:")
    print("  1. Run NestJS once with synchronize=true to create tables")
    print("  2. psql ... -f data/import_to_postgres.sql")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Parse DrugBank XML → CSV")
    parser.add_argument(
        "--xml",
        type=Path,
        default=Path(__file__).parent.parent.parent.parent / "full database.xml",
        help="Path to DrugBank full database XML (default: ../../../../full database.xml)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).parent / "processed",
        help="Output directory for CSV files (default: ./processed)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only parse first N drugs (0 = all, useful for testing)",
    )
    args = parser.parse_args()

    if not args.xml.exists():
        print(f"ERROR: XML file not found: {args.xml}", file=sys.stderr)
        print("Usage: python parse_drugbank.py --xml path/to/full\\ database.xml", file=sys.stderr)
        sys.exit(1)

    parse_drugbank(args.xml, args.out, args.limit)


if __name__ == "__main__":
    main()
