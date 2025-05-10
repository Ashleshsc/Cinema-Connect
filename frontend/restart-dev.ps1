Write-Host "Stopping any running React development server..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*React*" } | Stop-Process -Force

Write-Host "Clearing environment variable cache..."
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

Write-Host "Starting the development server..."
npm start 