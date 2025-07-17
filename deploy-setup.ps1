# Whayland Daily Report App - Quick Setup Script
# This script deploys Whayland-specific configuration to the main app

param(
    [string]$Mode = "whayland"  # Options: "whayland" or "generic"
)

$AppDir = "c:\Users\WendyBlough\OneDrive - Whayland Company\Documents\Final - DailyReportApp\DailyReportApp"
$WhaylandConfig = "c:\Users\WendyBlough\OneDrive - Whayland Company\Documents\Final - DailyReportApp\Whayland-Configuration"
$AppStoreDir = "c:\Users\WendyBlough\OneDrive - Whayland Company\Documents\Final - DailyReportApp\AppStore-Distribution"

Write-Host "🏗️  Daily Report App Setup Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

if ($Mode -eq "whayland") {
    Write-Host "📋 Deploying Whayland Configuration..." -ForegroundColor Yellow
    
    # Copy Whayland configuration files
    if (Test-Path "$WhaylandConfig\msal-config-whayland.js") {
        Copy-Item "$WhaylandConfig\msal-config-whayland.js" "$AppDir\src\js\msal-config.js" -Force
        Write-Host "✅ Copied Whayland MSAL configuration" -ForegroundColor Green
    }
    
    if (Test-Path "$WhaylandConfig\sharepoint-config-whayland.js") {
        Copy-Item "$WhaylandConfig\sharepoint-config-whayland.js" "$AppDir\src\js\sharepoint-api.js" -Force
        Write-Host "✅ Copied Whayland SharePoint configuration" -ForegroundColor Green
    }
    
    # Copy Whayland branding
    if (Test-Path "$WhaylandConfig\whayland-logo.png") {
        Copy-Item "$WhaylandConfig\whayland-logo.png" "$AppDir\src\assets\logo.png" -Force
        Write-Host "✅ Copied Whayland logo" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🔧 Manual Steps Required:" -ForegroundColor Magenta
    Write-Host "1. Update Azure AD Client ID in src/js/msal-config.js" -ForegroundColor White
    Write-Host "2. Update Tenant ID in src/js/msal-config.js" -ForegroundColor White
    Write-Host "3. Update SharePoint site URL in src/js/sharepoint-api.js" -ForegroundColor White
    Write-Host "4. Apply Whayland color scheme (#262666) to src/css/dailyreport.css" -ForegroundColor White
    
} elseif ($Mode -eq "generic") {
    Write-Host "📱 Preparing Generic App Store Version..." -ForegroundColor Yellow
    
    # The AppStore-Distribution folder is already configured with generic settings
    Write-Host "✅ Generic version ready in AppStore-Distribution folder" -ForegroundColor Green
    Write-Host "✅ Generic branding and placeholder configurations applied" -ForegroundColor Green
    
} else {
    Write-Host "❌ Invalid mode. Use 'whayland' or 'generic'" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. cd `"$AppDir`"" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev (for testing)" -ForegroundColor White
Write-Host "4. npx cap build ios (for iOS build)" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Whayland setup: Whayland-Configuration\whayland-deployment-guide.md" -ForegroundColor White
Write-Host "- Generic setup: AppStore-Distribution\README.md" -ForegroundColor White
