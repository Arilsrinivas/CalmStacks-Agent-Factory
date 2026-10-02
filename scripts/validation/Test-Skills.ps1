<#
.SYNOPSIS
    Validates CalmStacks workspace skills for directory structure, SKILL.md existence,
    YAML frontmatter, unique names, descriptions, and structural validity.
.EXAMPLE
    .\scripts\validation\Test-Skills.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "==> CalmStacks Agent Factory: Validating Workspace Skills" -ForegroundColor Cyan

$skillsRoot = ".agents/skills"
if (-not (Test-Path $skillsRoot)) {
    Write-Error "Skills root directory not found at: $skillsRoot"
    exit 1
}

$expectedSkills = @("project-planning", "implementation", "iteration", "code-review")
$foundNames = @()
$errorsCount = 0

foreach ($expected in $expectedSkills) {
    $dirPath = Join-Path $skillsRoot $expected
    $skillFile = Join-Path $dirPath "SKILL.md"

    # Check 1: Directory exists
    if (-not (Test-Path $dirPath -PathType Container)) {
        Write-Host "    [FAIL] Missing skill directory: $dirPath" -ForegroundColor Red
        $errorsCount++
        continue
    }

    # Check 2: SKILL.md exists
    if (-not (Test-Path $skillFile -PathType Leaf)) {
        Write-Host "    [FAIL] Missing SKILL.md in: $dirPath" -ForegroundColor Red
        $errorsCount++
        continue
    }

    $rawContent = Get-Content $skillFile -Raw

    # Check 3: YAML frontmatter delimiters
    if ($rawContent -notmatch "(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$") {
        Write-Host "    [FAIL] [$expected/SKILL.md] Missing or malformed YAML frontmatter (--- delimiters)" -ForegroundColor Red
        $errorsCount++
        continue
    }

    $frontmatter = $matches[1]
    $body = $matches[2]

    # Check 4: 'name' field
    $name = if ($frontmatter -match "name:\s*([a-zA-Z0-9_\-]+)") { $matches[1].Trim() } else { $null }
    if (-not $name) {
        Write-Host "    [FAIL] [$expected/SKILL.md] Missing 'name' in frontmatter" -ForegroundColor Red
        $errorsCount++
    } elseif ($name -ne $expected) {
        Write-Host "    [FAIL] [$expected/SKILL.md] Skill name '$name' does not match directory '$expected'" -ForegroundColor Red
        $errorsCount++
    }

    # Check 5: Name uniqueness
    if ($foundNames -contains $name) {
        Write-Host "    [FAIL] [$expected/SKILL.md] Duplicate skill name detected: '$name'" -ForegroundColor Red
        $errorsCount++
    } else {
        $foundNames += $name
    }

    # Check 6: 'description' field
    $description = if ($frontmatter -match "description:\s*(.+)") { $matches[1].Trim() } else { $null }
    if (-not $description) {
        Write-Host "    [FAIL] [$expected/SKILL.md] Missing 'description' in frontmatter" -ForegroundColor Red
        $errorsCount++
    } elseif ($description.Length -lt 20) {
        Write-Host "    [FAIL] [$expected/SKILL.md] Description is too short (<20 characters)" -ForegroundColor Red
        $errorsCount++
    }

    # Check 7: Body content exists
    if ($body.Trim().Length -lt 50) {
        Write-Host "    [FAIL] [$expected/SKILL.md] Skill body is too short (<50 characters)" -ForegroundColor Red
        $errorsCount++
    }

    if ($errorsCount -eq 0 -or (-not ($errorsCount -gt 0 -and $foundNames[-1] -eq $name))) {
        Write-Host "    [OK] Skill '$name' ($expected/SKILL.md)" -ForegroundColor Green
        Write-Host "         Description: $description" -ForegroundColor DarkGray
    }
}

Write-Host ""
if ($errorsCount -gt 0) {
    Write-Error "Skill validation failed with $errorsCount error(s)."
    exit 1
}

Write-Host "==> All $($expectedSkills.Count) workspace skills validated successfully." -ForegroundColor Green
