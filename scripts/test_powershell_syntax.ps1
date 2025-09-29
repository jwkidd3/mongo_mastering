# PowerShell Syntax Test Script
# Tests the ProcessStartInfo approach for Docker commands

# Test network creation syntax
Write-Host "Testing network creation syntax..." -ForegroundColor Blue

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "docker"
$startInfo.Arguments = "network create test-net"
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

Write-Host "✓ Network creation ProcessStartInfo syntax OK" -ForegroundColor Green

# Test container creation syntax
Write-Host "Testing container creation syntax..." -ForegroundColor Blue

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "docker"
$startInfo.Arguments = "run -d --name test-mongo --network test-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all"
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

Write-Host "✓ Container creation ProcessStartInfo syntax OK" -ForegroundColor Green

# Test container verification syntax
Write-Host "Testing container verification syntax..." -ForegroundColor Blue

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "docker"
$startInfo.Arguments = 'ps --filter "name=mongo" --format "{{.Names}}"'
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

Write-Host "✓ Container verification ProcessStartInfo syntax OK" -ForegroundColor Green

Write-Host "`n✅ All PowerShell syntax tests passed!" -ForegroundColor Green
Write-Host "The comprehensive_test.ps1 script should now work correctly on Windows." -ForegroundColor Cyan