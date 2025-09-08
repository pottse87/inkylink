# Critical Files Bundler for Inkylink Project
# Creates a smaller bundle with only the most critical files for analysis
# PowerShell 7+ required

param(
    [string]$OutputFile = "inkylink-critical-bundle.txt"
)

$ErrorActionPreference = "Continue"

Write-Host "Creating critical files bundle for Claude analysis..." -ForegroundColor Cyan
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow

# Only the most critical files that cause production issues
$criticalFiles = @(
    # Core configuration
    "package.json",
    "tailwind.config.js", 
    "next.config.js",
    "postcss.config.js",
    
    # Main app files
    "pages/_app.js",
    "pages/_document.js",
    "pages/index.js",
    
    # Critical user flow pages
    "pages/pricing.js",
    "pages/confirmation.js", 
    "pages/forms.js",
    "pages/checkout.js",
    
    # Library conflicts
    "lib/client-id.js",
    "lib/clientId.js",
    "lib/db.js",
    "lib/env.js",
    
    # Critical API routes
    "pages/api/create-checkout-session.js",
    "pages/api/save-cloud-cart.js",
    "pages/api/get-cloud-cart.js",
    "pages/api/webhook.js",
    "pages/api/orders/next.js",
    "pages/api/orders/latest.js",
    "pages/api/orders/complete.js",
    
    # Key components
    "components/PlansSection.jsx",
    "components/CloudCartPersistBlock.jsx",
    "components/FormSection.js",
    
    # Styles
    "styles/globals.css"
)

# Start building the bundle
$bundle = @()

# Header
$bundle += @"
# INKYLINK CRITICAL FILES BUNDLE
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# 
# This bundle contains ONLY the most critical files causing production issues.
# All sensitive files (.env, credentials) have been excluded.
#
# CRITICAL ISSUES TO ANALYZE:
# 1. Client-ID system conflicts (lib/client-id.js vs lib/clientId.js)
# 2. Import/export inconsistencies in API routes  
# 3. Tailwind configuration pointing to wrong directories
# 4. Pricing logic conflicts between components and database
# 5. Forms data flow from confirmation to completion
# 6. Database schema mismatches
# 7. Missing environment variable fallbacks
#
################################################################################

"@

# Table of contents
$bundle += "# CRITICAL FILES INCLUDED:"
$bundle += "# ========================"
$bundle += ""

$existingFiles = @()
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $existingFiles += $file
        $bundle += "# ✅ $file"
    } else {
        $bundle += "# ❌ $file (MISSING)"
    }
}

$bundle += ""
$bundle += "# Total files found: $($existingFiles.Count) of $($criticalFiles.Count)"
$bundle += "################################################################################"
$bundle += ""

# Process each existing file
foreach ($filePath in $existingFiles) {
    Write-Host "  Processing: $filePath" -ForegroundColor White
    
    $bundle += ""
    $bundle += "=" * 60
    $bundle += "FILE: $filePath"
    if (Test-Path $filePath) {
        $fileInfo = Get-Item $filePath
        $bundle += "SIZE: $([math]::Round($fileInfo.Length/1KB, 1))KB"
        $bundle += "MODIFIED: $($fileInfo.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"
    }
    $bundle += "=" * 60
    $bundle += ""
    
    try {
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw -Encoding UTF8 -ErrorAction Stop
            
            # Clean up content
            $content = $content -replace "`0", ""
            $content = $content -replace "\r\n", "`n" 
            $content = $content.Trim()
            
            if ($content.Length -eq 0) {
                $bundle += "[EMPTY FILE]"
            } else {
                $bundle += $content
            }
        } else {
            $bundle += "[FILE NOT FOUND]"
        }
        
    } catch {
        $bundle += "[ERROR READING FILE: $($_.Exception.Message)]"
    }
    
    $bundle += ""
    $bundle += ""
}

# Analysis instructions
$bundle += ""
$bundle += "=" * 80
$bundle += "ANALYSIS INSTRUCTIONS FOR CLAUDE"
$bundle += "=" * 80
$bundle += ""
$bundle += "PRIORITY 1 - CLIENT ID CONFLICTS:"
$bundle += "• Check if both lib/client-id.js AND lib/clientId.js exist"
$bundle += "• Verify which one _app.js imports from"
$bundle += "• Identify localStorage persistence issues"
$bundle += ""
$bundle += "PRIORITY 2 - API ROUTE CONSISTENCY:"
$bundle += "• Look for mixed module.exports and export default"
$bundle += "• Find import statements mixed with require()"
$bundle += "• Identify files needing ES module conversion"
$bundle += ""
$bundle += "PRIORITY 3 - CONFIGURATION ISSUES:"
$bundle += "• Check if tailwind.config.js points to wrong directories"
$bundle += "• Verify next.config.js exists and is properly configured"
$bundle += "• Look for missing environment variable fallbacks"
$bundle += ""
$bundle += "PRIORITY 4 - DATA FLOW ISSUES:"
$bundle += "• Trace order data flow from pricing → confirmation → forms"
$bundle += "• Check for broken URL parameter passing"
$bundle += "• Verify API endpoints match frontend calls"
$bundle += ""
$bundle += "PRIORITY 5 - PRICING CONFLICTS:"
$bundle += "• Look for hardcoded prices vs database prices"
$bundle += "• Check for multiple pricing sources causing conflicts"
$bundle += "• Verify Stripe price IDs match across all files"
$bundle += ""
$bundle += "PROJECT CONTEXT:"
$bundle += "• Month behind schedule, zero tolerance for errors"
$bundle += "• Deploying to Vercel with PostgreSQL + Electron desktop"
$bundle += "• Currently in backend debugging phase"
$bundle += "• User flow: Welcome → Pricing → Confirmation → Stripe → Forms → DB"

# Write the bundle
Write-Host "Writing bundle to $OutputFile..." -ForegroundColor Green

try {
    $bundle -join "`n" | Out-File $OutputFile -Encoding UTF8
    $bundleSize = (Get-Item $OutputFile).Length
    
    Write-Host ""
    Write-Host "✅ Critical files bundle created!" -ForegroundColor Green
    Write-Host "📄 File: $OutputFile" -ForegroundColor White
    Write-Host "📊 Size: $([math]::Round($bundleSize/1KB, 1))KB" -ForegroundColor White
    Write-Host "📁 Files included: $($existingFiles.Count) critical files" -ForegroundColor White
    Write-Host ""
    
    if ($bundleSize -lt 500KB) {
        Write-Host "✅ Bundle size is manageable for Claude analysis" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Bundle is $([math]::Round($bundleSize/1KB, 1))KB - should still work" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🤖 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Open the file: notepad $OutputFile" -ForegroundColor White
    Write-Host "2. Copy ALL the contents (Ctrl+A, Ctrl+C)" -ForegroundColor White
    Write-Host "3. Paste into Claude with: 'Analyze this critical files bundle'" -ForegroundColor White
    Write-Host "4. Claude will identify all production-blocking issues" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to create bundle: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💡 This bundle contains only the files causing your production issues" -ForegroundColor Cyan
Write-Host "🔧 Claude can now provide specific fixes for each critical problem" -ForegroundColor Cyan