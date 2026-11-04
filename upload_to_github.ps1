# ==============================================================================
# Mustard Investments - GitHub Upload Helper Script
# ==============================================================================

param(
    [string]$RepoUrl = "",
    [string]$GitHubToken = "",
    [string]$RepoName = "mustard-investments"
)

$ErrorActionPreference = "Stop"

# Locate Git
$gitExe = "git"
$fallbackGit = "C:\Users\ewang\.gemini\antigravity\bin\git\cmd\git.exe"
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitExe = "git"
} elseif (Test-Path $fallbackGit) {
    $gitExe = $fallbackGit
} else {
    Write-Error "Git was not found. Please install Git or verify $fallbackGit exists."
    exit 1
}

$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = Get-Location }

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  Mustard Investments -> GitHub Uploader" -ForegroundColor Cyan
Write-Host "  Project directory: $projectDir" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Yellow

# Step 1: Initialize git if not already initialized
if (-not (Test-Path (Join-Path $projectDir ".git"))) {
    Write-Host "[1/4] Initializing Git repository..." -ForegroundColor Yellow
    & $gitExe -C $projectDir init
    & $gitExe -C $projectDir branch -M main
} else {
    Write-Host "[1/4] Git repository already initialized." -ForegroundColor Green
}

# Step 2: Stage & commit all files
Write-Host "[2/4] Staging files and creating commit..." -ForegroundColor Yellow
& $gitExe -C $projectDir add -A
& $gitExe -C $projectDir commit -m "Initial commit: Mustard Investments Simulator replica" -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit or commit already up to date." -ForegroundColor Gray
}

# Step 3: Check repository destination
if (-not $RepoUrl -and -not $GitHubToken) {
    Write-Host ""
    Write-Host "Choose how you would like to push to GitHub:" -ForegroundColor Cyan
    Write-Host "1) I already created an empty repository on GitHub and have its URL (e.g., https://github.com/username/mustard-investments.git)"
    Write-Host "2) I have a GitHub Personal Access Token (PAT) and want this script to create & push the repository automatically"
    Write-Host ""
    $choice = Read-Host "Enter option (1 or 2)"

    if ($choice -eq "1") {
        $RepoUrl = Read-Host "Paste your GitHub Repository URL (HTTPS or SSH)"
    } elseif ($choice -eq "2") {
        $GitHubToken = Read-Host -AsSecureString "Paste your GitHub Personal Access Token (PAT)"
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubToken)
        $GitHubToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        
        $userRepoName = Read-Host "Enter repository name (default: mustard-investments)"
        if ($userRepoName) { $RepoName = $userRepoName }
    }
}

# Step 4: Handle automated repo creation via Token if provided
if ($GitHubToken -and -not $RepoUrl) {
    Write-Host "[3/4] Creating repository '$RepoName' on GitHub via REST API..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept"        = "application/vnd.github.v3+json"
        "User-Agent"    = "Mustard-Replica-Uploader"
    }

    $body = @{
        name        = $RepoName
        description = "Mustard Investments - Self-hosted paper trading & virtual portfolio simulator replica"
        private     = $false
        homepage    = "https://github.com"
    } | ConvertTo-Json

    try {
        $resp = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
        $RepoUrl = $resp.clone_url
        Write-Host "Successfully created GitHub repository: $($resp.html_url)" -ForegroundColor Green
        
        # Inject token into clone URL for push authentication
        $uri = [System.Uri]$RepoUrl
        $authenticatedUrl = "https://$GitHubToken@$($uri.Host)$($uri.AbsolutePath)"
        $RepoUrl = $authenticatedUrl
    } catch {
        Write-Warning "Could not create repo directly via API: $($_.Exception.Message)"
        Write-Host "If the repository already exists, please provide its URL directly."
        $RepoUrl = Read-Host "Paste repository URL"
    }
}

# Step 5: Push to remote
if ($RepoUrl) {
    Write-Host "[4/4] Pushing code to GitHub remote..." -ForegroundColor Yellow
    # Check if origin already exists
    $remotes = & $gitExe -C $projectDir remote
    if ($remotes -contains "origin") {
        & $gitExe -C $projectDir remote set-url origin $RepoUrl
    } else {
        & $gitExe -C $projectDir remote add origin $RepoUrl
    }

    & $gitExe -C $projectDir push -u origin main --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "  SUCCESS! Your Mustard Investments replica is on GitHub! " -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
    } else {
        Write-Error "Git push failed. Please check your GitHub credentials or remote URL."
    }
} else {
    Write-Host "No remote URL provided. Files are committed locally in Git." -ForegroundColor Yellow
}
