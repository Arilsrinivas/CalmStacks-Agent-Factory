/**
 * ============================================================================
 * CalmStacks LegalConnect - AI Case Intake Assistant
 * Module: ai/src/gemini-adapter.ts
 * Description: Optional LLM adapter connecting to Google Gemini API when
 *              GEMINI_API_KEY is present in the environment, with guaranteed
 *              deterministic fallback to the local structured parser.
 * Compliance: Strictly injects statutory non-legal advice disclaimers and
 *             enforces procedural intake structuring without legal counsel.
 * ============================================================================
 */

import {
  parseLegalIntake,
  MANDATORY_STATUTORY_DISCLAIMER,
  type StructuredCaseIntake,
  type ParseOptions,
} from './intake-parser.ts';

export interface GeminiAdapterOptions extends ParseOptions {
  apiKey?: string;
  modelName?: string;
  timeoutMs?: number;
}

const DEFAULT_MODEL = 'gemini-1.5-flash';
const DEFAULT_TIMEOUT_MS = 8000;

const SYSTEM_INTAKE_PROMPT = `
You are the AI Case Intake Assistant for LegalConnect (India).
Your SOLE duty is to transform unstructured, conversational citizen dispute narratives into standardized, structured intake summaries for advocate review.

STRICT LEGAL & ETHICAL BOUNDARIES (Bar Council of India Rule 36 Compliance):
1. You are a procedural data normalizer. You do NOT provide legal advice, opinion, probability of winning, or strategy.
2. Extract ONLY factual assertions, named parties, chronological dates, and relief explicitly or implicitly requested.
3. Every response MUST strictly adhere to the JSON schema below.

JSON Schema:
{
  "facts_summary": "Concise factual synthesis of what happened without conversational filler",
  "parties_involved": {
    "client_role": "Role of complainant / client (e.g. Complainant, Tenant, Allottee, Employee, Petitioner)",
    "opposing_party": "Name or entity title of opposing party (e.g. Landlord, ABC Builders Pvt Ltd)",
    "relationship": "Nature of legal/factual relationship (e.g. Tenant-Landlord, Buyer-Builder)",
    "dispute_nature": "Brief categorization of dispute"
  },
  "timeline": [
    { "date_or_period": "Date or timeframe", "description": "What occurred" }
  ],
  "key_relief_sought": "Remedies sought (e.g. refund, damages, possession, injunction, arrears)",
  "suggested_practice_areas": ["Practice Area 1", "Practice Area 2"],
  "suggested_forums": ["Relevant Indian Court or Tribunal 1", "Forum 2"],
  "missing_essential_details": ["List of missing facts or documents"]
}
`;

/**
 * Checks whether Gemini API is configured in the environment.
 */
export function isGeminiAvailable(customApiKey?: string): boolean {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/**
 * Process case intake narrative using Gemini LLM if available, falling back
 * deterministically to the local rule-based entity extractor.
 */
export async function processIntakeWithAdapter(
  rawText: string,
  options: GeminiAdapterOptions = {}
): Promise<StructuredCaseIntake & { adapter_used: 'gemini' | 'local_fallback' }> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    // Deterministic local extraction fallback
    const localResult = parseLegalIntake(rawText, options);
    return {
      ...localResult,
      adapter_used: 'local_fallback',
    };
  }

  const model = options.modelName || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  try {
    const response = await callGeminiAPI(rawText, apiKey, model, timeoutMs);
    const parsedJson = JSON.parse(response);

    // Validate and sanitize Gemini JSON
    const structuredResult: StructuredCaseIntake = {
      facts_summary:
        typeof parsedJson.facts_summary === 'string' && parsedJson.facts_summary.trim().length > 0
          ? parsedJson.facts_summary.trim()
          : parseLegalIntake(rawText, options).facts_summary,
      parties_involved: {
        client_role: parsedJson.parties_involved?.client_role || 'Complainant / Aggrieved Party',
        opposing_party: parsedJson.parties_involved?.opposing_party || 'Opposite Party',
        relationship: parsedJson.parties_involved?.relationship || 'Disputing Parties',
        dispute_nature: parsedJson.parties_involved?.dispute_nature || 'Legal dispute',
      },
      timeline: Array.isArray(parsedJson.timeline)
        ? parsedJson.timeline.filter(
            (t: any) => t && typeof t.date_or_period === 'string' && typeof t.description === 'string'
          )
        : parseLegalIntake(rawText, options).timeline,
      key_relief_sought:
        typeof parsedJson.key_relief_sought === 'string' && parsedJson.key_relief_sought.trim().length > 0
          ? parsedJson.key_relief_sought.trim()
          : parseLegalIntake(rawText, options).key_relief_sought,
      suggested_practice_areas:
        Array.isArray(parsedJson.suggested_practice_areas) && parsedJson.suggested_practice_areas.length > 0
          ? parsedJson.suggested_practice_areas
          : parseLegalIntake(rawText, options).suggested_practice_areas,
      suggested_forums:
        Array.isArray(parsedJson.suggested_forums) && parsedJson.suggested_forums.length > 0
          ? parsedJson.suggested_forums
          : parseLegalIntake(rawText, options).suggested_forums,
      statutory_disclaimer: MANDATORY_STATUTORY_DISCLAIMER, // Always enforce mandatory statutory disclaimer
      missing_essential_details: Array.isArray(parsedJson.missing_essential_details)
        ? parsedJson.missing_essential_details
        : [],
      confidence_score: 0.95,
    };

    return {
      ...structuredResult,
      adapter_used: 'gemini',
    };
  } catch (_error) {
    // Graceful fallback to deterministic local extractor
    const fallbackResult = parseLegalIntake(rawText, options);
    return {
      ...fallbackResult,
      adapter_used: 'local_fallback',
    };
  }
}

/**
 * Invokes Google Gemini API via HTTPS REST with JSON response enforcement.
 */
async function callGeminiAPI(
  userText: string,
  apiKey: string,
  model: string,
  timeoutMs: number
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SYSTEM_INTAKE_PROMPT}\n\nClient Dispute Narrative:\n"""\n${userText}\n"""\n\nGenerate structured JSON intake summary:`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned HTTP status ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('No candidate content returned by Gemini API');
    }

    return candidateText;
  } finally {
    clearTimeout(timeoutId);
  }
}
