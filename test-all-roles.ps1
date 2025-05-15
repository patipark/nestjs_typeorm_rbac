#!/usr/bin/env pwsh
# test-all-roles.ps1
# Comprehensive test script for role inheritance

$baseUrl = "http://localhost:3000"

# User credentials for each role
$users = @{
    user = @{ username = "user"; password = "user123" }
    editor = @{ username = "editor"; password = "editor123" }
    manager = @{ username = "manager"; password = "manager123" }
    admin = @{ username = "admin"; password = "admin123" }
}

# Test endpoints with different required roles
$endpoints = @(
    @{ url = "/test-access/public"; description = "Public access"; role = "authenticated" }
    @{ url = "/test-access/user"; description = "User access"; role = "user" }
    @{ url = "/test-access/editor"; description = "Editor access"; role = "editor" }
    @{ url = "/test-access/manager"; description = "Manager access"; role = "manager" }
    @{ url = "/test-access/admin"; description = "Admin access"; role = "admin" }
)

# Function to get token for a user
function Get-AuthToken {
    param (
        [string]$username,
        [string]$password
    )
    
    try {
        Write-Host "Logging in as $username..." -NoNewline
        $loginData = @{
            username = $username
            password = $password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        Write-Host "Success!" -ForegroundColor Green
        return $response.access_token
    } catch {
        Write-Host "Failed! $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to test an endpoint with a token
function Test-Endpoint {
    param (
        [string]$url,
        [string]$token,
        [string]$role,
        [string]$endpoint
    )
    
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl$url" -Method Get -Headers $headers
        Write-Host "✅ [$role] Can access $url" -ForegroundColor Green
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ [$role] Cannot access $url (HTTP $statusCode)" -ForegroundColor Red
        return $false
    }
}

# Creates a markdown table row from an array of values
function Format-TableRow {
    param([array]$values)
    return "| " + ($values -join " | ") + " |"
}

# Main test function
function Test-RoleInheritance {
    Clear-Host
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "  TESTING ROLE INHERITANCE IN NESTJS TYPEORM RBAC APPLICATION " -ForegroundColor Cyan
    Write-Host "===============================================================" -ForegroundColor Cyan
    
    # Get tokens for all users
    $tokens = @{}
    foreach ($role in $users.Keys) {
        $credentials = $users[$role]
        $tokens[$role] = Get-AuthToken -username $credentials.username -password $credentials.password
    }
    
    # Check if we have at least one valid token
    $validTokens = $tokens.Values | Where-Object { $_ -ne $null }
    if ($validTokens.Count -eq 0) {
        Write-Host "`nERROR: Could not authenticate any users. Make sure the application is running and seeded correctly.`n" -ForegroundColor Red
        exit 1
    }
    
    # Test each endpoint with each role
    $results = @{}
    
    Write-Host "`nTesting access to all endpoints for each role..." -ForegroundColor Cyan
    
    foreach ($role in $tokens.Keys) {
        $token = $tokens[$role]
        if (-not $token) { continue }
        
        $results[$role] = @{}
        
        foreach ($endpoint in $endpoints) {
            $results[$role][$endpoint.url] = Test-Endpoint -url $endpoint.url -token $token -role $role -endpoint $endpoint.description
        }
    }
    
    # Generate markdown results table
    Write-Host "`n## Role Inheritance Test Results" -ForegroundColor Yellow
    
    $tableHeader = Format-TableRow -values @("Endpoint", "Required Role", "user", "editor", "manager", "admin")
    $tableSeparator = Format-TableRow -values @("--------", "-------------", "----", "------", "-------", "-----")
    
    Write-Host "`n$tableHeader"
    Write-Host $tableSeparator
    
    foreach ($endpoint in $endpoints) {
        $row = @(
            $endpoint.url,
            $endpoint.role,
            if ($results.user -and $results.user.ContainsKey($endpoint.url)) { if ($results.user[$endpoint.url]) { "✅" } else { "❌" } } else { "N/A" },
            if ($results.editor -and $results.editor.ContainsKey($endpoint.url)) { if ($results.editor[$endpoint.url]) { "✅" } else { "❌" } } else { "N/A" },
            if ($results.manager -and $results.manager.ContainsKey($endpoint.url)) { if ($results.manager[$endpoint.url]) { "✅" } else { "❌" } } else { "N/A" },
            if ($results.admin -and $results.admin.ContainsKey($endpoint.url)) { if ($results.admin[$endpoint.url]) { "✅" } else { "❌" } } else { "N/A" }
        )
        Write-Host (Format-TableRow -values $row)
    }
    
    # Analyze role inheritance
    Write-Host "`n## Role Inheritance Analysis" -ForegroundColor Yellow
    
    $inheritance = @{
        user = @()
        editor = @()
        manager = @()
        admin = @()
    }
    
    foreach ($role in $results.Keys) {
        foreach ($endpoint in $endpoints) {
            if ($results[$role][$endpoint.url]) {
                $inheritance[$role] += $endpoint.role
            }
        }
    }
    
    foreach ($role in $inheritance.Keys) {
        $inheritsFrom = $inheritance[$role] | Where-Object { $_ -ne $role -and $_ -ne "authenticated" } | Sort-Object -Unique
        if ($inheritsFrom.Count -gt 0) {
            Write-Host "Role '$role' has access to: $($inheritsFrom -join ", ") endpoints, confirming inheritance." -ForegroundColor Green
        } else {
            Write-Host "Role '$role' does not show inheritance behavior." -ForegroundColor Yellow
        }
    }
    
    # Expected inheritance relationships
    Write-Host "`n## Expected vs. Actual Inheritance" -ForegroundColor Yellow
    
    $expected = @{
        user = @("authenticated")
        editor = @("authenticated", "user")
        manager = @("authenticated", "user", "editor")
        admin = @("authenticated", "user", "editor", "manager")
    }
    
    foreach ($role in $expected.Keys) {
        if ($results.ContainsKey($role)) {
            $actualAccess = $endpoints | Where-Object { $results[$role][$_.url] } | ForEach-Object { $_.role } | Sort-Object -Unique
            $expectedAccess = $expected[$role]
            
            $missingAccess = $expectedAccess | Where-Object { $actualAccess -notcontains $_ }
            $extraAccess = $actualAccess | Where-Object { $expectedAccess -notcontains $_ -and $_ -ne $role }
            
            if ($missingAccess.Count -gt 0) {
                Write-Host "❌ Role '$role' is MISSING access to: $($missingAccess -join ", ")" -ForegroundColor Red
            }
            
            if ($extraAccess.Count -gt 0) {
                Write-Host "⚠️ Role '$role' has UNEXPECTED access to: $($extraAccess -join ", ")" -ForegroundColor Yellow
            }
            
            if ($missingAccess.Count -eq 0 -and $extraAccess.Count -eq 0) {
                Write-Host "✅ Role '$role' has CORRECT inheritance behavior" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "`nTest completed. See results above.`n" -ForegroundColor Cyan
}

# Run the tests
Test-RoleInheritance
