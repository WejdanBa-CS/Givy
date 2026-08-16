# Prints the upload-keystore SHA-256 for Digital Asset Links (App Links).
# Run locally — never commit key.properties or the keystore.
#
# Usage:
#   cd mobile
#   .\tool\print_assetlinks_sha.ps1
#
# Paste the fingerprint into public/.well-known/assetlinks.json
# (replace REPLACE_WITH_UPLOAD_CERT_SHA256), then redeploy the web app.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$propsPath = Join-Path $root 'android\key.properties'
$keystore = Join-Path $root 'android\upload-keystore.jks'

if (-not (Test-Path $propsPath) -or -not (Test-Path $keystore)) {
  Write-Host 'Missing android/key.properties or android/upload-keystore.jks'
  exit 1
}

$storePass = $null
$alias = 'upload'
Get-Content $propsPath | ForEach-Object {
  if ($_ -match '^storePassword=(.+)$') { $storePass = $Matches[1] }
  if ($_ -match '^keyAlias=(.+)$') { $alias = $Matches[1] }
}

if (-not $storePass) {
  Write-Host 'storePassword not found in key.properties'
  exit 1
}

$keytool = @(
  "${env:ProgramFiles}\Android\Android Studio\jbr\bin\keytool.exe",
  "${env:ProgramFiles}\Java\jdk-21\bin\keytool.exe",
  'keytool'
) | Where-Object { $_ -eq 'keytool' -or (Test-Path $_) } | Select-Object -First 1

$out = & $keytool -list -v -keystore $keystore -alias $alias -storepass $storePass 2>&1 | Out-String
$m = [regex]::Match($out, 'SHA256:\s*([0-9A-Fa-f:]+)')
if (-not $m.Success) {
  Write-Host 'Could not parse SHA256 from keytool output.'
  Write-Host $out
  exit 1
}

$fp = $m.Groups[1].Value.ToUpperInvariant()
Write-Host ''
Write-Host 'Paste this into public/.well-known/assetlinks.json:'
Write-Host $fp
Write-Host ''
