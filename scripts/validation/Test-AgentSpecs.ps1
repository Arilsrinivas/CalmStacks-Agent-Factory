<#
.SYNOPSIS
    Validates YAML frontmatter and structural completeness of Antigravity custom subagents.
.EXAMPLE
    .\scripts\validation\Test-AgentSpecs.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "==> CalmStacks Agent Factory: Validating Custom Subagents" -ForegroundColor Cyan

$agentDir = ".agents/agents"
if (-not (Test-Path $agentDir)) {
    Write-Error "Custom agent directory not found at $agentDir"
    exit 1
}

$agentFiles = Get-ChildItem "$agentDir/*.md"
if ($agentFiles.Count -eq 0) {
    Write-Error "No agent definition files found in $agentDir"
    exit 1
}

$expectedAgents = @("product", "architect", "uiux", "frontend", "backend", "database", "aiml", "qa", "security", "devops")
$foundAgents = @()
$errorsFound = 0

foreach ($file in $agentFiles) {
    $rawContent = Get-Content $file.FullName -Raw
    
    # Check for YAML frontmatter delimiters
    if ($rawContent -notmatch "(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$") {
        Write-Error "[$($file.Name)] Missing or malformed YAML frontmatter delimiters (---)."
        $errorsFound++
        continue
    }

    $frontmatter = $matches[1]
    $body = $matches[2]

    # Parse key YAML attributes
    $name = if ($frontmatter -match "name:\s*([a-zA-Z0-9_\-]+)") { $matches[1].Trim() } else { $null }
    $subagent = if ($frontmatter -match "subagent:\s*(true|false)") { $matches[1].Trim() } else { $null }
    $description = if ($frontmatter -match "description:\s*(.+)") { $matches[1].Trim() } else { $null }

    if (-not $name) {
        Write-Host "    [$($file.Name)] ERROR: Missing 'name' in frontmatter" -ForegroundColor Red
        $errorsFound++
    }
    if ($subagent -ne "true") {
        Write-Host "    [$($file.Name)] ERROR: 'subagent: true' missing or invalid in frontmatter" -ForegroundColor Red
        $errorsFound++
    }
    if (-not $description) {
        Write-Host "    [$($file.Name)] ERROR: Missing 'description' in frontmatter" -ForegroundColor Red
        $errorsFound++
    }

    if ($body.Trim().Length -lt 50) {
        Write-Host "    [$($file.Name)] WARNING: System prompt body is unusually short ($($body.Length) chars)" -ForegroundColor Yellow
    }

    $foundAgents += $name
    Write-Host "    [OK] Agent '$name' ($($file.Name)) - subagent: $subagent" -ForegroundColor Green
}

# Check for missing agents against expected list
foreach ($exp in $expectedAgents) {
    if (-not ($foundAgents -contains $exp)) {
        Write-Host "    Missing expected agent: '$exp'" -ForegroundColor Red
        $errorsFound++
    }
}

if ($errorsFound -gt 0) {
    Write-Error "Agent validation failed with $errorsFound error(s)."
    exit 1
}

Write-Host "==> All $($foundAgents.Count) custom subagents passed syntax & frontmatter validation." -ForegroundColor Green
