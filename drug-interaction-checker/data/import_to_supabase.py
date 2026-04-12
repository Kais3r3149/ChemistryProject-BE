"""
Import CSV data into Supabase PostgreSQL
=========================================
Reads CSV files from data/processed/ and inserts into Supabase
via psycopg2 over the Transaction Pooler port (6543).

Usage:
    python data/import_to_supabase.py

Prerequisites:
    pip install psycopg2-binary pandas python-dotenv
    NestJS app must have run at least once with synchronize=true
    to create the tables.
"""

import os
import math
import csv
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
PROCESSED_DIR = BASE_DIR / "processed"
ENV_FILE = BASE_DIR.parent / ".env"

BATCH_SIZE = 500  # rows per INSERT batch


def load_database_url() -> str:
    """Load DATABASE_URL from .env file."""
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    url = line.split("=", 1)[1].strip()
                    # Remove quotes if present
                    if url.startswith('"') and url.endswith('"'):
                        url = url[1:-1]
                    if url.startswith("'") and url.endswith("'"):
                        url = url[1:-1]
                    return url

    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url

    raise RuntimeError(
        "DATABASE_URL not found. Set it in .env or as environment variable."
    )


def clean_value(val):
    """Convert pandas NaN/None to Python None for psycopg2."""
    if val is None:
        return None
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    if isinstance(val, str) and val.strip() == "":
        return None
    return val


def clean_int(val):
    """Convert value to int, handling float IDs like '1.0'."""
    if val is None:
        return None
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        return int(val)
    if isinstance(val, str):
        val = val.strip()
        if val == "":
            return None
        return int(float(val))
    return int(val)


def clean_float(val):
    """Convert value to float, handling NaN."""
    if val is None:
        return None
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    if isinstance(val, str):
        val = val.strip()
        if val == "":
            return None
        return float(val)
    return float(val)


def truncate_str(val, max_len: int):
    """Truncate string to max_len, return None if empty."""
    val = clean_value(val)
    if val is None:
        return None
    s = str(val)
    if len(s) > max_len:
        return s[:max_len]
    return s


def import_table(
    conn,
    table_name: str,
    csv_file: str,
    columns: list[str],
    row_mapper,
    *,
    reset_sequence: bool = True,
):
    """Generic CSV → PostgreSQL table importer.

    Args:
        conn: psycopg2 connection
        table_name: PostgreSQL table name (e.g. 'drugs')
        csv_file: CSV filename in processed/ dir
        columns: list of DB column names to INSERT
        row_mapper: function(row_dict) → tuple of values matching columns
        reset_sequence: whether to reset the id sequence after import
    """
    csv_path = PROCESSED_DIR / csv_file
    if not csv_path.exists():
        print(f"  ⚠ {csv_file} not found, skipping {table_name}")
        return 0

    df = pd.read_csv(csv_path)
    total = len(df)
    if total == 0:
        print(f"  ⚠ {csv_file} is empty, skipping {table_name}")
        return 0

    print(f"  Importing {total:,} rows → {table_name}...")

    # Truncate existing data
    cur = conn.cursor()
    cur.execute(f'TRUNCATE TABLE "{table_name}" CASCADE')

    cols_quoted = ", ".join(f'"{c}"' for c in columns)
    insert_sql = f'INSERT INTO "{table_name}" ({cols_quoted}) VALUES %s'

    imported = 0
    batch = []

    for _, row in df.iterrows():
        try:
            values = row_mapper(row)
        except (ValueError, KeyError, TypeError) as exc:
            print(f"    Skip row: {exc}")
            continue

        batch.append(values)

        if len(batch) >= BATCH_SIZE:
            execute_values(cur, insert_sql, batch)
            imported += len(batch)
            batch = []

    if batch:
        execute_values(cur, insert_sql, batch)
        imported += len(batch)

    # Reset sequence to max(id) + 1
    if reset_sequence and "id" in columns:
        cur.execute(
            f"""SELECT setval(
                pg_get_serial_sequence('"{table_name}"', 'id'),
                COALESCE((SELECT MAX("id") FROM "{table_name}"), 1)
            )"""
        )

    conn.commit()
    cur.close()
    print(f"    ✓ {imported:,} / {total:,} rows imported")
    return imported


# ---------------------------------------------------------------------------
# Table-specific mappers
# ---------------------------------------------------------------------------

def map_drug(row):
    return (
        clean_int(row["id"]),
        truncate_str(row["name"], 500),
        truncate_str(row.get("smiles"), 1000),
        truncate_str(row.get("drugbank_id"), 20),
        truncate_str(row.get("pubchem_cid"), 50),
        truncate_str(row.get("description"), 2000),
    )


def map_ddi(row):
    return (
        clean_int(row["id"]),
        clean_int(row["drug_a_id"]),
        clean_int(row["drug_b_id"]),
        clean_int(row["interaction_type"]),
        truncate_str(row.get("severity"), 20) or "unknown",
        truncate_str(row.get("description"), 2000),
        clean_float(row.get("confidence")),
        truncate_str(row.get("source"), 50) or "TDC",
    )


def map_target(row):
    return (
        clean_int(row["id"]),
        truncate_str(row["name"], 500),
        truncate_str(row.get("uniprot_id"), 50),
        truncate_str(row.get("gene_symbol"), 50),
        truncate_str(row.get("organism"), 50),
    )


def map_dti(row):
    return (
        clean_int(row["id"]),
        clean_int(row["drug_id"]),
        clean_int(row["target_id"]),
        clean_float(row.get("affinity")),
        truncate_str(row.get("affinity_unit"), 20),
        truncate_str(row.get("source"), 50) or "TDC",
    )


def map_ppi(row):
    return (
        clean_int(row["id"]),
        truncate_str(row["protein_a_uniprot_id"], 50),
        truncate_str(row.get("protein_a_name"), 500),
        truncate_str(row["protein_b_uniprot_id"], 50),
        truncate_str(row.get("protein_b_name"), 500),
        clean_float(row.get("score")),
        truncate_str(row.get("source"), 50) or "TDC",
    )


def map_cell_line(row):
    cell_id = truncate_str(row["cell_line_id"], 100)
    name_val = truncate_str(row.get("name"), 500)

    # GDSC "Cell Line" column contains expression vectors (numpy arrays),
    # not actual cell line names. Use cell_line_id as name in that case.
    if name_val and (name_val.startswith("[") or len(name_val) > 200):
        name_val = cell_id

    return (
        clean_int(row["id"]),
        cell_id,
        name_val or cell_id,
        truncate_str(row.get("tissue_name"), 500),
        truncate_str(row.get("cancer_type"), 500),
    )


def map_drug_response(row):
    return (
        clean_int(row["id"]),
        clean_int(row["drug_id"]),
        clean_int(row["cell_line_id"]),
        clean_float(row["value"]),
        truncate_str(row.get("metric"), 10) or "IC50",
        truncate_str(row.get("source"), 50) or "TDC-GDSC",
    )


def map_gene(row):
    return (
        clean_int(row["id"]),
        truncate_str(row["gene_symbol"], 50),
        truncate_str(row.get("gene_name"), 500),
        truncate_str(row.get("entrez_id"), 20),
    )


def map_disease(row):
    return (
        clean_int(row["id"]),
        truncate_str(row["disease_id"], 20),
        truncate_str(row["disease_name"], 500),
        truncate_str(row.get("disease_type"), 50),
        truncate_str(row.get("disease_class"), 50),
    )


def map_gda(row):
    return (
        clean_int(row["id"]),
        clean_int(row["gene_id"]),
        clean_int(row["disease_id"]),
        clean_float(row["score"]),
        clean_float(row.get("evidence_index")),  # → ei
        None,                                      # el (not in CSV)
        truncate_str(row.get("source"), 50) or "DisGeNET",
    )


# ---------------------------------------------------------------------------
# Import orchestration
# ---------------------------------------------------------------------------

# Order matters: parent tables first (drugs, targets, cell_lines, genes,
# diseases), then child tables with foreign keys.
IMPORT_PLAN = [
    {
        "table": "drugs",
        "csv": "drugs.csv",
        "columns": ["id", "name", "smiles", "drugbankId", "pubchemCid", "description"],
        "mapper": map_drug,
    },
    {
        "table": "targets",
        "csv": "targets.csv",
        "columns": ["id", "name", "uniprotId", "geneSymbol", "organism"],
        "mapper": map_target,
    },
    {
        "table": "cell_lines",
        "csv": "cell_lines.csv",
        "columns": ["id", "cellLineId", "name", "tissueName", "cancerType"],
        "mapper": map_cell_line,
    },
    {
        "table": "genes",
        "csv": "genes.csv",
        "columns": ["id", "geneSymbol", "geneName", "entrezId"],
        "mapper": map_gene,
    },
    {
        "table": "diseases",
        "csv": "diseases.csv",
        "columns": ["id", "diseaseId", "diseaseName", "diseaseType", "diseaseClass"],
        "mapper": map_disease,
    },
    {
        "table": "drug_drug_interactions",
        "csv": "drug_drug_interactions.csv",
        "columns": [
            "id", "drugAId", "drugBId", "interactionType",
            "severity", "description", "confidence", "source",
        ],
        "mapper": map_ddi,
    },
    {
        "table": "drug_target_interactions",
        "csv": "drug_target_interactions.csv",
        "columns": ["id", "drugId", "targetId", "affinity", "affinityUnit", "source"],
        "mapper": map_dti,
    },
    {
        "table": "protein_protein_interactions",
        "csv": "protein_protein_interactions.csv",
        "columns": [
            "id", "proteinAUniprotId", "proteinAName",
            "proteinBUniprotId", "proteinBName", "score", "source",
        ],
        "mapper": map_ppi,
    },
    {
        "table": "drug_responses",
        "csv": "drug_responses.csv",
        "columns": ["id", "drugId", "cellLineId", "value", "metric", "source"],
        "mapper": map_drug_response,
    },
    {
        "table": "gene_disease_associations",
        "csv": "gene_disease_associations.csv",
        "columns": ["id", "geneId", "diseaseId", "score", "ei", "el", "source"],
        "mapper": map_gda,
    },
]


def main():
    print("=" * 60)
    print("Import CSV Data → Supabase PostgreSQL")
    print("=" * 60)

    db_url = load_database_url()
    # Mask password in log
    masked = db_url.split("@")[1] if "@" in db_url else db_url
    print(f"  Connecting to: ...@{masked}")

    conn = psycopg2.connect(db_url)
    print("  ✓ Connected\n")

    results = {}
    for plan in IMPORT_PLAN:
        count = import_table(
            conn,
            plan["table"],
            plan["csv"],
            plan["columns"],
            plan["mapper"],
        )
        results[plan["table"]] = count

    conn.close()

    print("\n" + "=" * 60)
    print("Import Summary")
    print("=" * 60)
    for table, count in results.items():
        status = "✓" if count > 0 else "⚠"
        print(f"  {status} {table}: {count:,} rows")
    print("=" * 60)


if __name__ == "__main__":
    main()
