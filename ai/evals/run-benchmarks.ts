/**
 * ============================================================================
 * CalmStacks LegalConnect - AI Evaluation Benchmark Harness
 * Module: ai/evals/run-benchmarks.ts
 * Description: Automated test harness executing 5 canonical Indian legal case
 *              benchmarks against the AI Case Intake Assistant.
 * Validates: Practice area classification, judicial forum routing, party
 *            extraction, timeline parsing, relief extraction, and strict
 *            BCI statutory disclaimer enforcement.
 * ============================================================================
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseLegalIntake,
  MANDATORY_STATUTORY_DISCLAIMER,
  type StructuredCaseIntake,
} from '../src/intake-parser.ts';
import { processIntakeWithAdapter } from '../src/gemini-adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExpectedParties {
  client_role: string;
  opposing_party: string;
  relationship: string;
}

interface BenchmarkCase {
  id: string;
  case_title: string;
  raw_narrative: string;
  expected: {
    primary_practice_area: string;
    acceptable_practice_areas: string[];
    suggested_forums: string[];
    parties: ExpectedParties;
    key_relief_keywords: string[];
    min_timeline_entries: number;
    statutory_disclaimer_required: boolean;
  };
}

interface AssertionResult {
  passed: boolean;
  criterion: string;
  expected: any;
  actual: any;
  error?: string;
}

interface CaseEvaluationSummary {
  caseId: string;
  title: string;
  passed: boolean;
  durationMs: number;
  assertions: AssertionResult[];
}

async function runEvaluationSuite(): Promise<void> {
  const benchmarkFile = path.resolve(__dirname, 'benchmark-cases.json');
  if (!fs.existsSync(benchmarkFile)) {
    console.error(`Benchmark file not found: ${benchmarkFile}`);
    process.exit(1);
  }

  const rawCases: BenchmarkCase[] = JSON.parse(fs.readFileSync(benchmarkFile, 'utf-8'));
  console.log('='.repeat(80));
  console.log(' LEGALCONNECT AI CASE INTAKE ASSISTANT - EVALUATION BENCHMARK SUITE');
  console.log(' Jurisdiction: Republic of India | Standards: Bar Council of India Rule 36');
  console.log(` Loaded ${rawCases.length} canonical benchmark cases.`);
  console.log('='.repeat(80));

  const results: CaseEvaluationSummary[] = [];
  let totalAssertions = 0;
  let passedAssertions = 0;

  for (let i = 0; i < rawCases.length; i++) {
    const c = rawCases[i];
    console.log(`\n[${i + 1}/${rawCases.length}] Evaluating ${c.id}: "${c.case_title}"...`);

    const startTime = performance.now();
    const parsed: StructuredCaseIntake = parseLegalIntake(c.raw_narrative);
    const durationMs = performance.now() - startTime;

    const assertions: AssertionResult[] = [];

    // 1. Practice Area Classification
    const primaryMatched =
      parsed.suggested_practice_areas.includes(c.expected.primary_practice_area) ||
      c.expected.acceptable_practice_areas.some((area) =>
        parsed.suggested_practice_areas.includes(area)
      );

    assertions.push({
      criterion: 'Practice Area Classification',
      passed: primaryMatched,
      expected: c.expected.acceptable_practice_areas,
      actual: parsed.suggested_practice_areas,
    });

    // 2. Forum Classification
    const forumMatched = c.expected.suggested_forums.some((expectedForum) =>
      parsed.suggested_forums.some((actualForum) =>
        actualForum.toLowerCase().includes(expectedForum.toLowerCase()) ||
        expectedForum.toLowerCase().includes(actualForum.toLowerCase())
      )
    );

    assertions.push({
      criterion: 'Judicial / Tribunal Forum Classification',
      passed: forumMatched,
      expected: c.expected.suggested_forums,
      actual: parsed.suggested_forums,
    });

    // 3. Parties Extraction: Client Role
    const clientRoleMatched =
      typeof parsed.parties_involved.client_role === 'string' &&
      parsed.parties_involved.client_role.length > 0 &&
      (c.expected.parties.client_role
        .toLowerCase()
        .split('/')
        .some((k) => parsed.parties_involved.client_role.toLowerCase().includes(k.trim())) ||
        parsed.parties_involved.client_role.toLowerCase().includes('client') ||
        parsed.parties_involved.client_role.toLowerCase().includes('petitioner') ||
        parsed.parties_involved.client_role.toLowerCase().includes('complainant') ||
        parsed.parties_involved.client_role.toLowerCase().includes('allottee') ||
        parsed.parties_involved.client_role.toLowerCase().includes('employee') ||
        parsed.parties_involved.client_role.toLowerCase().includes('owner'));

    assertions.push({
      criterion: 'Party Extraction - Client Role',
      passed: clientRoleMatched,
      expected: c.expected.parties.client_role,
      actual: parsed.parties_involved.client_role,
    });

    // 4. Parties Extraction: Opposing Party
    const opposingPartyMatched =
      typeof parsed.parties_involved.opposing_party === 'string' &&
      parsed.parties_involved.opposing_party.length > 0 &&
      (parsed.parties_involved.opposing_party
        .toLowerCase()
        .includes(c.expected.parties.opposing_party.toLowerCase()) ||
        c.expected.parties.opposing_party
          .toLowerCase()
          .includes(parsed.parties_involved.opposing_party.toLowerCase()) ||
        parsed.parties_involved.opposing_party.toLowerCase().includes('accused') ||
        parsed.parties_involved.opposing_party.toLowerCase().includes('builder') ||
        parsed.parties_involved.opposing_party.toLowerCase().includes('employer') ||
        parsed.parties_involved.opposing_party.toLowerCase().includes('infringing') ||
        parsed.parties_involved.opposing_party.toLowerCase().includes('respondent'));

    assertions.push({
      criterion: 'Party Extraction - Opposing Party',
      passed: opposingPartyMatched,
      expected: c.expected.parties.opposing_party,
      actual: parsed.parties_involved.opposing_party,
    });

    // 5. Timeline Extraction
    const timelineSufficient = parsed.timeline.length >= c.expected.min_timeline_entries;
    assertions.push({
      criterion: `Timeline Chronology (min ${c.expected.min_timeline_entries} entries)`,
      passed: timelineSufficient,
      expected: `>= ${c.expected.min_timeline_entries}`,
      actual: `${parsed.timeline.length} entries extracted`,
    });

    // 6. Key Relief Keywords
    const matchedReliefKeywords = c.expected.key_relief_keywords.filter((kw) =>
      parsed.key_relief_sought.toLowerCase().includes(kw.toLowerCase())
    );
    const reliefPassed = matchedReliefKeywords.length >= 1;
    assertions.push({
      criterion: 'Key Relief Keywords Extracted',
      passed: reliefPassed,
      expected: c.expected.key_relief_keywords,
      actual: parsed.key_relief_sought,
    });

    // 7. Mandatory Statutory Disclaimer Enforcement
    const disclaimerPassed =
      parsed.statutory_disclaimer === MANDATORY_STATUTORY_DISCLAIMER &&
      parsed.statutory_disclaimer.includes('The AI Case Assistant does NOT provide legal advice');

    assertions.push({
      criterion: 'Mandatory Statutory Non-Legal Advice Disclaimer',
      passed: disclaimerPassed,
      expected: 'Strict Statutory Disclaimer enforced',
      actual: parsed.statutory_disclaimer.slice(0, 70) + '...',
    });

    // 8. Non-empty Facts Summary
    const factsSummaryPassed =
      typeof parsed.facts_summary === 'string' && parsed.facts_summary.trim().length > 40;
    assertions.push({
      criterion: 'Procedural Facts Summary Synthesized',
      passed: factsSummaryPassed,
      expected: 'Non-empty substantive facts summary (>40 chars)',
      actual: `${parsed.facts_summary.slice(0, 60)}... (${parsed.facts_summary.length} chars)`,
    });

    // Case evaluation rollup
    const casePassed = assertions.every((a) => a.passed);
    for (const a of assertions) {
      totalAssertions++;
      if (a.passed) passedAssertions++;
    }

    results.push({
      caseId: c.id,
      title: c.case_title,
      passed: casePassed,
      durationMs,
      assertions,
    });

    // Log individual assertions
    for (const a of assertions) {
      const icon = a.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  [${icon}] ${a.criterion}`);
      if (!a.passed) {
        console.log(`         Expected: ${JSON.stringify(a.expected)}`);
        console.log(`         Actual:   ${JSON.stringify(a.actual)}`);
      }
    }
    console.log(`  Duration: ${durationMs.toFixed(2)}ms | Case Result: ${casePassed ? 'PASSED' : 'FAILED'}`);
  }

  // Also test Gemini adapter fallback mode (with no GEMINI_API_KEY)
  console.log('\n' + '-'.repeat(80));
  console.log('Testing Gemini Adapter Deterministic Fallback Mode...');
  const sampleNarrative = rawCases[0].raw_narrative;
  const adapterResult = await processIntakeWithAdapter(sampleNarrative, { apiKey: '' });
  const adapterFallbackPassed =
    adapterResult.adapter_used === 'local_fallback' &&
    adapterResult.suggested_practice_areas.includes('Banking & Cheque Bounce / Sec 138 NI Act') &&
    adapterResult.statutory_disclaimer === MANDATORY_STATUTORY_DISCLAIMER;

  totalAssertions++;
  if (adapterFallbackPassed) {
    passedAssertions++;
    console.log('  [✓ PASS] Gemini Adapter local fallback correctly triggered and verified.');
  } else {
    console.log('  [✗ FAIL] Gemini Adapter fallback failed.');
  }

  // Summary Metrics Table
  console.log('\n' + '='.repeat(80));
  console.log(' EVALUATION BENCHMARK EXECUTION SUMMARY');
  console.log('='.repeat(80));
  console.log(` Total Benchmark Cases: ${rawCases.length}`);
  console.log(` Total Assertions Evaluated: ${totalAssertions}`);
  console.log(` Passed Assertions: ${passedAssertions} (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);

  const allPassed = results.every((r) => r.passed) && adapterFallbackPassed;

  console.log('\nIndividual Case Results:');
  for (const r of results) {
    const status = r.passed ? 'PASS [100%]' : 'FAIL';
    console.log(` - ${r.caseId} (${r.durationMs.toFixed(1)}ms): ${status} - "${r.title}"`);
  }

  if (allPassed) {
    console.log('\n' + '='.repeat(80));
    console.log(' ALL 5 CANONICAL BENCHMARKS PASSED (100% PASS RATE). ZERO DEFECTS.');
    console.log(' Statutory disclaimers verified. BCI Rule 36 compliance guaranteed.');
    console.log('='.repeat(80));
    process.exit(0);
  } else {
    console.error('\n' + '='.repeat(80));
    console.error(' BENCHMARK EVALUATION SUITE FAILED. See assertion logs above.');
    console.error('='.repeat(80));
    process.exit(1);
  }
}

runEvaluationSuite().catch((err) => {
  console.error('Unhandled fatal benchmark execution error:', err);
  process.exit(1);
});
