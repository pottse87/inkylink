# scripts/smoke.ps1 — quick API smoke (idempotent)
$ErrorActionPreference = "Stop"
$DOMAIN = "$env:INKY_DOMAIN"; if ([string]::IsNullOrWhiteSpace($DOMAIN)) { $DOMAIN = "http://localhost:3000" }
$ORDER  = "$env:ORDER"
$CID    = "$env:CID"

function Show([string]$title) { Write-Host "`n[$title]" -ForegroundColor Cyan }

Show "catalog"
$c = Invoke-WebRequest -UseBasicParsing -Uri "$DOMAIN/api/catalog" -SkipHttpErrorCheck
"$($c.StatusCode)"
$d = $c.Content | ConvertFrom-Json
"items: $($d.items.Count)"

if (-not [string]::IsNullOrWhiteSpace($CID)) {
  Show "orders/latest"
  $l = Invoke-WebRequest -UseBasicParsing -Uri "$DOMAIN/api/orders/latest?client_id=$CID" -SkipHttpErrorCheck
  "$($l.StatusCode)"
  $ld = $l.Content | ConvertFrom-Json
  "order: $($ld.order?.id)"
}

if (-not ([string]::IsNullOrWhiteSpace($ORDER) -or [string]::IsNullOrWhiteSpace($CID))) {
  Show "save-order x2"
  $body = @{ order_id=$ORDER; client_id=$CID; answers=@{ probe="smoke"; ts=(Get-Date -Format s) } } | ConvertTo-Json -Depth 6
  $r1 = Invoke-WebRequest -UseBasicParsing -Method POST -Uri "$DOMAIN/api/save-order" -ContentType "application/json" -Body $body -SkipHttpErrorCheck
  $r2 = Invoke-WebRequest -UseBasicParsing -Method POST -Uri "$DOMAIN/api/save-order" -ContentType "application/json" -Body $body -SkipHttpErrorCheck
  "$($r1.StatusCode) $($r1.Content)"
  "$($r2.StatusCode) $($r2.Content)"
}

Show "log-error"
$payload = @{ event="smoke"; message="hello"; detail=@{ env="scripts/smoke.ps1" } } | ConvertTo-Json -Depth 5
$e = Invoke-WebRequest -UseBasicParsing -Method POST -Uri "$DOMAIN/api/log-error" -ContentType "application/json" -Body $payload -SkipHttpErrorCheck
"$($e.StatusCode) $($e.Content)"
