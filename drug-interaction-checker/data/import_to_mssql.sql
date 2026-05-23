-- ============================================================================
-- Import DrugBank CSV data into SQL Server (SSMS)
-- ============================================================================
-- Prerequisites:
--   1. Run parse_drugbank.py to generate CSV files in data/processed/
--   2. Run NestJS once with synchronize=true (NODE_ENV=development) to create tables
--   3. Open this script in SSMS and execute
--
-- IMPORTANT: Update @DataPath below to your absolute path of data/processed/
-- ============================================================================

USE DrugInteractionDB;
GO

PRINT '=== DrugBank Data Import ===';
PRINT 'Clearing existing data...';

-- Clear in FK-safe order
DELETE FROM drug_target_interactions;
DELETE FROM drug_food_interactions;
DELETE FROM drug_conditions;
DELETE FROM drug_drug_interactions;
DELETE FROM targets;
DELETE FROM drugs;
PRINT 'Tables cleared.';
PRINT '';
GO

-- ============================================================================
-- 1. Import Drugs
-- ============================================================================
PRINT '[1/5] Importing drugs...';

CREATE TABLE #drugs_staging (
    drugbank_id        VARCHAR(20),
    name               NVARCHAR(500),
    smiles             NVARCHAR(1000),
    cas_number         VARCHAR(30),
    description        NVARCHAR(MAX),
    indication         NVARCHAR(MAX),
    pharmacodynamics   NVARCHAR(MAX),
    mechanism_of_action NVARCHAR(MAX),
    toxicity           NVARCHAR(MAX),
    state              VARCHAR(50),
    groups             VARCHAR(200)
);

BULK INSERT #drugs_staging
FROM 'C:\DrugBankData\drugs.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIELDQUOTE = '"',
    CODEPAGE = '65001',
    MAXERRORS = 100,
    TABLOCK
);

INSERT INTO drugs (drugbankId, name, smiles, casNumber, description, indication,
                   pharmacodynamics, mechanismOfAction, toxicity, state, groups)
SELECT drugbank_id, name,
       NULLIF(smiles,''), NULLIF(cas_number,''), NULLIF(description,''),
       NULLIF(indication,''), NULLIF(pharmacodynamics,''),
       NULLIF(mechanism_of_action,''), NULLIF(toxicity,''),
       NULLIF(state,''), NULLIF(groups,'')
FROM #drugs_staging;

DROP TABLE #drugs_staging;

SELECT '[1/5] drugs imported: ' + CAST(COUNT(*) AS VARCHAR) AS result FROM drugs;
GO

-- ============================================================================
-- 2. Import Drug-Drug Interactions
-- ============================================================================
PRINT '[2/5] Importing drug-drug interactions...';

CREATE TABLE #ddi_staging (
    drug_a_drugbank_id VARCHAR(20),
    drug_b_drugbank_id VARCHAR(20),
    drug_b_name        NVARCHAR(500),
    severity           VARCHAR(20),
    description        NVARCHAR(MAX)
);

BULK INSERT #ddi_staging
FROM 'C:\DrugBankData\drug_drug_interactions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIELDQUOTE = '"',
    CODEPAGE = '65001',
    MAXERRORS = 100,
    TABLOCK
);

INSERT INTO drug_drug_interactions (drugAId, drugBId, severity, description, source)
SELECT da.id, db_.id, s.severity, s.description, 'DrugBank'
FROM #ddi_staging s
INNER JOIN drugs da  ON da.drugbankId = s.drug_a_drugbank_id
INNER JOIN drugs db_ ON db_.drugbankId = s.drug_b_drugbank_id;

DROP TABLE #ddi_staging;

SELECT '[2/5] drug_drug_interactions imported: ' + CAST(COUNT(*) AS VARCHAR) AS result
FROM drug_drug_interactions;
GO

-- ============================================================================
-- 3. Import Drug-Food Interactions
-- ============================================================================
PRINT '[3/5] Importing drug-food interactions...';

CREATE TABLE #food_staging (
    drug_drugbank_id VARCHAR(20),
    interaction      NVARCHAR(MAX)
);

BULK INSERT #food_staging
FROM 'C:\DrugBankData\drug_food_interactions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIELDQUOTE = '"',
    CODEPAGE = '65001',
    MAXERRORS = 50,
    TABLOCK
);

INSERT INTO drug_food_interactions (drugId, interaction)
SELECT d.id, s.interaction
FROM #food_staging s
INNER JOIN drugs d ON d.drugbankId = s.drug_drugbank_id;

DROP TABLE #food_staging;

SELECT '[3/5] drug_food_interactions imported: ' + CAST(COUNT(*) AS VARCHAR) AS result
FROM drug_food_interactions;
GO

-- ============================================================================
-- 4. Import Drug Conditions
-- ============================================================================
PRINT '[4/5] Importing drug conditions...';

CREATE TABLE #cond_staging (
    drug_drugbank_id VARCHAR(20),
    type             VARCHAR(20),
    text             NVARCHAR(MAX)
);

BULK INSERT #cond_staging
FROM 'C:\DrugBankData\drug_conditions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIELDQUOTE = '"',
    CODEPAGE = '65001',
    MAXERRORS = 50,
    TABLOCK
);

INSERT INTO drug_conditions (drugId, type, text)
SELECT d.id, s.type, s.text
FROM #cond_staging s
INNER JOIN drugs d ON d.drugbankId = s.drug_drugbank_id;

DROP TABLE #cond_staging;

SELECT '[4/5] drug_conditions imported: ' + CAST(COUNT(*) AS VARCHAR) AS result
FROM drug_conditions;
GO

-- ============================================================================
-- 5. Import Targets + Drug-Target Interactions
-- ============================================================================
PRINT '[5/5] Importing targets...';

CREATE TABLE #tgt_staging (
    target_id         VARCHAR(20),
    name              NVARCHAR(500),
    uniprot_id        VARCHAR(50),
    gene_name         VARCHAR(100),
    gene_symbol       VARCHAR(100),
    organism          VARCHAR(500),
    general_function  NVARCHAR(MAX),
    specific_function NVARCHAR(MAX)
);

BULK INSERT #tgt_staging
FROM 'C:\DrugBankData\targets.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIELDQUOTE = '"',
    CODEPAGE = '65001',
    MAXERRORS = 100,
    TABLOCK
);

INSERT INTO targets (drugbankTargetId, name, uniprotId, geneName, geneSymbol, organism, generalFunction, specificFunction)
SELECT target_id,
       name,
       NULLIF(uniprot_id,''),
       NULLIF(gene_name,''),
       NULLIF(gene_symbol,''),
       NULLIF(LEFT(organism,100),''),
       NULLIF(general_function,''),
       NULLIF(specific_function,'')
FROM #tgt_staging;

DROP TABLE #tgt_staging;

SELECT '[5a] targets imported: ' + CAST(COUNT(*) AS VARCHAR) AS result FROM targets;
GO

PRINT '[5b] Importing drug-target interactions...';

CREATE TABLE #dti_staging (
    drug_drugbank_id VARCHAR(20),
    target_id        VARCHAR(20),
    known_action     VARCHAR(20),
    source           VARCHAR(20)
);

BULK INSERT #dti_staging
FROM 'C:\DrugBankData\drug_target_interactions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIELDQUOTE = '"',
    CODEPAGE = '65001',
    MAXERRORS = 50,
    TABLOCK
);

INSERT INTO drug_target_interactions (drugId, targetId, knownAction, source)
SELECT d.id, t.id, NULLIF(s.known_action,''), s.source
FROM #dti_staging s
INNER JOIN drugs   d ON d.drugbankId       = s.drug_drugbank_id
INNER JOIN targets t ON t.drugbankTargetId = s.target_id;

DROP TABLE #dti_staging;

SELECT '[5b] drug_target_interactions imported: ' + CAST(COUNT(*) AS VARCHAR) AS result
FROM drug_target_interactions;
GO

-- ============================================================================
-- Summary
-- ============================================================================
PRINT '';
PRINT '=== Import Summary ===';
SELECT 'drugs'                    AS [table], COUNT(*) AS [count] FROM drugs
UNION ALL
SELECT 'drug_drug_interactions',             COUNT(*)             FROM drug_drug_interactions
UNION ALL
SELECT 'drug_food_interactions',             COUNT(*)             FROM drug_food_interactions
UNION ALL
SELECT 'drug_conditions',                    COUNT(*)             FROM drug_conditions
UNION ALL
SELECT 'targets',                            COUNT(*)             FROM targets
UNION ALL
SELECT 'drug_target_interactions',           COUNT(*)             FROM drug_target_interactions;

-- DDI Severity distribution
PRINT '';
PRINT '=== DDI Severity Distribution ===';
SELECT severity, COUNT(*) AS [count]
FROM drug_drug_interactions
GROUP BY severity
ORDER BY
    CASE severity
        WHEN 'major'    THEN 1
        WHEN 'moderate' THEN 2
        WHEN 'minor'    THEN 3
        WHEN 'unknown'  THEN 4
    END;
GO
