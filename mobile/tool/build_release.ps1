# Builds a Play-ready Android App Bundle for Givy.
#
# Prerequisites:
# 1. android/key.properties + android/upload-keystore.jks (created once locally)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root 'pubspec.yaml'))) {
  # script lives in mobile/tool
  $root = Split-Path -Parent $PSScriptRoot
}
Set-Location $root

$keyProps = Join-Path $root 'android\key.properties'
$keystore = Join-Path $root 'android\upload-keystore.jks'
if (-not (Test-Path $keyProps) -or -not (Test-Path $keystore)) {
  Write-Host 'Missing release signing files.'
  Write-Host 'Run: .\tool\create_keystore.ps1'
  exit 1
}

$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path','User')

Write-Host 'Building Givy release App Bundle…'
flutter build appbundle --release

$aab = Join-Path $root 'build\app\outputs\bundle\release\app-release.aab'
if (Test-Path $aab) {
  Write-Host ''
  Write-Host "Ready for Play Console: $aab"
} else {
  Write-Host 'Build finished but AAB was not found.'
  exit 1
}
