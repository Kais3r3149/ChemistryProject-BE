-- ============================================================================
-- Import CSV data into PostgreSQL (Supabase)
-- ============================================================================
-- Prerequisites:
--   1. Run download_tdc_data.py to generate CSV files in data/processed/
--   2. Run NestJS once with synchronize=true to create tables
--   3. Then run this script with psql:
--      psql "postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" -f import_to_postgres.sql
--
-- NOTE: For Supabase, use port 5432 (direct connection) for COPY operations.
--       Port 6543 (transaction pooler) does NOT support COPY.
--
-- IMPORTANT: Update the file paths below to match your local setup!
-- ============================================================================

-- ============================================================================
-- 1. Import Drugs
-- ============================================================================
\echo 'Importing drugs...'
\copy drugs(name, smiles, "drugbankId", "pubchemCid", description) FROM 'data/processed/drugs.csv' WITH (FORMAT csv, HEADER true);
SELECT 'drugs' AS "table", COUNT(*) AS count FROM drugs;

-- ============================================================================
-- 2. Import Drug-Drug Interactions
-- ============================================================================
\echo 'Importing drug-drug interactions...'
\copy drug_drug_interactions("drugAId", "drugBId", "interactionType", severity, description, confidence, source) FROM 'data/processed/drug_drug_interactions.csv' WITH (FORMAT csv, HEADER true);
SELECT 'drug_drug_interactions' AS "table", COUNT(*) AS count FROM drug_drug_interactions;

-- ============================================================================
-- 3. Import Targets
-- ============================================================================
\echo 'Importing targets...'
\copy targets(name, "uniprotId", "geneSymbol", organism) FROM 'data/processed/targets.csv' WITH (FORMAT csv, HEADER true);
SELECT 'targets' AS "table", COUNT(*) AS count FROM targets;

-- ============================================================================
-- 4. Import Drug-Target Interactions
-- ============================================================================
\echo 'Importing drug-target interactions...'
\copy drug_target_interactions("drugId", "targetId", "bindingAffinity", "affinityUnit", "affinityType", source) FROM 'data/processed/drug_target_interactions.csv' WITH (FORMAT csv, HEADER true);
SELECT 'drug_target_interactions' AS "table", COUNT(*) AS count FROM drug_target_interactions;

-- ============================================================================
-- 5. Import Protein-Protein Interactions
-- ============================================================================
\echo 'Importing protein-protein interactions...'
\copy protein_protein_interactions("proteinAUniprotId", "proteinAName", "proteinBUniprotId", "proteinBName", score, source) FROM 'data/processed/protein_protein_interactions.csv' WITH (FORMAT csv, HEADER true);
SELECT 'protein_protein_interactions' AS "table", COUNT(*) AS count FROM protein_protein_interactions;

-- ============================================================================
-- 6. Import Genes
-- ============================================================================
\echo 'Importing genes...'
\copy genes("geneSymbol", "geneName", "entrezId") FROM 'data/processed/genes.csv' WITH (FORMAT csv, HEADER true);
SELECT 'genes' AS "table", COUNT(*) AS count FROM genes;

-- ============================================================================
-- 7. Import Diseases
-- ============================================================================
\echo 'Importing diseases...'
\copy diseases("diseaseId", "diseaseName", "diseaseType", "diseaseClass") FROM 'data/processed/diseases.csv' WITH (FORMAT csv, HEADER true);
SELECT 'diseases' AS "table", COUNT(*) AS count FROM diseases;

-- ============================================================================
-- 8. Import Gene-Disease Associations
-- ============================================================================
\echo 'Importing gene-disease associations...'
\copy gene_disease_associations("geneId", "diseaseId", score, "evidenceIndex", "yearInitial", "yearFinal", source) FROM 'data/processed/gene_disease_associations.csv' WITH (FORMAT csv, HEADER true);
SELECT 'gene_disease_associations' AS "table", COUNT(*) AS count FROM gene_disease_associations;

-- ============================================================================
-- 9. Import Cell Lines
-- ============================================================================
\echo 'Importing cell lines...'
\copy cell_lines("cellLineId", name, "tissueName", "cancerType") FROM 'data/processed/cell_lines.csv' WITH (FORMAT csv, HEADER true);
SELECT 'cell_lines' AS "table", COUNT(*) AS count FROM cell_lines;

-- ============================================================================
-- 10. Import Drug Responses
-- ============================================================================
\echo 'Importing drug responses...'
\copy drug_responses("drugId", "cellLineId", ic50, auc, source) FROM 'data/processed/drug_responses.csv' WITH (FORMAT csv, HEADER true);
SELECT 'drug_responses' AS "table", COUNT(*) AS count FROM drug_responses;

-- ============================================================================
-- Verify imports
-- ============================================================================
\echo ''
\echo '=== Import Summary ==='
SELECT 'drugs' AS "table", COUNT(*) AS count FROM drugs
UNION ALL SELECT 'drug_drug_interactions', COUNT(*) FROM drug_drug_interactions
UNION ALL SELECT 'targets', COUNT(*) FROM targets
UNION ALL SELECT 'drug_target_interactions', COUNT(*) FROM drug_target_interactions
UNION ALL SELECT 'protein_protein_interactions', COUNT(*) FROM protein_protein_interactions
UNION ALL SELECT 'genes', COUNT(*) FROM genes
UNION ALL SELECT 'diseases', COUNT(*) FROM diseases
UNION ALL SELECT 'gene_disease_associations', COUNT(*) FROM gene_disease_associations
UNION ALL SELECT 'cell_lines', COUNT(*) FROM cell_lines
UNION ALL SELECT 'drug_responses', COUNT(*) FROM drug_responses;

-- Severity distribution
\echo ''
\echo '=== DDI Severity Distribution ==='
SELECT severity, COUNT(*) AS count
FROM drug_drug_interactions
GROUP BY severity
ORDER BY
  CASE severity
    WHEN 'major' THEN 1
    WHEN 'moderate' THEN 2
    WHEN 'minor' THEN 3
    WHEN 'unknown' THEN 4
  END;
