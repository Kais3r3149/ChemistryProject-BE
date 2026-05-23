-- ============================================================================
-- Import CSV data into SQL Server (DrugInteractionDB)
-- ============================================================================
-- Prerequisites:
--   1. Run download_tdc_data.py to generate CSV files in data/processed/
--   2. Create database DrugInteractionDB
--   3. Run NestJS once with synchronize=true to create tables
--   4. Then run this script in SSMS
--
-- IMPORTANT: Update the file paths below to match your local setup!
-- ============================================================================

USE DrugInteractionDB;
GO

-- Update this path to where your CSV files are located
DECLARE @basePath NVARCHAR(500) = 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\';

-- ============================================================================
-- 1. Import Drugs
-- ============================================================================
PRINT 'Importing drugs...';

BULK INSERT drugs
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\drugs.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'Drugs imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 2. Import Drug-Drug Interactions
-- ============================================================================
PRINT 'Importing drug-drug interactions...';

BULK INSERT drug_drug_interactions
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\drug_drug_interactions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'DDIs imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 3. Import Targets
-- ============================================================================
PRINT 'Importing targets...';

BULK INSERT targets
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\targets.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'Targets imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 4. Import Drug-Target Interactions
-- ============================================================================
PRINT 'Importing drug-target interactions...';

BULK INSERT drug_target_interactions
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\drug_target_interactions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'DTIs imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 5. Import Protein-Protein Interactions
-- ============================================================================
PRINT 'Importing protein-protein interactions...';

BULK INSERT protein_protein_interactions
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\protein_protein_interactions.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'PPIs imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 6. Import Cell Lines
-- ============================================================================
PRINT 'Importing cell lines...';

BULK INSERT cell_lines
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\cell_lines.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'Cell lines imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 7. Import Drug Responses
-- ============================================================================
PRINT 'Importing drug responses...';

BULK INSERT drug_responses
FROM 'C:\Users\ADMIN\Desktop\Ho\ChemistryProject_BE\drug-interaction-checker\data\processed\drug_responses.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK,
    FORMAT = 'CSV'
);

PRINT 'Drug responses imported: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- Verify imports
-- ============================================================================
PRINT '';
PRINT '=== Import Summary ===';
SELECT 'drugs' AS [Table], COUNT(*) AS [Count] FROM drugs
UNION ALL
SELECT 'drug_drug_interactions', COUNT(*) FROM drug_drug_interactions
UNION ALL
SELECT 'targets', COUNT(*) FROM targets
UNION ALL
SELECT 'drug_target_interactions', COUNT(*) FROM drug_target_interactions
UNION ALL
SELECT 'protein_protein_interactions', COUNT(*) FROM protein_protein_interactions
UNION ALL
SELECT 'cell_lines', COUNT(*) FROM cell_lines
UNION ALL
SELECT 'drug_responses', COUNT(*) FROM drug_responses;

-- Severity distribution
PRINT '';
PRINT '=== DDI Severity Distribution ===';
SELECT severity, COUNT(*) AS [Count]
FROM drug_drug_interactions
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'major' THEN 1
    WHEN 'moderate' THEN 2
    WHEN 'minor' THEN 3
    WHEN 'unknown' THEN 4
  END;
GO
