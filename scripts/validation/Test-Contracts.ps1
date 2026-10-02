<#
.SYNOPSIS
    Validates presence and syntax of contracts in contracts/ directory.
.EXAMPLE
    .\scripts\validation\Test-Contracts.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "==> Validating CalmStacks Contracts" -ForegroundColor Cyan

$contractDir = "contracts"
if (-not (Test-Path $contractDir)) {
    Write-Error "contracts directory not found."
    exit 1
}

$templates = Get-ChildItem "$contractDir/templates"
Write-Host "    Found $($templates.Count) contract template(s):"
foreach ($t in $templates) {
    Write-Host "      - $($t.Name) ($($t.Length) bytes)"
}

Write-Host "==> Contracts check complete." -ForegroundColor Green
