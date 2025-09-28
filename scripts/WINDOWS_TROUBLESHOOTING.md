# Windows PowerShell Troubleshooting Guide

This guide helps resolve common issues when running MongoDB Mastering Course PowerShell scripts on Windows.

## Common Issues and Solutions

### 1. PowerShell Execution Policy Error

**Error:** `cannot be loaded because running scripts is disabled on this system`

**Solution:**
```powershell
# Option A: Set for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Option B: Bypass for single execution
PowerShell -ExecutionPolicy Bypass -File .\setup.ps1
```

### 2. Docker Not Found Error

**Error:** `docker : The term 'docker' is not recognized`

**Solutions:**
1. **Install Docker Desktop:**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Install and restart computer
   - Start Docker Desktop

2. **Add Docker to PATH:**
   - Docker usually installs to: `C:\Program Files\Docker\Docker\resources\bin`
   - Add this to your system PATH environment variable

3. **Restart PowerShell:** Close and reopen PowerShell after Docker installation

### 3. mongosh Not Found Error

**Error:** `mongosh : The term 'mongosh' is not recognized`

**Solutions:**
1. **Install MongoDB Shell:**
   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/shell)
   - Choose "Windows x64 (.msi)" package
   - Install and restart computer

2. **Manual PATH addition:**
   - Find mongosh installation (usually `C:\Program Files\mongosh\bin`)
   - Add to system PATH environment variable
   - Restart PowerShell

### 4. Container Creation Fails

**Error:** Various Docker container errors

**Solutions:**
1. **Restart Docker Desktop:**
   ```powershell
   # In elevated PowerShell
   Restart-Service docker
   ```

2. **Clean up previous containers:**
   ```powershell
   .\teardown.ps1
   # Wait 10 seconds
   .\setup.ps1
   ```

3. **Check Docker memory/disk:**
   - Increase Docker Desktop memory allocation (4GB+ recommended)
   - Free up disk space (10GB+ recommended)

### 4.5. Docker Detection Issues (Updated v2.0)

**Error:** "Docker is not running" but Docker Desktop is actually running

**Improved Detection Method:**
The PowerShell scripts now use a robust 3-method approach:
- **Method 1:** Direct `docker version` command
- **Method 2:** `cmd /c` wrapper for compatibility
- **Method 3:** Process detection + version check fallback

**Manual Testing:**
Test Docker detection manually:
```powershell
# Test each method individually
docker version --format "{{.Server.Version}}"
cmd /c "docker version --format `"{{.Server.Version}}`" 2>nul"
Get-Process -Name "*Docker*" -ErrorAction SilentlyContinue
```

**If detection still fails:**
1. **Run PowerShell as Administrator**
2. **Try the validation script:** `.\test.ps1 -Validate`
3. **Use alternative:** WSL with bash scripts (setup.sh)

### 5. MongoDB Connection Issues

**Error:** Connection timeouts or failures

**Solutions:**
1. **Verify containers are running:**
   ```powershell
   docker ps
   ```

2. **Check container logs:**
   ```powershell
   docker logs mongo1
   docker logs mongo2
   docker logs mongo3
   ```

3. **Test direct connection:**
   ```powershell
   mongosh --host localhost --port 27017
   ```

### 6. Windows Firewall Issues

**Error:** Connection refused or timeout errors

**Solutions:**
1. **Allow Docker through firewall:**
   - Windows Security → Firewall & network protection
   - Allow an app through firewall
   - Find "Docker Desktop" and check both Private and Public

2. **Allow MongoDB ports:**
   - Allow ports 27017, 27018, 27019 through Windows Firewall

### 7. Hyper-V or WSL2 Issues

**Error:** Docker Desktop won't start

**Solutions:**
1. **Enable Hyper-V (Windows Pro/Enterprise):**
   ```powershell
   # Run as Administrator
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```

2. **Enable WSL2 (Windows Home):**
   ```powershell
   # Run as Administrator
   wsl --install
   ```

3. **Enable virtualization in BIOS:**
   - Restart computer
   - Enter BIOS setup
   - Enable Intel VT-x or AMD-V
   - Save and restart

### 8. PowerShell Version Issues

**Error:** Script compatibility issues

**Solutions:**
1. **Check PowerShell version:**
   ```powershell
   $PSVersionTable.PSVersion
   ```

2. **Upgrade to PowerShell 5.1+ or PowerShell 7:**
   - Windows Update for PowerShell 5.1
   - Download PowerShell 7 from GitHub

3. **Use Windows PowerShell ISE as alternative**

### 9. String Encoding Issues

**Error:** Character encoding problems in commands

**Solutions:**
1. **Use Windows PowerShell instead of PowerShell Core**
2. **Try running from Command Prompt:**
   ```cmd
   powershell -File .\setup.ps1
   ```

### 10. Network Port Conflicts

**Error:** Port already in use (27017, 27018, 27019)

**Solutions:**
1. **Find processes using ports:**
   ```powershell
   netstat -ano | findstr :27017
   netstat -ano | findstr :27018
   netstat -ano | findstr :27019
   ```

2. **Kill conflicting processes:**
   ```powershell
   # Replace PID with actual process ID
   taskkill /PID <PID> /F
   ```

3. **Stop existing MongoDB services:**
   ```powershell
   # In elevated PowerShell
   Stop-Service MongoDB -ErrorAction SilentlyContinue
   ```

## Step-by-Step Troubleshooting Process

### Quick Fix (Try First)
1. Close PowerShell
2. Run `.\teardown.ps1`
3. Restart Docker Desktop
4. Wait 30 seconds
5. Run `.\setup.ps1`

### Complete Reset (If Quick Fix Fails)
1. **Clean environment:**
   ```powershell
   .\teardown.ps1
   docker system prune -f
   ```

2. **Restart Docker Desktop completely:**
   - Right-click Docker Desktop system tray icon
   - Select "Quit Docker Desktop"
   - Wait 10 seconds
   - Start Docker Desktop again
   - Wait for "Docker Desktop is running" message

3. **Verify prerequisites:**
   ```powershell
   docker --version
   mongosh --version
   ```

4. **Run setup with verbose output:**
   ```powershell
   .\setup.ps1 -Verbose
   ```

### Manual Verification
If automated scripts continue to fail, try manual setup:

1. **Create network:**
   ```powershell
   docker network create mongodb-net
   ```

2. **Start containers one by one:**
   ```powershell
   docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
   docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
   docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all
   ```

3. **Wait and initialize:**
   ```powershell
   Start-Sleep -Seconds 30
   docker exec mongo1 mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo1:27017'},{_id:1,host:'mongo2:27017'},{_id:2,host:'mongo3:27017'}]})"
   ```

## Getting Help

If none of these solutions work:

1. **Check the specific error message** in PowerShell
2. **Look at Docker Desktop logs** (Troubleshoot → Show container logs)
3. **Verify system requirements:**
   - Windows 10/11 with latest updates
   - At least 4GB RAM available
   - At least 10GB free disk space
   - Virtualization enabled in BIOS

4. **Alternative options:**
   - Use Windows Subsystem for Linux (WSL) with `setup.sh`
   - Run scripts as Administrator

## Contact Information

For additional support:
- Check the main `README.md` for general troubleshooting
- Review `SETUP.md` for manual setup instructions
- Ensure Docker Desktop and mongosh are properly installed

---

*Windows PowerShell Troubleshooting Guide - MongoDB Mastering Course*