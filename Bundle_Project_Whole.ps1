# Inkylink Project Bundler for Claude Analysis
# Creates organized text bundle of entire project for AI analysis
# PowerShell 7+ required

param(
    [string]$OutputFile = "inkylink-project-bundle.txt",
    [switch]$IncludeNodeModules = $false,
    [switch]$IncludeLockFiles = $false,
    [int]$MaxFileSize = 1MB
)

$ErrorActionPreference = "Continue"

Write-Host "Bundling Inkylink project for Claude analysis..." -ForegroundColor Cyan
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow

# Files to always exclude
$excludePatterns = @(
    "*.env.local",
    "*.env.production", 
    "*.env",
    ".env.*",
    "*.log",
    "*.tmp",
    "*.temp",
    ".git/*",
    ".next/*",
    "dist/*",
    "build/*",
    ".vercel/*",
    "*.cache"
)

# Additional exclusions based on parameters
if (!$IncludeNodeModules) {
    $excludePatterns += "node_modules/*"
}

if (!$IncludeLockFiles) {
    $excludePatterns += @("package-lock.json", "yarn.lock", "pnpm-lock.yaml")
}

# Extensions to include (code and config files)
$includeExtensions = @(
    ".js", ".jsx", ".ts", ".tsx",
    ".json", ".sql", ".md",
    ".css", ".scss", ".sass",
    ".html", ".xml", ".yml", ".yaml",
    ".txt", ".config"
)

function Should-ExcludeFile {
    param($FilePath)
    
    $relativePath = $FilePath.Replace((Get-Location).Path, "").TrimStart("\")
    
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like $pattern) {
            return $true
        }
    }
    
    # Check file size
    try {
        $size = (Get-Item $FilePath).Length
        if ($size -gt $MaxFileSize) {
            Write-Host "  Skipping large file: $relativePath ($([math]::Round($size/1MB, 2))MB)" -ForegroundColor Yellow
            return $true
        }
    } catch {
        return $true
    }
    
    return $false
}

function Get-FileCategory {
    param($FilePath)
    
    $name = Split-Path $FilePath -Leaf
    $ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
    $dir = Split-Path (Split-Path $FilePath -Parent) -Leaf
    
    if ($FilePath -match "pages[/\\]api") { return "API Routes" }
    if ($FilePath -match "pages[/\\]") { return "Pages" }
    if ($FilePath -match "components[/\\]") { return "Components" }
    if ($FilePath -match "lib[/\\]") { return "Libraries" }
    if ($ext -eq ".sql") { return "Database" }
    if ($name -match "config") { return "Configuration" }
    if ($ext -in @(".json", ".yml", ".yaml")) { return "Configuration" }
    if ($ext -in @(".css", ".scss", ".sass")) { return "Styles" }
    if ($name -in @("package.json", "tsconfig.json", "next.config.js")) { return "Build System" }
    
    return "Other"
}

# Collect all files
Write-Host "Scanning project files..." -ForegroundColor Green

$allFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $ext = $_.Extension.ToLower()
    $include = ($ext -in $includeExtensions) -or ($_.Name -in @("Dockerfile", "Makefile", ".gitignore"))
    $exclude = Should-ExcludeFile $_.FullName
    
    return $include -and !$exclude
}

$filesByCategory = $allFiles | Group-Object { Get-FileCategory $_.FullName }

Write-Host "Found $($allFiles.Count) files to include" -ForegroundColor Green

# Start building the bundle
$bundle = @()

# Header
$bundle += @"
# INKYLINK PROJECT COMPLETE BUNDLE
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Total Files: $($allFiles.Count)
# 
# This bundle contains the complete Inkylink project structure for AI analysis.
# All sensitive files (.env, credentials) have been excluded.
#
# PROJECT OVERVIEW:
# - AI-automated web content creation platform (SEO-focused)
# - Flow: Welcome → Pricing/Bundle → Confirmation → Stripe → Thank You → Forms → Database
# - Tech Stack: Next.js + React + Stripe + PostgreSQL/Supabase + Electron desktop app
# - Current Phase: Backend debugging in test environment
#
################################################################################

"@

# Table of contents
$bundle += "# TABLE OF CONTENTS"
$bundle += "# =================="
$bundle += ""

foreach ($categoryGroup in $filesByCategory | Sort-Object Name) {
    $category = $categoryGroup.Name
    $count = $categoryGroup.Count
    $bundle += "# $category ($count files)"
    
    foreach ($file in $categoryGroup.Group | Sort-Object Name) {
        $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart("\").Replace("\", "/")
        $bundle += "#   $relativePath"
    }
    $bundle += ""
}

$bundle += "################################################################################"
$bundle += ""

# Process each category
foreach ($categoryGroup in $filesByCategory | Sort-Object Name) {
    $category = $categoryGroup.Name
    $files = $categoryGroup.Group | Sort-Object Name
    
    $bundle += ""
    $bundle += "=" * 80
    $bundle += "CATEGORY: $category ($($files.Count) files)"
    $bundle += "=" * 80
    $bundle += ""
    
    foreach ($file in $files) {
        $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart("\").Replace("\", "/")
        
        Write-Host "  Processing: $relativePath" -ForegroundColor White
        
        $bundle += ""
        $bundle += "-" * 40
        $bundle += "FILE: $relativePath"
        $bundle += "SIZE: $([math]::Round($file.Length/1KB, 1))KB"
        $bundle += "MODIFIED: $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"
        $bundle += "-" * 40
        $bundle += ""
        
        try {
            # Read file content
            $encoding = if ($file.Extension -in @('.jpg', '.png', '.ico', '.pdf')) {
                $bundle += "[BINARY FILE - CONTENT SKIPPED]"
                $bundle += ""
                continue
            } else {
                "UTF8"
            }
            
            $content = Get-Content $file.FullName -Raw -Encoding $encoding -ErrorAction Stop
            
            # Clean up content (remove null characters, excessive whitespace)
            $content = $content -replace "`0", ""
            $content = $content -replace "\r\n", "`n"
            $content = $content.Trim()
            
            if ($content.Length -eq 0) {
                $bundle += "[EMPTY FILE]"
            } else {
                $bundle += $content
            }
            
        } catch {
            $bundle += "[ERROR READING FILE: $($_.Exception.Message)]"
        }
        
        $bundle += ""
        $bundle += ""
    }
}

# Footer with analysis suggestions
$bundle += ""
$bundle += "=" * 80
$bundle += "END OF PROJECT BUNDLE"
$bundle += "=" * 80
$bundle += ""
$bundle += "ANALYSIS REQUESTS FOR CLAUDE:"
$bundle += "1. Identify all production-blocking issues"
$bundle += "2. Check for import/export inconsistencies across API routes"
$bundle += "3. Verify database schema matches code expectations"
$bundle += "4. Analyze client-id system conflicts"
$bundle += "5. Check pricing logic consistency across all sources"
$bundle += "6. Verify forms data flow from confirmation through completion"
$bundle += "7. Identify any SSR/client-side hydration issues"
$bundle += "8. Check for missing error handling in critical paths"
$bundle += "9. Verify Stripe integration completeness"
$bundle += "10. Identify any Vercel deployment compatibility issues"
$bundle += ""
$bundle += "PROJECT CONTEXT:"
$bundle += "- Month behind schedule, pushing to production"
$bundle += "- Zero tolerance for errors that could impact deployment"
$bundle += "- Using Vercel + PostgreSQL + Electron desktop app"
$bundle += "- Currently in backend debugging phase with test environment"

# Write the bundle
Write-Host "Writing bundle to $OutputFile..." -ForegroundColor Green

try {
    $bundle -join "`n" | Out-File $OutputFile -Encoding UTF8
    $bundleSize = (Get-Item $OutputFile).Length
    
    Write-Host ""
    Write-Host "✅ Bundle created successfully!" -ForegroundColor Green
    Write-Host "📄 File: $OutputFile" -ForegroundColor White
    Write-Host "📊 Size: $([math]::Round($bundleSize/1MB, 2))MB" -ForegroundColor White
    Write-Host "📁 Files included: $($allFiles.Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "🤖 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Copy the contents of $OutputFile" -ForegroundColor White
    Write-Host "2. Paste into Claude with: 'Analyze this complete Inkylink project bundle'" -ForegroundColor White
    Write-Host "3. Claude will have full context without needing individual file uploads" -ForegroundColor White
    
    if ($bundleSize -gt 5MB) {
        Write-Host ""
        Write-Host "⚠️  WARNING: Bundle is quite large ($([math]::Round($bundleSize/1MB, 2))MB)" -ForegroundColor Yellow
        Write-Host "   You may need to split it or use a service like pastebin for very large projects" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to create bundle: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💡 TIP: This bundle excludes sensitive files but contains your complete project structure" -ForegroundColor Cyan
Write-Host "📝 The bundle includes analysis instructions for Claude at the bottom" -ForegroundColor Cyan