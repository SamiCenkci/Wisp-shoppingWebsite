# ===== Wisp Launcher =====
$ErrorActionPreference = "Stop"
$client = "C:\Users\hacke\Documents\GitHub\Shopping-Website\client"
$server = "C:\Users\hacke\Documents\GitHub\Shopping-Website\server"

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "   __        ___           " -ForegroundColor Green
    Write-Host "   \ \      / (_)___ _ __  " -ForegroundColor Green
    Write-Host "    \ \ /\ / /| / __| '_ \ " -ForegroundColor Green
    Write-Host "     \ V  V / | \__ \ |_) |" -ForegroundColor Green
    Write-Host "      \_/\_/  |_|___/ .__/ " -ForegroundColor Green
    Write-Host "                    |_|    " -ForegroundColor DarkGreen
    Write-Host "   Marketplace Launcher" -ForegroundColor Gray
    Write-Host "   ---------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

function Start-Wisp {
    Show-Banner
    Write-Host "  [1/3] Starting backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$server'; go run main.go"
    Start-Sleep -Seconds 3

    Write-Host "  [2/3] Building frontend (please wait)..." -ForegroundColor Cyan
    Push-Location $client
    npm run build | Out-Host
    $buildOk = $LASTEXITCODE -eq 0
    Pop-Location

    if (-not $buildOk) {
        Write-Host ""
        Write-Host "  BUILD FAILED. Fix the error above and try again." -ForegroundColor Red
        Read-Host "  Press Enter to return to menu"
        return
    }

    Write-Host "  [3/3] Starting frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$client'; npm start"
    Start-Sleep -Seconds 2

    Write-Host ""
    Write-Host "  Wisp is LIVE at https://wispapp.net" -ForegroundColor Green
    Write-Host "  (Backend + Frontend windows are now running)" -ForegroundColor Gray
    Write-Host ""
    Read-Host "  Press Enter to return to menu"
}

function Stop-Wisp {
    Show-Banner
    Write-Host "  Stopping Wisp..." -ForegroundColor Yellow
    Get-Process -Name "go","node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    # Stop the temporary go build process too
    Get-Process | Where-Object { $_.MainWindowTitle -like "*main.go*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Stopped." -ForegroundColor Green
    Start-Sleep -Seconds 1
    Read-Host "  Press Enter to return to menu"
}

function Open-Site {
    Start-Process "https://wispapp.net"
}

# ===== Main menu loop =====
while ($true) {
    Show-Banner
    Write-Host "   1)  Start Wisp  (build + launch)" -ForegroundColor White
    Write-Host "   2)  Stop Wisp" -ForegroundColor White
    Write-Host "   3)  Open wispapp.net in browser" -ForegroundColor White
    Write-Host "   4)  Exit" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "   Choose an option"

    switch ($choice) {
        "1" { Start-Wisp }
        "2" { Stop-Wisp }
        "3" { Open-Site }
        "4" { exit }
        default { }
    }
}