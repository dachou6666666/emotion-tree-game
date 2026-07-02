param(
    [string]$RepoPath = (Split-Path -Parent (Split-Path -Parent $PSCommandPath)),
    [string]$Branch = 'main',
    [string]$Remote = 'origin',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoPath

function Write-Log([string]$Message) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $line
    $logFile = Join-Path $RepoPath '.github-sync.log'
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

if (-not (Test-Path (Join-Path $RepoPath '.git'))) {
    Write-Log 'ERROR: not a git repository'
    exit 1
}

$remoteUrl = git remote get-url $Remote 2>$null
if (-not $remoteUrl) {
    Write-Log "ERROR: remote '$Remote' not configured"
    exit 1
}

git add -A
$status = git status --porcelain
if (-not $status -and -not $Force) {
    Write-Log 'No changes to sync'
    exit 0
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
if ($status) {
    git commit -m "auto-sync: $timestamp"
    Write-Log "Committed local changes"
}

git fetch $Remote $Branch 2>$null
$local = git rev-parse HEAD
$remote = git rev-parse "$Remote/$Branch" 2>$null

if ($LASTEXITCODE -eq 0 -and $remote) {
    git rebase "$Remote/$Branch" 2>$null
    if ($LASTEXITCODE -ne 0) {
        git rebase --abort 2>$null
        git pull --rebase $Remote $Branch
    }
}

git push $Remote "HEAD:$Branch"
Write-Log 'Pushed to GitHub'
