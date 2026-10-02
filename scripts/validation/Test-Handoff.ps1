<#
.SYNOPSIS
    Validates an agent handoff manifest JSON for correctness and AGENTS.md compliance.
.PARAMETER Path
    Path to the handoff JSON file.
.EXAMPLE
    .\scripts\validation\Test-Handoff.ps1 -Path "docs/handoffs/templates/handoff-template.json"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Path)) {
    Write-Error "Handoff file not found at: $Path"
    exit 1
}

Write-Host "==> Validating Handoff Manifest: $Path" -ForegroundColor Cyan

try {
    $content = Get-Content $Path -Raw | ConvertFrom-Json
} catch {
    Write-Error "Invalid JSON syntax: $_"
    exit 1
}

$requiredFields = @("task_id", "epic", "agent", "branch", "status", "changes", "verification")
foreach ($field in $requiredFields) {
    if (-not ($content.PSObject.Properties.Name -contains $field)) {
        Write-Error "Missing mandatory field: '$field'"
        exit 1
    }
}

# Validate Verification structure
$v = $content.verification
if (-not $v) {
    Write-Error "Verification block is empty!"
    exit 1
}

Write-Host "    Task ID:      $($content.task_id)"
Write-Host "    Agent:        $($content.agent)"
Write-Host "    Status:       $($content.status)"
Write-Host "    Tests Run:    $($v.unit_tests_run)"
Write-Host "    Tests Passed: $($v.unit_tests_passed)"

if ($content.status -eq "READY_FOR_REVIEW") {
    if (-not $v.test_command) {
        Write-Error "Rule 10 Violation: 'test_command' must be specified for READY_FOR_REVIEW status."
        exit 1
    }
}

Write-Host "==> Handoff Manifest passed validation." -ForegroundColor Green
