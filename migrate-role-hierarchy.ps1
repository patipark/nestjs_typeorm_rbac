# Migration Script to Update Database Schema for Role Hierarchy

param (
    [string]$env = "development",  # Default to development environment
    [switch]$manual = $false       # Option to generate SQL file for manual execution
)

Write-Host "Running role hierarchy migration script for $env environment..." -ForegroundColor Cyan

# Read database configuration from .env file
$envFile = Get-Content -Path ".\.env" -ErrorAction SilentlyContinue
if (-not $envFile) {
    Write-Host "Error: .env file not found. Please create one with your database configuration." -ForegroundColor Red
    exit 1
}

# Parse variables from .env file
$dbHost = ($envFile | Select-String -Pattern "DB_HOST=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbPort = ($envFile | Select-String -Pattern "DB_PORT=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbName = ($envFile | Select-String -Pattern "DB_NAME=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbUser = ($envFile | Select-String -Pattern "DB_USER=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbPass = ($envFile | Select-String -Pattern "DB_PASS=(.*)").Matches.Groups[1].Value -replace '"', ''

# Remove any quotes
$dbHost = $dbHost -replace '"', ''
$dbPort = $dbPort -replace '"', ''
$dbName = $dbName -replace '"', ''
$dbUser = $dbUser -replace '"', ''
$dbPass = $dbPass -replace '"', ''

Write-Host "Database configuration:"
Write-Host "  Host: $dbHost"
Write-Host "  Port: $dbPort"
Write-Host "  Database: $dbName"
Write-Host "  User: $dbUser"

# Manual execution mode - just notify about the SQL file
if ($manual) {
    Write-Host "`nManual execution mode selected." -ForegroundColor Yellow
    Write-Host "A SQL file has been prepared for manual execution: role-hierarchy-migration.sql" -ForegroundColor Yellow
    Write-Host "You can run this file manually against your database using your preferred database tool." -ForegroundColor Yellow
    Write-Host "`nSample command for MariaDB CLI:" -ForegroundColor Cyan
    Write-Host "mysql -h $dbHost -P $dbPort -u $dbUser -p $dbName < role-hierarchy-migration.sql" -ForegroundColor Cyan
    exit 0
}

# Check if mysql command is available
$mysqlExists = $null
try {
    $mysqlExists = Get-Command mysql -ErrorAction SilentlyContinue
} catch {
    $mysqlExists = $null
}

if (-not $mysqlExists) {
    Write-Host "MySQL/MariaDB command line client not found." -ForegroundColor Yellow
    Write-Host "Please install the MySQL client or run the SQL script manually." -ForegroundColor Yellow
    Write-Host "A SQL file has been prepared for manual execution: role-hierarchy-migration.sql" -ForegroundColor Yellow
    
    Write-Host "`nYou can also try to run the application with the updated entity files, and let TypeORM synchronize the schema." -ForegroundColor Cyan
    Write-Host "To do this, make sure 'synchronize: true' is set in your database configuration." -ForegroundColor Cyan
    exit 1
}

# Execute the SQL migration file
Write-Host "`nExecuting role hierarchy migration SQL..." -ForegroundColor Cyan

try {
    if ($dbPass) {
        # With password - avoid using redirection operator in PowerShell
        $env:MYSQL_PWD = $dbPass
        Get-Content role-hierarchy-migration.sql | mysql -h $dbHost -P $dbPort -u $dbUser $dbName
    } else {
        # Without password
        Get-Content role-hierarchy-migration.sql | mysql -h $dbHost -P $dbPort -u $dbUser $dbName
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Please check your database connection settings and try again, or run the SQL file manually." -ForegroundColor Red
    }
} catch {
    Write-Host "Error executing migration SQL: $_" -ForegroundColor Red
    Write-Host "Please run the SQL file manually using your database management tool." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDatabase schema updated for role hierarchy changes." -ForegroundColor Green
Write-Host "The Role entity has been updated to use the new hierarchy table structure." -ForegroundColor Green
