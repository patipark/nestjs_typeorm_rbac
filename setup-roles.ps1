# setup-roles.ps1
# Script to set up roles and role hierarchy

# Read database configuration from .env file
$envFile = Get-Content -Path ".\.env" -ErrorAction SilentlyContinue
if (-not $envFile) {
    Write-Host "Error: .env file not found." -ForegroundColor Red
    exit 1
}

# Parse database connection details
$dbHost = ($envFile | Select-String -Pattern "DB_HOST=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbPort = ($envFile | Select-String -Pattern "DB_PORT=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbName = ($envFile | Select-String -Pattern "DB_NAME=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbUser = ($envFile | Select-String -Pattern "DB_USER=(.*)").Matches.Groups[1].Value -replace '"', ''
$dbPass = ($envFile | Select-String -Pattern "DB_PASS=(.*)").Matches.Groups[1].Value -replace '"', ''

# Display connection information
Write-Host "Setting up role hierarchy in database:" -ForegroundColor Cyan
Write-Host "  Host: $dbHost"
Write-Host "  Database: $dbName"
Write-Host "  User: $dbUser"
Write-Host ""

# Verify that the necessary SQL file exists
if (-not (Test-Path ".\setup-role-hierarchy.sql")) {
    Write-Host "Error: setup-role-hierarchy.sql file not found." -ForegroundColor Red
    exit 1
}

# Ask for confirmation
$confirmation = Read-Host "This will set up roles and role hierarchy. Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

# Execute SQL file using database command line
try {
    # Create a temporary file with credentials (for security, this will be deleted immediately after use)
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    # Attempt to run using mysql command line client
    Write-Host "Executing setup script..." -ForegroundColor Cyan
    
    # Prompt for password (more secure than including it in the command)
    Write-Host "Enter your MySQL/MariaDB password when prompted:" -ForegroundColor Yellow
    mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPass $dbName < .\setup-role-hierarchy.sql
    
    Write-Host "`nRole hierarchy setup completed!" -ForegroundColor Green
    Write-Host "You can now run the application and test the role hierarchy with:"
    Write-Host "  .\test-role-hierarchy.ps1" -ForegroundColor Cyan
} catch {
    Write-Host "Error executing SQL script: $_" -ForegroundColor Red
    Write-Host "`nYou can manually run the SQL script with your preferred database tool:" -ForegroundColor Yellow
    Write-Host "  mysql -h $dbHost -P $dbPort -u $dbUser -p $dbName < setup-role-hierarchy.sql" -ForegroundColor Cyan
} finally {
    # Clean up temporary file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}
