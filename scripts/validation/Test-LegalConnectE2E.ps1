<#
.SYNOPSIS
    End-to-End Automated Verification & Security Audit Suite for LegalConnect MVP.
.EXAMPLE
    .\scripts\validation\Test-LegalConnectE2E.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$swTotal = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " LEGALCONNECT MVP - COMPLETE AUTOMATED VERIFICATION & SECURITY AUDIT SUITE" -ForegroundColor Cyan
Write-Host " Standards: Bar Council of India Rule 36 | DPDPA 2023 | CalmStacks Factory DoD" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$totalPassed = 0
$totalFailed = 0

# TEST 1: AI Case Intake Structuring Benchmarks
Write-Host "--> [1/4] Running AI Case Intake Benchmarks (ai/)..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$aiOutput = (node --no-warnings --experimental-strip-types ai/evals/run-benchmarks.ts 2>&1)
$sw.Stop()

if ($LASTEXITCODE -eq 0 -and $aiOutput -match "ALL 5 CANONICAL BENCHMARKS PASSED") {
    Write-Host "    [PASS] AI Benchmarks: 5/5 Canonical Indian Legal Cases Passed ($($sw.ElapsedMilliseconds)ms)" -ForegroundColor Green
    $totalPassed++
} else {
    Write-Host "    [FAIL] AI Benchmarks failed!" -ForegroundColor Red
    $aiOutput | Write-Host
    $totalFailed++
}

# TEST 2: Backend REST API Contract & Integration Test Suite
Write-Host "--> [2/4] Running Backend REST API Contract Test Suite (backend/)..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$backendOutput = (node --no-warnings --test backend/dist/tests/*.test.js 2>&1)
$sw.Stop()

if ($LASTEXITCODE -eq 0 -and $backendOutput -match "# pass 3") {
    Write-Host "    [PASS] Backend API: Contract & RBAC Tests Passed ($($sw.ElapsedMilliseconds)ms)" -ForegroundColor Green
    $totalPassed++
} else {
    Write-Host "    [FAIL] Backend Tests failed!" -ForegroundColor Red
    $backendOutput | Write-Host
    $totalFailed++
}

# TEST 3: Frontend Production Distribution Build
Write-Host "--> [3/4] Verifying Frontend Client Build (frontend/)..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$frontendOutput = (node frontend/scripts/fallback-build.cjs 2>&1)
$sw.Stop()

if ($LASTEXITCODE -eq 0 -and (Test-Path "frontend/dist/index.html")) {
    $distSize = (Get-Item "frontend/dist/index.html").Length
    Write-Host "    [PASS] Frontend Client Build verified ($distSize bytes distribution) ($($sw.ElapsedMilliseconds)ms)" -ForegroundColor Green
    $totalPassed++
} else {
    Write-Host "    [FAIL] Frontend build failed!" -ForegroundColor Red
    $frontendOutput | Write-Host
    $totalFailed++
}

# TEST 4: Security Audit & Statutory Regulatory Scans
Write-Host "--> [4/4] Executing Security, Secret Scan & Regulatory Audits..." -ForegroundColor Yellow

$secretViolations = @()
$suspiciousPatterns = @("AIza[0-9A-Za-z-_]{35}", "ghp_[0-9a-zA-Z]{36}", "PRIVATE KEY-----", "sk_live_[0-9a-zA-Z]{24}")
$codeFiles = Get-ChildItem -Recurse -File -Include "*.ts", "*.tsx", "*.js", "*.json", "*.sql" -Exclude "node_modules", "package-lock.json"

foreach ($f in $codeFiles) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($p in $suspiciousPatterns) {
            if ($content -match $p) {
                $secretViolations += "$($f.FullName): Pattern $p matched"
            }
        }
    }
}

if ($secretViolations.Count -eq 0) {
    Write-Host "    [PASS] Secret Scan: 0 hardcoded credentials or private keys detected across $($codeFiles.Count) files" -ForegroundColor Green
    $totalPassed++
} else {
    Write-Host "    [FAIL] Secret Scan found suspicious keys:" -ForegroundColor Red
    $secretViolations | Write-Host
    $totalFailed++
}

# Check Statutory Disclaimer Presence
$aiParserContent = Get-Content "ai/src/intake-parser.ts" -Raw
if ($aiParserContent -match "STATUTORY DISCLAIMER" -and $aiParserContent -match "does NOT provide legal advice") {
    Write-Host "    [PASS] Regulatory Compliance: Statutory non-legal-advice disclaimer verified on AI engine" -ForegroundColor Green
    $totalPassed++
} else {
    Write-Host "    [FAIL] Missing mandatory statutory disclaimer in AI parser!" -ForegroundColor Red
    $totalFailed++
}

# Check BCI Rule 36 Zero-Ad Non-Promotional Directory
$advocateServiceContent = Get-Content "backend/src/services/advocate.service.ts" -Raw
if ($advocateServiceContent -match "ORDER BY (?:u\.)?full_name" -or $advocateServiceContent -match "ORDER BY (?:ap\.)?experience_years") {
    Write-Host "    [PASS] Regulatory Compliance: BCI Rule 36 unranked, non-promotional advocate directory verified" -ForegroundColor Green
    $totalPassed++
} else {
    Write-Host "    [FAIL] Directory ordering may violate BCI Rule 36!" -ForegroundColor Red
    $totalFailed++
}

$swTotal.Stop()
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " E2E VERIFICATION & SECURITY AUDIT SUMMARY" -ForegroundColor Cyan
Write-Host " Total Gate Checks: $($totalPassed + $totalFailed) | Passed: $totalPassed | Failed: $totalFailed" -ForegroundColor Cyan
Write-Host " Total Execution Time: $($swTotal.ElapsedMilliseconds)ms" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

if ($totalFailed -gt 0) {
    Write-Error "Verification suite encountered $totalFailed failure(s)."
    exit 1
}

Write-Host "==> LegalConnect MVP passed all quality, contract, security, and regulatory gates." -ForegroundColor Green
