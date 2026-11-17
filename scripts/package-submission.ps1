param(
  [Parameter(Mandatory=$true)][string]$EvidenceDirectory,
  [string]$OutputDirectory = ('data/submission/' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $repo
$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { $git = 'C:/Program Files/Git/cmd/git.exe' }
& $git diff --quiet HEAD
if ($LASTEXITCODE -ne 0) { throw 'Commit or checkpoint intended source changes before packaging' }
$commit = (& $git rev-parse HEAD).Trim()
$evidence = (Resolve-Path -LiteralPath $EvidenceDirectory).Path
$allowedEvidence = Join-Path $repo 'data/local-mvp/real-creation-check-'
if (-not $evidence.StartsWith($allowedEvidence, [StringComparison]::OrdinalIgnoreCase)) { throw 'Expected local fixture-browser evidence' }
$report = Get-Content -LiteralPath (Join-Path $evidence 'report.json') -Raw | ConvertFrom-Json
if (-not $report.submission -or -not $report.inventoryUnchanged -or $report.cloudflareRequests -ne 0 -or $report.consoleErrors.Count -ne 0) { throw 'Successful offline submission browser evidence required' }
$output = [IO.Path]::GetFullPath((Join-Path $repo $OutputDirectory))
$allowedOutput = (Join-Path $repo 'data/submission') + [IO.Path]::DirectorySeparatorChar
if (-not $output.StartsWith($allowedOutput, [StringComparison]::OrdinalIgnoreCase) -or (Test-Path -LiteralPath $output)) { throw 'Use a new output directory under data/submission' }
$extras = @{}
foreach ($name in @('data/test-mat40.png','data/test/TEST1.png','data/test/markers.json')) { $extras[$name] = Join-Path $repo $name }
foreach ($name in @('1920-new-project-upload.png','1920-fabric-analysis.png','1920-new-concepts.png','1920-concept-product-preview.png','1920-actual-pattern.png','1920-actual-nesting.png','1920-prototype-review.png','cutting-pattern.svg','nesting-layout.svg','proposed-assembly.svg','assembly-instructions.json','demo-result.json')) { $extras['submission-examples/'+$name] = Join-Path $evidence $name }
foreach ($file in $extras.Values) { if (-not (Test-Path -LiteralPath $file -PathType Leaf) -or (Get-Item -LiteralPath $file).Length -eq 0) { throw 'A required fixture/evidence file is missing' } }

# Use existing dotenv to scan actual configured secrets without printing them.
$env:BORSAL_SUBMISSION_SCAN_FILES = ConvertTo-Json -InputObject @($extras.Values) -Compress
$scan = @'
require('dotenv').config({quiet:true});const fs=require('fs'),{execFileSync}=require('child_process');
const git=process.platform==='win32'?'C:/Program Files/Git/cmd/git.exe':'git',tracked=execFileSync(git,['ls-files','-z'],{encoding:'utf8'}).split(String.fromCharCode(0)).filter(Boolean);
for(const file of [...tracked,...JSON.parse(process.env.BORSAL_SUBMISSION_SCAN_FILES)]){const b=fs.readFileSync(file);for(const key of ['CF_ACCOUNT_ID','CF_API_TOKEN','CLOUDFLARE_API_TOKEN','BORSAL_APPROVAL_TOKEN'])if(process.env[key]?.length>=12&&b.includes(Buffer.from(process.env[key])))throw Error('Configured secret detected; packaging stopped');}
console.log('Configured-credential scan passed');
'@
try { & node -e $scan; if ($LASTEXITCODE -ne 0) { throw 'Credential scan failed' } } finally { Remove-Item Env:BORSAL_SUBMISSION_SCAN_FILES }
New-Item -ItemType Directory -Path $output | Out-Null
$archive = Join-Path $output 'borsal-mvp-source.zip'
& $git archive --format=zip --prefix=borsal/ --output=$archive HEAD
if ($LASTEXITCODE -ne 0) { throw 'Source archive failed' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open($archive, [IO.Compression.ZipArchiveMode]::Update)
try {
  foreach ($name in $extras.Keys) {
    $entry = 'borsal/' + $name
    if ($zip.GetEntry($entry)) { throw 'Refusing duplicate package entry' }
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$extras[$name],$entry,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $zip.Dispose() }
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
$manifest = @()
try {
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName.EndsWith('/')) { continue }
    if ($entry.FullName -match '(^|/)(\.git|node_modules|\.aws|\.codex)(/|$)|(^|/)\.env$|client/dist/|results/|request-budget/|\.bundle$|\.archive\.gz$|\.dpapi$|\.log$') { throw 'Excluded private/cache content found in package' }
    if ($entry.FullName -match '(^|/)\.\./|^[A-Za-z]:|^/') { throw 'Unsafe archive path' }
    $stream=$entry.Open(); $sha=[Security.Cryptography.SHA256]::Create()
    try { $digest=([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','').ToLowerInvariant() } finally { $stream.Dispose(); $sha.Dispose() }
    $manifest += @{path=$entry.FullName;bytes=$entry.Length;sha256=$digest}
  }
  foreach ($required in @('README.md','.env.example','package.json','package-lock.json','client/package.json','client/package-lock.json','src/app.js','scripts/local-mvp.js','client/src/main.jsx','docs/MVP_DELIVERY_STATUS.md','data/test-mat40.png','submission-examples/nesting-layout.svg')) {
    if (-not $zip.GetEntry('borsal/'+$required)) { throw "Missing required package entry: $required" }
  }
} finally { $zip.Dispose() }
$result = @{status='VERIFIED_SOURCE_PACKAGE';sourceCommit=$commit;archive=$archive;archiveSha256=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant();fileCount=$manifest.Count;files=$manifest;scope='Source + explicit test fixtures/examples; no credentials, active database, ledger, private backups or dependency caches';generatedAt=[DateTime]::UtcNow.ToString('o')}
[IO.File]::WriteAllText((Join-Path $output 'package-manifest.json'),($result | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
Write-Output "Verified source package: $archive ($($manifest.Count) files; source $commit)"
