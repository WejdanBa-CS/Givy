# Creates android/upload-keystore.jks + android/key.properties for Play uploads.
# Run once. Keep backups offline — never commit these files.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$androidDir = Join-Path $root 'android'
$keystore = Join-Path $androidDir 'upload-keystore.jks'
$keyProps = Join-Path $androidDir 'key.properties'

if (Test-Path $keystore) {
  Write-Host "Keystore already exists: $keystore"
  exit 0
}

$pass = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
$alias = 'upload'

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
$keytoolPath = $null
if ($keytool) {
  $keytoolPath = $keytool.Source
} elseif ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\keytool.exe'))) {
  $keytoolPath = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
} else {
  $fallbacks = @(
    'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe',
    'C:\Program Files\Java\jdk-21\bin\keytool.exe'
  )
  foreach ($f in $fallbacks) {
    if (Test-Path $f) { $keytoolPath = $f; break }
  }
}

if (-not $keytoolPath) {
  Write-Host 'keytool not found. Install a JDK or Android Studio.'
  exit 1
}

& $keytoolPath -genkeypair -v `
  -keystore $keystore `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias $alias `
  -storepass $pass `
  -keypass $pass `
  -dname 'CN=Givy, OU=Mobile, O=Wejdan Al Amri, L=Riyadh, ST=Riyadh, C=SA'

@"
storePassword=$pass
keyPassword=$pass
keyAlias=$alias
storeFile=upload-keystore.jks
"@ | Set-Content -Path $keyProps -Encoding ASCII

Write-Host ''
Write-Host "Created $keystore"
Write-Host "Created $keyProps"
Write-Host 'Back these up somewhere safe (password manager / offline drive).'
Write-Host 'They are gitignored and required for every future Play update.'
