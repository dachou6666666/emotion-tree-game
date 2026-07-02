param(
    [string]$RepoPath = (Split-Path -Parent (Split-Path -Parent $PSCommandPath)),
    [string]$RepoName = 'emotion-tree-game',
    [ValidateSet('public', 'private')]
    [string]$Visibility = 'private',
    [int]$IntervalMinutes = 10
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoPath

Write-Host '=== Emotion Tree Game -> GitHub Auto Sync Setup ===' -ForegroundColor Cyan

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI (gh) not found. Install with: winget install GitHub.cli'
}

if (-not (git config --global user.name)) {
    git config --global user.name 'Administrator'
}
if (-not (git config --global user.email)) {
    git config --global user.email 'admin@local.dev'
}

if (-not (Test-Path (Join-Path $RepoPath '.git'))) {
    git init -b main
}

if (-not (git remote get-url origin 2>$null)) {
    $auth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Write-Host 'GitHub not logged in yet. Complete login in the browser window...' -ForegroundColor Yellow
        gh auth login --hostname github.com --git-protocol https --web
    }

    $createArgs = @(
        'repo', 'create', $RepoName,
        '--source=.', '--remote=origin', '--push',
        '--description=Emotion Tree Game - Codex/ChatGPT collaborative project'
    )
    if ($Visibility -eq 'private') { $createArgs += '--private' } else { $createArgs += '--public' }
    & gh @createArgs
    if ($LASTEXITCODE -ne 0) {
        $owner = gh api user -q .login
        git remote add origin "https://github.com/$owner/$RepoName.git" 2>$null
        git push -u origin main
    }
}

$syncScript = Join-Path $RepoPath 'scripts\sync-to-github.ps1'
$taskName = 'EmotionTreeGame-GitHubSync'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$syncScript`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

& $syncScript -Force

Write-Host ''
Write-Host 'Setup complete.' -ForegroundColor Green
Write-Host "Repo: $(git remote get-url origin)"
Write-Host "Auto sync every $IntervalMinutes minutes (task: $taskName)"
Write-Host 'Manual sync: powershell -File scripts/sync-to-github.ps1'
