"""
Import DrugBank CSV files into SQL Server
==========================================
Uses pyodbc for fast batch inserts, handles multi-line quoted CSV fields correctly.

Requirements:
    pip install pyodbc pandas

Usage:
    python import_to_sqlserver.py
    python import_to_sqlserver.py --server localhost\\SQLEXPRESS --db DrugInteractionDB
"""

import argparse
import csv
import sys
import time
from pathlib import Path

try:
    import pyodbc
except ImportError:
    print("ERROR: pyodbc not installed. Run: pip install pyodbc")
    sys.exit(1)

DATA_DIR = Path(__file__).parent / "processed"

BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------
def get_connection(server: str, database: str, username: str = None, password: str = None):
    if username:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};PWD={password};"
            f"TrustServerCertificate=yes;"
        )
    else:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes;"
            f"TrustServerCertificate=yes;"
        )
    return pyodbc.connect(conn_str, autocommit=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def nullify(val: str):
    return val.strip() if val and val.strip() else None


def batch_insert(cursor, sql: str, rows: list):
    if not rows:
        return
    cursor.executemany(sql, rows)


def read_csv(path: Path):
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


def progress(msg: str):
    print(f"  {msg}", end="\r")


# ---------------------------------------------------------------------------
# 1. Drugs
# ---------------------------------------------------------------------------
def import_drugs(cursor) -> dict:
    print("\n[1/5] Importing drugs...")
    rows = read_csv(DATA_DIR / "drugs.csv")
    print(f"  Read {len(rows):,} rows from drugs.csv")

    cursor.execute("ALTER TABLE drugs ALTER COLUMN smiles NVARCHAR(MAX)")
    cursor.connection.commit()
    cursor.execute("DELETE FROM drugs")

    sql = """
        INSERT INTO drugs
            (drugbankId, name, smiles, casNumber, description, indication,
             pharmacodynamics, mechanismOfAction, toxicity, state, groups)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """

    batch = []
    for i, r in enumerate(rows):
        batch.append((
            nullify(r["drugbank_id"]),
            nullify(r["name"]) or "Unknown",
            nullify(r["smiles"]),
            nullify(r["cas_number"]),
            nullify(r["description"]),
            nullify(r["indication"]),
            nullify(r["pharmacodynamics"]),
            nullify(r["mechanism_of_action"]),
            nullify(r["toxicity"]),
            nullify(r["state"]),
            nullify(r["groups"]),
        ))
        if len(batch) >= BATCH_SIZE:
            batch_insert(cursor, sql, batch)
            batch = []
            progress(f"{i+1:,}/{len(rows):,} drugs inserted...")

    if batch:
        batch_insert(cursor, sql, batch)

    cursor.connection.commit()

    # Build drugbankId -> id map
    cursor.execute("SELECT id, drugbankId FROM drugs WHERE drugbankId IS NOT NULL")
    id_map = {row.drugbankId: row.id for row in cursor.fetchall()}
    print(f"  Drugs imported: {len(id_map):,}        ")
    return id_map


# ---------------------------------------------------------------------------
# 2. Drug-Drug Interactions
# ---------------------------------------------------------------------------
def import_ddi(cursor, drug_map: dict):
    print("\n[2/5] Importing drug-drug interactions...")
    rows = read_csv(DATA_DIR / "drug_drug_interactions.csv")
    print(f"  Read {len(rows):,} rows from drug_drug_interactions.csv")

    cursor.execute("DELETE FROM drug_drug_interactions")

    sql = """
        INSERT INTO drug_drug_interactions (drugAId, drugBId, severity, description, source)
        VALUES (?,?,?,?,?)
    """

    batch = []
    skipped = 0
    for i, r in enumerate(rows):
        a_id = drug_map.get(r["drug_a_drugbank_id"])
        b_id = drug_map.get(r["drug_b_drugbank_id"])
        if not a_id or not b_id:
            skipped += 1
            continue
        batch.append((a_id, b_id, r["severity"] or "unknown", nullify(r["description"]), "DrugBank"))
        if len(batch) >= BATCH_SIZE:
            batch_insert(cursor, sql, batch)
            batch = []
            progress(f"{i+1:,}/{len(rows):,} DDI inserted (skipped={skipped:,})...")

    if batch:
        batch_insert(cursor, sql, batch)

    cursor.connection.commit()
    cursor.execute("SELECT COUNT(*) FROM drug_drug_interactions")
    count = cursor.fetchone()[0]
    print(f"  DDI imported: {count:,} (skipped={skipped:,})        ")


# ---------------------------------------------------------------------------
# 3. Drug-Food Interactions
# ---------------------------------------------------------------------------
def import_food(cursor, drug_map: dict):
    print("\n[3/5] Importing drug-food interactions...")
    rows = read_csv(DATA_DIR / "drug_food_interactions.csv")
    print(f"  Read {len(rows):,} rows from drug_food_interactions.csv")

    cursor.execute("DELETE FROM drug_food_interactions")

    sql = "INSERT INTO drug_food_interactions (drugId, interaction) VALUES (?,?)"

    batch = []
    skipped = 0
    for r in rows:
        d_id = drug_map.get(r["drug_drugbank_id"])
        if not d_id:
            skipped += 1
            continue
        batch.append((d_id, nullify(r["interaction"])))
        if len(batch) >= BATCH_SIZE:
            batch_insert(cursor, sql, batch)
            batch = []

    if batch:
        batch_insert(cursor, sql, batch)

    cursor.connection.commit()
    cursor.execute("SELECT COUNT(*) FROM drug_food_interactions")
    count = cursor.fetchone()[0]
    print(f"  Food interactions imported: {count:,} (skipped={skipped:,})")


# ---------------------------------------------------------------------------
# 4. Drug Conditions
# ---------------------------------------------------------------------------
def import_conditions(cursor, drug_map: dict):
    print("\n[4/5] Importing drug conditions...")
    rows = read_csv(DATA_DIR / "drug_conditions.csv")
    print(f"  Read {len(rows):,} rows from drug_conditions.csv")

    cursor.execute("DELETE FROM drug_conditions")

    sql = "INSERT INTO drug_conditions (drugId, type, text) VALUES (?,?,?)"

    batch = []
    skipped = 0
    for r in rows:
        d_id = drug_map.get(r["drug_drugbank_id"])
        if not d_id:
            skipped += 1
            continue
        batch.append((d_id, r["type"], nullify(r["text"])))
        if len(batch) >= BATCH_SIZE:
            batch_insert(cursor, sql, batch)
            batch = []

    if batch:
        batch_insert(cursor, sql, batch)

    cursor.connection.commit()
    cursor.execute("SELECT COUNT(*) FROM drug_conditions")
    count = cursor.fetchone()[0]
    print(f"  Drug conditions imported: {count:,} (skipped={skipped:,})")


# ---------------------------------------------------------------------------
# 5. Targets + Drug-Target Interactions
# ---------------------------------------------------------------------------
def import_targets_dti(cursor, drug_map: dict):
    print("\n[5/5] Importing targets...")
    rows = read_csv(DATA_DIR / "targets.csv")
    print(f"  Read {len(rows):,} rows from targets.csv")

    cursor.execute("DELETE FROM drug_target_interactions")
    cursor.execute("DELETE FROM targets")

    sql = """
        INSERT INTO targets
            (drugbankTargetId, name, uniprotId, geneName, geneSymbol,
             organism, generalFunction, specificFunction)
        VALUES (?,?,?,?,?,?,?,?)
    """

    batch = []
    for r in rows:
        batch.append((
            nullify(r["target_id"]),
            nullify(r["name"]) or "Unknown",
            nullify(r["uniprot_id"]),
            nullify(r["gene_name"]),
            nullify(r["gene_symbol"]),
            nullify(r["organism"])[:100] if r.get("organism") else None,
            nullify(r["general_function"]),
            nullify(r["specific_function"]),
        ))
        if len(batch) >= BATCH_SIZE:
            batch_insert(cursor, sql, batch)
            batch = []

    if batch:
        batch_insert(cursor, sql, batch)

    cursor.connection.commit()

    # Build target_id -> id map
    cursor.execute("SELECT id, drugbankTargetId FROM targets WHERE drugbankTargetId IS NOT NULL")
    target_map = {row.drugbankTargetId: row.id for row in cursor.fetchall()}
    print(f"  Targets imported: {len(target_map):,}")

    # DTI
    print("  Importing drug-target interactions...")
    rows = read_csv(DATA_DIR / "drug_target_interactions.csv")

    sql = "INSERT INTO drug_target_interactions (drugId, targetId, knownAction, source) VALUES (?,?,?,?)"

    batch = []
    skipped = 0
    for r in rows:
        d_id = drug_map.get(r["drug_drugbank_id"])
        t_id = target_map.get(r["target_id"])
        if not d_id or not t_id:
            skipped += 1
            continue
        batch.append((d_id, t_id, nullify(r["known_action"]), "DrugBank"))
        if len(batch) >= BATCH_SIZE:
            batch_insert(cursor, sql, batch)
            batch = []

    if batch:
        batch_insert(cursor, sql, batch)

    cursor.connection.commit()
    cursor.execute("SELECT COUNT(*) FROM drug_target_interactions")
    count = cursor.fetchone()[0]
    print(f"  DTI imported: {count:,} (skipped={skipped:,})")


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
def print_summary(cursor):
    print("\n" + "=" * 50)
    print("Import Summary")
    print("=" * 50)
    tables = [
        "drugs", "drug_drug_interactions", "drug_food_interactions",
        "drug_conditions", "targets", "drug_target_interactions"
    ]
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"  {t:<35} {count:>10,}")

    print()
    print("DDI Severity Distribution:")
    cursor.execute("""
        SELECT severity, COUNT(*) as cnt
        FROM drug_drug_interactions
        GROUP BY severity
        ORDER BY cnt DESC
    """)
    for row in cursor.fetchall():
        print(f"  {row.severity:<15} {row.cnt:>10,}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Import DrugBank CSV → SQL Server")
    parser.add_argument("--server", default=r"localhost\SQLEXPRESS")
    parser.add_argument("--db", default="DrugInteractionDB")
    parser.add_argument("--user", default=None, help="SQL login (omit for Windows Auth)")
    parser.add_argument("--password", default=None)
    args = parser.parse_args()

    print(f"Connecting to {args.server} / {args.db} ...")
    try:
        conn = get_connection(args.server, args.db, args.user, args.password)
    except Exception as e:
        print(f"ERROR: Cannot connect: {e}")
        sys.exit(1)

    cursor = conn.cursor()
    cursor.fast_executemany = True

    start = time.time()

    drug_map = import_drugs(cursor)
    import_ddi(cursor, drug_map)
    import_food(cursor, drug_map)
    import_conditions(cursor, drug_map)
    import_targets_dti(cursor, drug_map)
    print_summary(cursor)

    elapsed = time.time() - start
    print(f"\nTotal time: {elapsed:.0f}s")
    conn.close()


if __name__ == "__main__":
    main()
