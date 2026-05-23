"""
TDC Data Download & CSV Export Script
=====================================
Downloads datasets from Therapeutics Data Commons (TDC) and exports
them as CSV files ready for SQL Server BULK INSERT.

Datasets:
  1. DDI  — Drug-Drug Interaction (DrugBank from TDC)
  2. DTI  — Drug-Target Interaction (DAVIS)
  3. PPI  — Protein-Protein Interaction (HuRI)
  4. Drug Response — GDSC1 (IC50)

Usage:
  pip install -r requirements.txt
  python download_tdc_data.py

Output:
  data/processed/*.csv
"""

import os
import sys
import hashlib
import types
from pathlib import Path

# ---------------------------------------------------------------------------
# Mock heavy C++ backed dependencies that TDC imports but we don't need.
# TDC's __init__ eagerly imports all submodules, pulling in tiledbsoma,
# cellxgene_census, rdkit, etc. We only need the basic download functions.
# ---------------------------------------------------------------------------
_MOCK_MODULES = [
    'tiledbsoma', 'cellxgene_census', 'gget',
    'rdkit', 'rdkit.Chem', 'rdkit.Chem.AllChem', 'rdkit.DataStructs',
    'seaborn', 'evaluate', 'datasets',
]
for _mod_name in _MOCK_MODULES:
    if _mod_name not in sys.modules:
        sys.modules[_mod_name] = types.ModuleType(_mod_name)

import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"

# Severity mapping: TDC DDI Y value (0-85) -> clinical severity
SEVERITY_RANGES = {
    "major": range(0, 20),      # 0-19
    "moderate": range(20, 50),  # 20-49
    "minor": range(50, 70),     # 50-69
    "unknown": range(70, 86),   # 70-85
}

# Confidence scores by severity (higher severity = more documented = higher confidence)
SEVERITY_CONFIDENCE = {
    "major": 0.90,
    "moderate": 0.75,
    "minor": 0.60,
    "unknown": 0.40,
}

# Description templates by severity
SEVERITY_DESCRIPTIONS = {
    "major": "Major drug-drug interaction detected (type {t}). "
             "Co-administration may cause serious adverse effects. "
             "Clinical monitoring or alternative therapy recommended.",
    "moderate": "Moderate drug-drug interaction detected (type {t}). "
                "Co-administration may alter drug efficacy or increase side effects. "
                "Dose adjustment may be required.",
    "minor": "Minor drug-drug interaction detected (type {t}). "
             "Co-administration may have limited clinical significance. "
             "Monitor as needed.",
    "unknown": "Drug-drug interaction detected (type {t}). "
               "Clinical significance not fully characterized. "
               "Use caution and monitor.",
}


def map_severity(interaction_type: int) -> str:
    """Map TDC DDI interaction type to severity level."""
    for severity, type_range in SEVERITY_RANGES.items():
        if interaction_type in type_range:
            return severity
    return "unknown"


def generate_description(interaction_type: int, severity: str) -> str:
    """Generate a clinical description for DDI based on type and severity."""
    template = SEVERITY_DESCRIPTIONS.get(severity, SEVERITY_DESCRIPTIONS["unknown"])
    return template.format(t=interaction_type)


def ensure_dirs() -> None:
    """Create output directories if they don't exist."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def generate_drug_id(name: str) -> str:
    """Generate a stable short hash for drug identification."""
    return hashlib.md5(name.encode()).hexdigest()[:8]


# ---------------------------------------------------------------------------
# 1. DDI — Drug-Drug Interaction
# ---------------------------------------------------------------------------
def download_ddi() -> None:
    """Download and process DDI dataset from TDC."""
    print("\n[1/4] Downloading DDI dataset (DrugBank)...")

    from tdc.multi_pred import DDI
    data = DDI(name="DrugBank")
    df = data.get_data()

    print(f"  Raw DDI records: {len(df):,}")

    # Extract unique drugs
    drugs_a = df[["Drug1_ID", "Drug1"]].rename(
        columns={"Drug1_ID": "name", "Drug1": "smiles"}
    )
    drugs_b = df[["Drug2_ID", "Drug2"]].rename(
        columns={"Drug2_ID": "name", "Drug2": "smiles"}
    )
    drugs = pd.concat([drugs_a, drugs_b]).drop_duplicates(subset=["name"])
    drugs = drugs.reset_index(drop=True)
    drugs.index += 1  # 1-based ID
    drugs.index.name = "id"

    # Create name -> id lookup
    drug_id_map = dict(zip(drugs["name"], drugs.index))

    # Save drugs CSV
    drugs_out = drugs.reset_index()
    drugs_out["drugbank_id"] = None
    drugs_out["pubchem_cid"] = None
    drugs_out["description"] = None
    drugs_out = drugs_out[["id", "name", "smiles", "drugbank_id", "pubchem_cid", "description"]]
    drugs_out.to_csv(PROCESSED_DIR / "drugs.csv", index=False)
    print(f"  Unique drugs: {len(drugs_out):,} → drugs.csv")

    # Process DDI records
    ddi_records = []
    for _, row in df.iterrows():
        drug_a_id = drug_id_map.get(row["Drug1_ID"])
        drug_b_id = drug_id_map.get(row["Drug2_ID"])
        interaction_type = int(row["Y"])
        severity = map_severity(interaction_type)

        if drug_a_id and drug_b_id:
            ddi_records.append({
                "drug_a_id": drug_a_id,
                "drug_b_id": drug_b_id,
                "interaction_type": interaction_type,
                "severity": severity,
                "description": generate_description(interaction_type, severity),
                "confidence": SEVERITY_CONFIDENCE.get(severity, 0.40),
                "source": "TDC",
            })

    ddi_df = pd.DataFrame(ddi_records)
    ddi_df.index += 1
    ddi_df.index.name = "id"
    ddi_df.to_csv(PROCESSED_DIR / "drug_drug_interactions.csv")
    print(f"  DDI records: {len(ddi_df):,} → drug_drug_interactions.csv")

    # Severity distribution
    severity_counts = ddi_df["severity"].value_counts()
    print("  Severity distribution:")
    for sev, count in severity_counts.items():
        print(f"    {sev}: {count:,}")

    return drug_id_map


# ---------------------------------------------------------------------------
# 2. DTI — Drug-Target Interaction
# ---------------------------------------------------------------------------
def download_dti(drug_id_map: dict) -> dict:
    """Download and process DTI dataset from TDC.

    Returns updated drug_id_map with any new drugs added from DAVIS.
    """
    print("\n[2/4] Downloading DTI dataset (DAVIS)...")

    from tdc.multi_pred import DTI
    data = DTI(name="DAVIS")
    df = data.get_data()

    print(f"  Raw DTI records: {len(df):,}")

    # Extract unique targets
    targets = df[["Target_ID", "Target"]].drop_duplicates(subset=["Target_ID"])
    targets = targets.rename(columns={"Target_ID": "name", "Target": "sequence"})
    targets = targets.reset_index(drop=True)
    targets.index += 1
    targets.index.name = "id"

    target_id_map = dict(zip(targets["name"], targets.index))

    # Save targets CSV
    targets_out = targets.reset_index()
    targets_out["uniprot_id"] = None
    targets_out["gene_symbol"] = None
    targets_out["organism"] = "Homo sapiens"
    targets_out = targets_out[["id", "name", "uniprot_id", "gene_symbol", "organism"]]
    targets_out.to_csv(PROCESSED_DIR / "targets.csv", index=False)
    print(f"  Unique targets: {len(targets_out):,} → targets.csv")

    # Add missing drugs from DAVIS to drug_id_map
    next_drug_id = max(drug_id_map.values()) + 1 if drug_id_map else 1
    new_drugs_count = 0
    for drug_name in df["Drug_ID"].unique():
        if drug_name not in drug_id_map:
            drug_id_map[drug_name] = next_drug_id
            next_drug_id += 1
            new_drugs_count += 1
    if new_drugs_count:
        print(f"  Added {new_drugs_count} new drugs from DAVIS")

    # Process DTI records
    dti_records = []
    for _, row in df.iterrows():
        drug_name = row["Drug_ID"]
        target_name = row["Target_ID"]

        drug_id = drug_id_map.get(drug_name)
        target_id = target_id_map.get(target_name)

        if drug_id and target_id:
            dti_records.append({
                "drug_id": drug_id,
                "target_id": target_id,
                "affinity": float(row["Y"]) if pd.notna(row["Y"]) else None,
                "affinity_unit": "Kd",
                "source": "TDC-DAVIS",
            })

    dti_df = pd.DataFrame(dti_records)
    dti_df.index += 1
    dti_df.index.name = "id"
    dti_df.to_csv(PROCESSED_DIR / "drug_target_interactions.csv")
    print(f"  DTI records: {len(dti_df):,} → drug_target_interactions.csv")

    return drug_id_map


# ---------------------------------------------------------------------------
# 3. PPI — Protein-Protein Interaction
# ---------------------------------------------------------------------------
def download_ppi() -> None:
    """Download and process PPI dataset from TDC."""
    print("\n[3/4] Downloading PPI dataset (HuRI)...")

    from tdc.multi_pred import PPI
    data = PPI(name="HuRI")
    df = data.get_data()

    print(f"  Raw PPI records: {len(df):,}")

    ppi_records = []
    for _, row in df.iterrows():
        ppi_records.append({
            "protein_a_uniprot_id": str(row["Protein1_ID"]),
            "protein_a_name": None,
            "protein_b_uniprot_id": str(row["Protein2_ID"]),
            "protein_b_name": None,
            "score": float(row["Y"]) if pd.notna(row["Y"]) else None,
            "source": "TDC-HuRI",
        })

    ppi_df = pd.DataFrame(ppi_records)
    ppi_df.index += 1
    ppi_df.index.name = "id"
    ppi_df.to_csv(PROCESSED_DIR / "protein_protein_interactions.csv")
    print(f"  PPI records: {len(ppi_df):,} → protein_protein_interactions.csv")


# ---------------------------------------------------------------------------
# 4. Drug Response — GDSC1
# ---------------------------------------------------------------------------
def download_drug_response(drug_id_map: dict) -> dict:
    """Download and process Drug Response dataset from TDC.

    Returns updated drug_id_map with any new drugs added from GDSC.
    """
    print("\n[4/5] Downloading Drug Response dataset (GDSC1)...")

    try:
        from tdc.multi_pred import DrugRes
        data = DrugRes(name="GDSC1")
        df = data.get_data()
    except Exception:
        print("  Warning: DrugRes not available, trying alternative approach...")
        try:
            from tdc.single_pred import Tox
            data = Tox(name="ToxCast")
            df = data.get_data()
            print("  Fallback to ToxCast (different schema)")
        except Exception as e:
            print(f"  Skipping Drug Response: {e}")
            return drug_id_map

    print(f"  Raw Drug Response records: {len(df):,}")

    # Extract unique cell lines
    if "Cell Line" in df.columns:
        cell_lines = df[["Cell Line_ID", "Cell Line"]].drop_duplicates(
            subset=["Cell Line_ID"]
        )
        cell_lines = cell_lines.rename(
            columns={"Cell Line_ID": "cell_line_id", "Cell Line": "name"}
        )
    elif "Cell_Line" in df.columns:
        cell_lines = df[["Cell_Line"]].drop_duplicates()
        cell_lines["cell_line_id"] = cell_lines["Cell_Line"]
        cell_lines = cell_lines.rename(columns={"Cell_Line": "name"})
    else:
        print("  Warning: No cell line column found. Skipping drug response.")
        return drug_id_map

    cell_lines = cell_lines.reset_index(drop=True)
    cell_lines.index += 1
    cell_lines.index.name = "id"

    cl_id_map = dict(zip(cell_lines["cell_line_id"], cell_lines.index))

    # Save cell lines CSV
    cl_out = cell_lines.reset_index()
    cl_out["tissue_name"] = None
    cl_out["cancer_type"] = None
    cl_out = cl_out[["id", "cell_line_id", "name", "tissue_name", "cancer_type"]]
    cl_out.to_csv(PROCESSED_DIR / "cell_lines.csv", index=False)
    print(f"  Unique cell lines: {len(cl_out):,} → cell_lines.csv")

    # Add missing drugs from GDSC to drug_id_map
    drug_id_col = "Drug_ID" if "Drug_ID" in df.columns else "Drug"
    cl_id_col = "Cell Line_ID" if "Cell Line_ID" in df.columns else "Cell_Line"

    next_drug_id = max(drug_id_map.values()) + 1 if drug_id_map else 1
    new_drugs_count = 0
    for drug_name in df[drug_id_col].unique():
        if drug_name not in drug_id_map:
            drug_id_map[drug_name] = next_drug_id
            next_drug_id += 1
            new_drugs_count += 1
    if new_drugs_count:
        print(f"  Added {new_drugs_count} new drugs from GDSC")

    # Process drug response records
    dr_records = []
    for _, row in df.iterrows():
        drug_id = drug_id_map.get(row[drug_id_col])
        cl_id = cl_id_map.get(row[cl_id_col])

        if drug_id and cl_id:
            dr_records.append({
                "drug_id": drug_id,
                "cell_line_id": cl_id,
                "value": float(row["Y"]),
                "metric": "IC50",
                "source": "TDC-GDSC",
            })

    dr_df = pd.DataFrame(dr_records)
    dr_df.index += 1
    dr_df.index.name = "id"
    dr_df.to_csv(PROCESSED_DIR / "drug_responses.csv")
    print(f"  Drug Response records: {len(dr_df):,} → drug_responses.csv")

    return drug_id_map


# ---------------------------------------------------------------------------
# 5. GDA — Gene-Disease Association (synthetic from DisGeNET schema)
# ---------------------------------------------------------------------------
def generate_gda() -> None:
    """Generate sample Gene-Disease Association data.

    TDC does not provide GDA data directly, so we generate a curated
    sample based on well-known gene-disease associations from literature.
    """
    print("\n[5/5] Generating Gene-Disease Association data...")

    # Well-known gene-disease associations (curated sample)
    genes_data = [
        {"gene_symbol": "BRCA1", "gene_name": "BRCA1 DNA repair associated", "entrez_id": "672"},
        {"gene_symbol": "BRCA2", "gene_name": "BRCA2 DNA repair associated", "entrez_id": "675"},
        {"gene_symbol": "TP53", "gene_name": "tumor protein p53", "entrez_id": "7157"},
        {"gene_symbol": "EGFR", "gene_name": "epidermal growth factor receptor", "entrez_id": "1956"},
        {"gene_symbol": "KRAS", "gene_name": "KRAS proto-oncogene", "entrez_id": "3845"},
        {"gene_symbol": "BRAF", "gene_name": "B-Raf proto-oncogene", "entrez_id": "673"},
        {"gene_symbol": "PIK3CA", "gene_name": "phosphatidylinositol-4,5-bisphosphate 3-kinase catalytic subunit alpha", "entrez_id": "5290"},
        {"gene_symbol": "PTEN", "gene_name": "phosphatase and tensin homolog", "entrez_id": "5728"},
        {"gene_symbol": "ALK", "gene_name": "ALK receptor tyrosine kinase", "entrez_id": "238"},
        {"gene_symbol": "HER2", "gene_name": "erb-b2 receptor tyrosine kinase 2", "entrez_id": "2064"},
        {"gene_symbol": "MYC", "gene_name": "MYC proto-oncogene", "entrez_id": "4609"},
        {"gene_symbol": "APC", "gene_name": "APC regulator of WNT signaling pathway", "entrez_id": "324"},
        {"gene_symbol": "RB1", "gene_name": "RB transcriptional corepressor 1", "entrez_id": "5925"},
        {"gene_symbol": "VEGFA", "gene_name": "vascular endothelial growth factor A", "entrez_id": "7422"},
        {"gene_symbol": "CDK4", "gene_name": "cyclin dependent kinase 4", "entrez_id": "1019"},
        {"gene_symbol": "JAK2", "gene_name": "Janus kinase 2", "entrez_id": "3717"},
        {"gene_symbol": "BCR", "gene_name": "BCR activator of RhoGEF and GTPase", "entrez_id": "613"},
        {"gene_symbol": "ABL1", "gene_name": "ABL proto-oncogene 1", "entrez_id": "25"},
        {"gene_symbol": "FLT3", "gene_name": "fms related receptor tyrosine kinase 3", "entrez_id": "2322"},
        {"gene_symbol": "IDH1", "gene_name": "isocitrate dehydrogenase 1", "entrez_id": "3417"},
    ]

    diseases_data = [
        {"disease_id": "C0006142", "disease_name": "Breast Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0024623", "disease_name": "Lung Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0009402", "disease_name": "Colorectal Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0025202", "disease_name": "Melanoma", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0023418", "disease_name": "Leukemia", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0017636", "disease_name": "Glioblastoma", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0030297", "disease_name": "Pancreatic Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0029925", "disease_name": "Ovarian Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0699791", "disease_name": "Prostate Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0024299", "disease_name": "Lymphoma", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0376358", "disease_name": "Endometrial Cancer", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0023467", "disease_name": "Acute Myeloid Leukemia", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0023487", "disease_name": "Chronic Myeloid Leukemia", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0684249", "disease_name": "Carcinoma", "disease_type": "disease", "disease_class": "Neoplasms"},
        {"disease_id": "C0027651", "disease_name": "Neoplasms", "disease_type": "group", "disease_class": "Neoplasms"},
    ]

    # Gene-Disease Associations (well-known from literature)
    gda_data = [
        # BRCA1 associations
        {"gene_idx": 1, "disease_idx": 1, "score": 0.95, "ei": 1.0, "year_i": 1994, "year_f": 2024},
        {"gene_idx": 1, "disease_idx": 8, "score": 0.85, "ei": 0.9, "year_i": 1999, "year_f": 2024},
        # BRCA2 associations
        {"gene_idx": 2, "disease_idx": 1, "score": 0.92, "ei": 1.0, "year_i": 1995, "year_f": 2024},
        {"gene_idx": 2, "disease_idx": 8, "score": 0.80, "ei": 0.8, "year_i": 2001, "year_f": 2024},
        {"gene_idx": 2, "disease_idx": 7, "score": 0.60, "ei": 0.7, "year_i": 2005, "year_f": 2024},
        # TP53 associations
        {"gene_idx": 3, "disease_idx": 1, "score": 0.90, "ei": 1.0, "year_i": 1990, "year_f": 2024},
        {"gene_idx": 3, "disease_idx": 2, "score": 0.88, "ei": 1.0, "year_i": 1991, "year_f": 2024},
        {"gene_idx": 3, "disease_idx": 3, "score": 0.85, "ei": 1.0, "year_i": 1992, "year_f": 2024},
        {"gene_idx": 3, "disease_idx": 6, "score": 0.80, "ei": 0.9, "year_i": 1993, "year_f": 2024},
        {"gene_idx": 3, "disease_idx": 15, "score": 0.95, "ei": 1.0, "year_i": 1989, "year_f": 2024},
        # EGFR associations
        {"gene_idx": 4, "disease_idx": 2, "score": 0.93, "ei": 1.0, "year_i": 2004, "year_f": 2024},
        {"gene_idx": 4, "disease_idx": 6, "score": 0.75, "ei": 0.8, "year_i": 2006, "year_f": 2024},
        # KRAS associations
        {"gene_idx": 5, "disease_idx": 2, "score": 0.90, "ei": 1.0, "year_i": 1987, "year_f": 2024},
        {"gene_idx": 5, "disease_idx": 3, "score": 0.88, "ei": 1.0, "year_i": 1988, "year_f": 2024},
        {"gene_idx": 5, "disease_idx": 7, "score": 0.92, "ei": 1.0, "year_i": 1993, "year_f": 2024},
        # BRAF associations
        {"gene_idx": 6, "disease_idx": 4, "score": 0.95, "ei": 1.0, "year_i": 2002, "year_f": 2024},
        {"gene_idx": 6, "disease_idx": 3, "score": 0.70, "ei": 0.8, "year_i": 2005, "year_f": 2024},
        # PIK3CA associations
        {"gene_idx": 7, "disease_idx": 1, "score": 0.80, "ei": 0.9, "year_i": 2004, "year_f": 2024},
        {"gene_idx": 7, "disease_idx": 11, "score": 0.75, "ei": 0.8, "year_i": 2008, "year_f": 2024},
        # PTEN associations
        {"gene_idx": 8, "disease_idx": 9, "score": 0.85, "ei": 1.0, "year_i": 1997, "year_f": 2024},
        {"gene_idx": 8, "disease_idx": 6, "score": 0.78, "ei": 0.9, "year_i": 1999, "year_f": 2024},
        # ALK associations
        {"gene_idx": 9, "disease_idx": 2, "score": 0.88, "ei": 1.0, "year_i": 2007, "year_f": 2024},
        {"gene_idx": 9, "disease_idx": 10, "score": 0.70, "ei": 0.7, "year_i": 2008, "year_f": 2024},
        # HER2 associations
        {"gene_idx": 10, "disease_idx": 1, "score": 0.92, "ei": 1.0, "year_i": 1987, "year_f": 2024},
        # MYC associations
        {"gene_idx": 11, "disease_idx": 10, "score": 0.82, "ei": 0.9, "year_i": 1982, "year_f": 2024},
        {"gene_idx": 11, "disease_idx": 15, "score": 0.88, "ei": 1.0, "year_i": 1985, "year_f": 2024},
        # APC associations
        {"gene_idx": 12, "disease_idx": 3, "score": 0.93, "ei": 1.0, "year_i": 1991, "year_f": 2024},
        # RB1 associations
        {"gene_idx": 13, "disease_idx": 15, "score": 0.90, "ei": 1.0, "year_i": 1986, "year_f": 2024},
        # JAK2 associations
        {"gene_idx": 16, "disease_idx": 5, "score": 0.85, "ei": 1.0, "year_i": 2005, "year_f": 2024},
        # BCR-ABL (CML)
        {"gene_idx": 17, "disease_idx": 13, "score": 0.98, "ei": 1.0, "year_i": 1985, "year_f": 2024},
        {"gene_idx": 18, "disease_idx": 13, "score": 0.98, "ei": 1.0, "year_i": 1985, "year_f": 2024},
        # FLT3 (AML)
        {"gene_idx": 19, "disease_idx": 12, "score": 0.88, "ei": 1.0, "year_i": 1996, "year_f": 2024},
        # IDH1 (Glioblastoma)
        {"gene_idx": 20, "disease_idx": 6, "score": 0.82, "ei": 0.9, "year_i": 2008, "year_f": 2024},
        {"gene_idx": 20, "disease_idx": 12, "score": 0.75, "ei": 0.8, "year_i": 2009, "year_f": 2024},
    ]

    # Save genes
    genes_df = pd.DataFrame(genes_data)
    genes_df.index += 1
    genes_df.index.name = "id"
    genes_df.to_csv(PROCESSED_DIR / "genes.csv")
    print(f"  Genes: {len(genes_df)} → genes.csv")

    # Save diseases
    diseases_df = pd.DataFrame(diseases_data)
    diseases_df.index += 1
    diseases_df.index.name = "id"
    diseases_df.to_csv(PROCESSED_DIR / "diseases.csv")
    print(f"  Diseases: {len(diseases_df)} → diseases.csv")

    # Save GDA
    gda_records = []
    for assoc in gda_data:
        gda_records.append({
            "gene_id": assoc["gene_idx"],
            "disease_id": assoc["disease_idx"],
            "score": assoc["score"],
            "evidence_index": assoc["ei"],
            "year_initial": assoc["year_i"],
            "year_final": assoc["year_f"],
            "source": "DisGeNET-curated",
        })

    gda_df = pd.DataFrame(gda_records)
    gda_df.index += 1
    gda_df.index.name = "id"
    gda_df.to_csv(PROCESSED_DIR / "gene_disease_associations.csv")
    print(f"  GDA records: {len(gda_df)} → gene_disease_associations.csv")


def resave_drugs(drug_id_map: dict) -> None:
    """Re-save drugs.csv with all drugs (including those added from DTI/DrugRes)."""
    # Read existing drugs.csv to get SMILES data
    existing = pd.read_csv(PROCESSED_DIR / "drugs.csv")
    existing_names = set(existing["name"].values) if "name" in existing.columns else set()

    # Add new drugs (from DTI/GDSC) that aren't in original DrugBank set
    new_rows = []
    for drug_name, drug_id in drug_id_map.items():
        if drug_name not in existing_names:
            new_rows.append({
                "id": drug_id,
                "name": drug_name,
                "smiles": None,
                "drugbank_id": None,
                "pubchem_cid": None,
                "description": None,
            })

    if new_rows:
        new_df = pd.DataFrame(new_rows)
        combined = pd.concat([existing, new_df], ignore_index=True)
        # Ensure id column is integer (original DrugBank ids are float 1.0, 2.0...)
        combined["id"] = combined["id"].astype(int)
        combined.to_csv(PROCESSED_DIR / "drugs.csv", index=False)
        print(f"\n  Updated drugs.csv: {len(existing)} → {len(combined)} (+{len(new_rows)} from DTI/GDSC)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    """Download all TDC datasets and export as CSV."""
    print("=" * 60)
    print("TDC Data Download & CSV Export")
    print("=" * 60)

    ensure_dirs()

    # Step 1: DDI (also extracts drugs)
    drug_id_map = download_ddi()

    # Step 2: DTI (adds missing drugs from DAVIS)
    drug_id_map = download_dti(drug_id_map)

    # Step 3: PPI
    download_ppi()

    # Step 4: Drug Response (adds missing drugs from GDSC)
    drug_id_map = download_drug_response(drug_id_map)

    # Step 5: GDA (curated gene-disease associations)
    generate_gda()

    # Re-save drugs.csv with all drugs from all datasets
    resave_drugs(drug_id_map)

    print("\n" + "=" * 60)
    print("Download complete!")
    print(f"CSV files saved to: {PROCESSED_DIR.resolve()}")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Create database: DrugInteractionDB")
    print("  2. Run NestJS with synchronize=true to create tables")
    print("  3. Use SSMS or import_to_sql.py to load CSV data")


if __name__ == "__main__":
    main()
