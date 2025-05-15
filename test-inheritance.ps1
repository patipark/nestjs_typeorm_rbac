// Update your test-inheritance.ps1 file content
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
    @{ url = "/test-access/public"; description = "Public access (authenticated)"; role = "authenticated" }
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
        Write-Host "Attempting to login as $username..."
        $loginData = @{
            username = $username
            password = $password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        Write-Host "Login successful for $username"
        return $response.access_token
    } catch {
        Write-Host "Login failed for $username: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to test an endpoint with a token
function Test-Endpoint {
    param (
        [string]$url,
        [string]$token,
        [string]$description,
        [string]$username
    )
    
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl$url" -Method Get -Headers $headers
        Write-Host "✅ [$username] Access to $url ($description) succeeded" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ [$username] Access to $url ($description) failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main test function
function Run-Tests {
    Write-Host "🔒 Testing Role Inheritance in NestJS TypeORM RBAC 🔒`n" -ForegroundColor Cyan
    
    # Get tokens for all users
    $tokens = @{}
    foreach ($role in $users.Keys) {
        $credentials = $users[$role]
        $tokens[$role] = Get-AuthToken -username $credentials.username -password $credentials.password
        if (-not $tokens[$role]) {
            Write-Host "Could not get token for $role, skipping this user" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n📝 Testing endpoints with each user role...`n" -ForegroundColor Cyan
    
    # Test matrix for each endpoint with each user
    $results = @{}
    
    foreach ($role in $tokens.Keys) {
        $token = $tokens[$role]
        if (-not $token) { continue }
        
        $results[$role] = @{}
        
        foreach ($endpoint in $endpoints) {
            $results[$role][$endpoint.url] = Test-Endpoint -url $endpoint.url -token $token -description $endpoint.description -username $role
        }
    }
    
    # Summary
    Write-Host "`n📊 Test Results Summary:`n" -ForegroundColor Cyan
    Write-Host "Endpoint`t| Required Role`t| user`t| editor`t| manager`t| admin"
    Write-Host ("-" * 80)
    
    foreach ($endpoint in $endpoints) {
        $row = @(
            $endpoint.url,
            $endpoint.role,
            if ($results.user -and $results.user[$endpoint.url]) { "✅" } else { "❌" },
            if ($results.editor -and $results.editor[$endpoint.url]) { "✅" } else { "❌" },
            if ($results.manager -and $results.manager[$endpoint.url]) { "✅" } else { "❌" },
            if ($results.admin -and $results.admin[$endpoint.url]) { "✅" } else { "❌" }
        )
        Write-Host ($row -join "`t| ")
    }
    
    Write-Host "`n🔍 Role Inheritance Check:`n" -ForegroundColor Cyan
    Write-Host "- user roles should only access user-level endpoints"
    Write-Host "- editor roles should access user and editor endpoints"
    Write-Host "- manager roles should access user, editor, and manager endpoints"
    Write-Host "- admin roles should access all endpoints`n"
}

# Start the tests
Write-Host "Make sure your NestJS application is running on http://localhost:3000" -ForegroundColor Yellow
Run-Tests
