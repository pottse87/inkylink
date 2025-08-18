<# ============================
 Inkylink one-shot diagnostics
============================ #>

param(
  [string]$Base        = "https://www.inkylink.com",
  [string]$Deployment  = "https://inkylink-website-448g6b6vq-ean-potts-projects.vercel.app",
  [string]$VercelScope = "",
  [string]$Since       = "45m",
  [int]$LogLimit       = 400
)

function Save-IfExists([string]$path, [string]$dest) {
  if (Test-Path -LiteralPath $path) { Get-Content -Raw -LiteralPath $path | Out-File -Encoding UTF8 $dest }
}
function TryJson([string]$content) {
  try { return ($content | ConvertFrom-Json) } catch { return $null }
}
function Get-Rel([string]$p) {
  try {
    $abs = (Resolve-Path -LiteralPath $p -ErrorAction Stop).Path
    return [System.IO.Path]::GetRelativePath((Get-Location).Path, $abs)
  } catch { return $p }
}
function Run-VercelLogs {
  param([string]$Deployment,[string]$Since,[int]$Limit,[string]$Scope)
  $args = @("logs", $Deployment, "--since=$Since", "--limit=$Limit")
  if ($Scope) { $args = @("--scope", $Scope) + $args }
  & vercel @args 2>&1
}
function Run-VercelInspect {
  param([string]$Deployment,[string]$Scope)
  $args = @("inspect", $Deployment)
  if ($Scope) { $args = @("--scope", $Scope) + $args }
  & vercel @args 2>&1
}

$ts = (Get-Date).ToString("yyyyMMdd-HHmmss")
$outDir = "inkylink_diag-$ts"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Write-Host "Writing report to $outDir`n"

# 1) package.json
$pkg = $null
if (Test-Path -LiteralPath "package.json") {
  $pkgRaw = Get-Content -Raw "package.json"
  $pkg = TryJson $pkgRaw
  $pkgRaw | Out-File -Encoding UTF8 "$outDir\package.json"
}
$pkgSummary = [ordered]@{
  hasPackageJson = [bool]$pkg
  type           = if ($pkg) { $pkg.type } else { $null }
  engines_node   = if ($pkg) { $pkg.engines.node } else { $null }
  dep_pg         = if ($pkg) { $pkg.dependencies.pg } else { $null }
  devdep_pg      = if ($pkg) { $pkg.devDependencies.pg } else { $null }
  next_version   = if ($pkg) { $pkg.dependencies.next } else { $null }
}

# 2) vercel.json + next.config.js
if (Test-Path -LiteralPath "vercel.json") { Save-IfExists "vercel.json" "$outDir\vercel.json" }
Save-IfExists "next.config.js" "$outDir\next.config.js"

# 3) Inventory API files + middleware
$apiPaths = @()
if (Test-Path "pages\api") { $apiPaths += (Get-ChildItem -Recurse -File "pages\api").FullName | ForEach-Object { Get-Rel $_ } }
if (Test-Path "app\api")   { $apiPaths += (Get-ChildItem -Recurse -File "app\api").FullName   | ForEach-Object { Get-Rel $_ } }
$apiPaths | Out-File -Encoding UTF8 "$outDir\api-paths.txt"

$middleware = Get-ChildItem -Recurse -File -Include "middleware.js","middleware.ts" 2>$null | ForEach-Object { Get-Rel $_.FullName }
$middleware | Out-File -Encoding UTF8 "$outDir\middleware.txt"

# 4) Where 'pg' is imported
$pgUsages = Select-String -Path (Get-ChildItem -Recurse -File | Select-Object -Expand FullName) `
  -Pattern "from\s+['""]pg['""]|require\(['""]pg['""]\)" -SimpleMatch:$false -ErrorAction SilentlyContinue |
  ForEach-Object { [PSCustomObject]@{ File = Get-Rel $_.Path; Line = $_.LineNumber; Text = $_.Line.Trim() } }
$pgUsages | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 "$outDir\pg-imports.json"

# 5) Endpoint probes
$probes = @(
  @{ name="healthz";      url="$Base/api/healthz" },
  @{ name="db-ping";      url="$Base/api/db-ping" },
  @{ name="env-inspect";  url="$Base/api/env-inspect" },
  @{ name="db-host";      url="$Base/api/db-host" }
)
$probeResults = @()
foreach ($p in $probes) {
  Write-Host "Probing $($p.name) $($p.url)"
  try { $head = Invoke-WebRequest -Method HEAD -Uri $p.url -UseBasicParsing -ErrorAction Stop } catch { $head = $_.Exception.Response }
  $bodyContent = $null; $status = $null
  try {
    $resp = Invoke-WebRequest -Method GET -Uri $p.url -UseBasicParsing -ErrorAction Stop
    $status = $resp.StatusCode; $bodyContent = $resp.Content
  } catch {
    $exResp = $_.Exception.Response
    if ($exResp -and $exResp -is [System.Net.HttpWebResponse]) {
      $status = [int]$exResp.StatusCode
      try { $bodyContent = (New-Object System.IO.StreamReader($exResp.GetResponseStream())).ReadToEnd() } catch {}
    }
  }
  $json = TryJson $bodyContent
  $sample = if ($json) { $null } else { ($bodyContent | Out-String).Substring(0, [Math]::Min(250, ($bodyContent | Out-String).Length)) }
  $fname = "$outDir\probe-$($p.name).txt"
  if ($bodyContent) { $bodyContent | Out-File -Encoding UTF8 $fname } else { "" | Out-File -Encoding UTF8 $fname }
  $probeResults += [PSCustomObject]@{
    name          = $p.name
    url           = $p.url
    status        = $status
    cacheControl  = if ($head) { $head.Headers["Cache-Control"] } else { $null }
    contentType   = if ($head) { $head.Headers["Content-Type"] } else { $null }
    xMatchedPath  = if ($head) { $head.Headers["X-Matched-Path"] } else { $null }
    xVercelCache  = if ($head) { $head.Headers["X-Vercel-Cache"] } else { $null }
    isJson        = [bool]$json
    jsonPreview   = if ($json) { ($json | ConvertTo-Json -Depth 8) } else { $null }
    nonJsonSample = $sample
    savedBody     = (Split-Path -Leaf $fname)
  }
}
$probeResults | ConvertTo-Json -Depth 8 | Out-File -Encoding UTF8 "$outDir\endpoint-probes.json"

# 6) Vercel logs + inspect
$logsAll = Run-VercelLogs -Deployment $Deployment -Since $Since -Limit $LogLimit -Scope $VercelScope
$logsAll | Out-File -Encoding UTF8 "$outDir\vercel-logs-all.txt"
($logsAll | Select-String -Pattern "/api/db-ping|db-ping|Function invocation" -SimpleMatch:$false) | Out-File -Encoding UTF8 "$outDir\vercel-logs-db-ping.txt"
($logsAll | Select-String -Pattern "ERROR|Unhandled|Cannot|Module not found|pg|TypeError|ReferenceError" -SimpleMatch:$false) | Out-File -Encoding UTF8 "$outDir\vercel-logs-errors.txt"

$inspect = Run-VercelInspect -Deployment $Deployment -Scope $VercelScope
$inspect | Out-File -Encoding UTF8 "$outDir\vercel-inspect.txt"
$nodeGuess = ($inspect | Select-String -Pattern "Node\.js Version|Node Version|Node:" -SimpleMatch:$false | Select-Object -First 1).ToString()

# 7) Save a few key source files
Save-IfExists "lib\db.js"                "$outDir\lib-db.js"
Save-IfExists "pages\api\db-ping.js"     "$outDir\api-db-ping.js"
Save-IfExists "pages\api\env-inspect.js" "$outDir\api-env-inspect.js"
Save-IfExists "pages\api\db-host.js"     "$outDir\api-db-host.js"

# 8) Summary
$summary = [ordered]@{
  baseUrl          = $Base
  deployment       = $Deployment
  package          = $pkgSummary
  hasVercelJson    = (Test-Path "vercel.json")
  apiFileCount     = $apiPaths.Count
  hasMiddleware    = ($middleware.Count -gt 0)
  pgImportCount    = ($pgUsages | Measure-Object).Count
  pingStatus       = ($probeResults | Where-Object {$_.name -eq "db-ping"}).status
  healthzStatus    = ($probeResults | Where-Object {$_.name -eq "healthz"}).status
  envInspectStatus = ($probeResults | Where-Object {$_.name -eq "env-inspect"}).status
  nodeRuntimeGuess = $nodeGuess
  reportFolder     = $outDir
}
"===== SUMMARY ====="
$summary | ConvertTo-Json -Depth 8
$summary | ConvertTo-Json -Depth 8 | Out-File -Encoding UTF8 "$outDir\SUMMARY.json"
""
"Done. Zip and share the folder: $outDir"
