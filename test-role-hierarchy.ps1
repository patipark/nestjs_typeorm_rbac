# Test Role Hierarchy Relationships
# This script tests the new role hierarchy implementation

$baseUrl = "http://localhost:3000"
$adminCredentials = @{
    username = "admin"
    password = "admin123"
}

# Get admin token for accessing protected endpoints
function Get-AdminToken {
    try {
        $loginData = $adminCredentials | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        return $response.access_token
    } catch {
        Write-Host "Error logging in as admin: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Try starting the application with 'npm run start:dev' if it's not running." -ForegroundColor Yellow
        return $null
    }
}

function Test-RoleHierarchy {
    $token = Get-AdminToken
    if (-not $token) {
        Write-Host "Failed to get admin token. Make sure the application is running and the database is properly seeded." -ForegroundColor Red
        return
    }
    
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "🔍 TESTING ROLE HIERARCHY RELATIONSHIPS" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    
    # Get all roles
    try {
        $roles = Invoke-RestMethod -Uri "$baseUrl/roles" -Method Get -Headers $headers
        Write-Host "`n✅ Found $(($roles | Measure-Object).Count) roles in the system:" -ForegroundColor Green
        foreach ($role in $roles) {
            Write-Host "   - $($role.name) (ID: $($role.id))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error fetching roles: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
    
    # Get role hierarchy visualization
    try {
        Write-Host "`n📊 Hierarchy Visualization:" -ForegroundColor Cyan
        $visualization = Invoke-RestMethod -Uri "$baseUrl/roles/hierarchy/visualization" -Method Get -Headers $headers
        Write-Host $visualization -ForegroundColor White
    } catch {
        Write-Host "❌ Error fetching hierarchy visualization: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test role capabilities
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "🔒 TESTING ROLE CAPABILITIES INHERITANCE" -ForegroundColor Cyan  
    Write-Host "==================================================" -ForegroundColor Cyan
    $roleNames = @("user", "editor", "manager", "admin")
    
    $resultTable = @()
    
    foreach ($roleName in $roleNames) {
        try {
            $role = ($roles | Where-Object { $_.name -eq $roleName })
            if (-not $role) {
                Write-Host "Role '$roleName' not found" -ForegroundColor Yellow
                continue
            }
            
            Write-Host "`nTesting capabilities for role: $roleName (ID: $($role.id))" -ForegroundColor Yellow
            
            $rowResults = @{}
            $rowResults["Role"] = $roleName
            
            foreach ($targetRole in $roleNames) {
                $hasCapability = Invoke-RestMethod -Uri "$baseUrl/roles/$($role.id)/check-capability?roleName=$targetRole" -Method Get -Headers $headers
                $icon = if ($hasCapability) { "✅" } else { "❌" }
                $color = if ($hasCapability) { "Green" } else { "Red" }
                Write-Host "$icon $roleName has capability '$targetRole': $hasCapability" -ForegroundColor $color
                
                $rowResults[$targetRole] = $hasCapability
            }
            
            $resultTable += [PSCustomObject]$rowResults
        } catch {
            Write-Host "❌ Error testing capabilities for role '$roleName': $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Display results table
    Write-Host "`n📋 Role Capability Matrix:" -ForegroundColor Cyan
    $resultTable | Format-Table -AutoSize
    
    # Test parent-child relationships
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "👪 TESTING PARENT-CHILD RELATIONSHIPS" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    
    foreach ($roleName in $roleNames) {
        try {
            $role = ($roles | Where-Object { $_.name -eq $roleName })
            if (-not $role) { continue }
            
            Write-Host "`nRole: $roleName (ID: $($role.id))" -ForegroundColor Yellow
            
            # Get parent
            $parent = Invoke-RestMethod -Uri "$baseUrl/roles/$($role.id)/parent" -Method Get -Headers $headers -ErrorAction SilentlyContinue
            if ($parent) {
                Write-Host "  Parent: '$($parent.name)' (ID: $($parent.id))" -ForegroundColor Green
            } else {
                Write-Host "  Parent: None (this is a top-level role)" -ForegroundColor Yellow
            }
            
            # Get children
            $children = Invoke-RestMethod -Uri "$baseUrl/roles/$($role.id)/children" -Method Get -Headers $headers -ErrorAction SilentlyContinue
            if ($children -and ($children | Measure-Object).Count -gt 0) {
                Write-Host "  Children: $($children.name -join ', ')" -ForegroundColor Green
            } else {
                Write-Host "  Children: None (this is a leaf role)" -ForegroundColor Yellow
            }
            
            # Get ancestors
            $ancestors = Invoke-RestMethod -Uri "$baseUrl/roles/$($role.id)/ancestors" -Method Get -Headers $headers -ErrorAction SilentlyContinue
            if ($ancestors -and ($ancestors | Measure-Object).Count -gt 0) {
                $ancestorPath = $ancestors | ForEach-Object { $_.name } | Join-String -Separator " -> "
                Write-Host "  Ancestors: $ancestorPath" -ForegroundColor Green
            } else {
                Write-Host "  Ancestors: None (this is a root role)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Error testing relationships for role '$roleName': $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "✅ ROLE HIERARCHY TESTING COMPLETE" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

# Run the tests
Test-RoleHierarchy

# Run the tests
Test-RoleHierarchy
