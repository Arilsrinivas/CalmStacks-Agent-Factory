import React, { useState } from 'react';
import { api } from '../api/client';
import { AIIntakeSummaryRecord } from '../types';
import { DisclaimerBanner } from './DisclaimerBanner';

interface CaseIntakeWizardProps {
  onIntakeCompleted: (summary: AIIntakeSummaryRecord) => void;
}

export const CaseIntakeWizard: React.FC<CaseIntakeWizardProps> = ({ onIntakeCompleted }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawText, setRawText] = useState('');
  const [language, setLanguage] = useState('English');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<AIIntakeSummaryRecord | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Quick preset narrative examples for Indian litigants
  const sampleScenarios = [
    {
      title: 'Tenancy Deposit Dispute (Indiranagar, BLR)',
      text: 'My landlord in Indiranagar, Bengaluru is refusing to return my refundable security deposit of Rs 80,000 even though I vacated on 31st August 2026 after completing 11 months lease. He is not answering my calls for the last 15 days.',
    },
    {
      title: 'Cheque Bounce / Sec 138 (Delhi)',
      text: 'A business client issued a cheque of Rs 3,50,000 towards pending invoices for IT hardware supply in Delhi on 10th September 2026. The cheque was dishonoured by SBI with memo "Funds Insufficient". I want to issue statutory 15-day legal notice under Section 138 of Negotiable Instruments Act.',
    },
    {
      title: 'Consumer Deficiency / Defective Goods',
      text: 'I purchased a high-end laptop for Rs 95,000 from an online vendor. The screen stopped working within 3 weeks. The authorised service centre refused warranty repair citing non-existent physical damage. The seller is refusing replacement or refund.',
    },
  ];

  const handleProcessNarrative = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rawText.trim()) return;

    setIsProcessing(true);
    try {
      const result = await api.submitCaseIntake(rawText, language);
      setSummary(result);
      setStep(2);
    } catch (err) {
      console.error('Error structuring narrative:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndProceed = () => {
    if (!summary || !disclaimerAccepted) return;
    const finalSummary = { ...summary, disclaimer_accepted: true };
    onIntakeCompleted(finalSummary);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Wizard Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              1
            </span>
            <span className={`text-sm font-semibold ${step >= 1 ? 'text-white' : 'text-slate-400'}`}>
              Describe Incident
            </span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-amber-600' : 'bg-slate-700'}`} />
          <div className="flex items-center space-x-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              2
            </span>
            <span className={`text-sm font-semibold ${step >= 2 ? 'text-white' : 'text-slate-400'}`}>
              AI Factual Review
            </span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-amber-600' : 'bg-slate-700'}`} />
          <div className="flex items-center space-x-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 3 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              3
            </span>
            <span className={`text-sm font-semibold ${step === 3 ? 'text-white' : 'text-slate-400'}`}>
              Find Advocates
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Plain-Language Narrative Ingestion */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Citizen & MSME Legal Gateway
              </span>
              <span className="text-xs text-slate-400">Plain Language Intake</span>
            </div>
            <h1 className="text-2xl font-bold text-white font-serif mt-2">
              Tell us what happened in your own words
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              You do not need legal jargon, sections, or citations. Describe the events, dates, and what outcome you seek. Our specialized AI Case Assistant will organize your statements into a structured case dossier.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-6 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1">
              <span>⚡ Try an example dispute narrative:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleScenarios.map((scen, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText(scen.text)}
                  className="text-left text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 p-2.5 rounded text-slate-300 transition-colors"
                >
                  <div className="font-semibold text-amber-400 truncate">{scen.title}</div>
                  <div className="text-slate-400 line-clamp-2 mt-1">{scen.text}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleProcessNarrative} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-slate-200">
                  Your Problem Description <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <label htmlFor="language-select" className="text-xs text-slate-400">Language:</label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="Hinglish">Hinglish / Romanized</option>
                  </select>
                </div>
              </div>
              <label htmlFor="narrative-textarea" className="sr-only">Dispute Narrative</label>
              <textarea
                id="narrative-textarea"
                rows={6}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Explain the background: What happened? Who is the opposing party (individual, landlord, employer, vendor)? When did this occur? What resolution or refund are you demanding?"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Guiding points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div>
                <span className="font-semibold text-slate-300 block">1. The Dispute</span>
                State the core grievance, breached promise, or financial loss.
              </div>
              <div>
                <span className="font-semibold text-slate-300 block">2. The Parties</span>
                Name the company, landlord, or counterparty involved.
              </div>
              <div>
                <span className="font-semibold text-slate-300 block">3. The Remedy</span>
                Specify if you seek a money refund, legal notice, or court defense.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isProcessing || !rawText.trim()}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-bold shadow-lg transition-all ${
                  isProcessing || !rawText.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-amber-900/30'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Synthesizing Legal Facts...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Structured Case Dossier</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: AI Structured Summary & Statutory Legal Disclaimer */}
      {step === 2 && summary && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Automated Intake Synthesis
                </span>
                <h2 className="text-2xl font-serif font-bold text-white mt-1">
                  Structured Case Summary for Advocate Review
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-amber-400 underline mt-2 sm:mt-0"
              >
                ← Edit Original Narrative
              </button>
            </div>

            {/* MANDATORY STATUTORY DISCLAIMER (TOP BANNER) */}
            <DisclaimerBanner />

            {/* Structured Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              {/* Core Facts */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>1. Statement of Core Facts</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {summary.facts_summary}
                </p>
              </div>

              {/* Parties Involved */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>2. Parties & Disputed Relationship</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 font-medium">Your Role:</span>{' '}
                    <span className="font-semibold text-white">{summary.parties_involved.client_role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Opposing Party:</span>{' '}
                    <span className="font-semibold text-rose-300">{summary.parties_involved.opposing_party}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Dispute Nature:</span>{' '}
                    <span className="font-semibold text-amber-300">{summary.parties_involved.dispute_nature}</span>
                  </div>
                </div>
              </div>

              {/* Key Relief Sought */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span>3. Key Relief / Outcome Sought</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {summary.key_relief_sought}
                </p>
              </div>

              {/* Suggested Practice Areas & Forums */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>4. Recommended Practice Taxonomy</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {summary.suggested_practice_areas.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  These categories will pre-filter the verified Advocate Directory to match practitioners admitted to the appropriate forum.
                </p>
              </div>
            </div>

            {/* Missing Critical Information Check (PRD Section 4.3.1) */}
            {summary.missing_information && summary.missing_information.length > 0 && (
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-2">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Advisory Checklist: Documents to Prepare Before Consultation</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {summary.missing_information.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* MANDATORY STATUTORY DISCLAIMER WITH CHECKBOX */}
            <DisclaimerBanner
              accepted={disclaimerAccepted}
              onAccept={() => setDisclaimerAccepted(!disclaimerAccepted)}
              showCheckbox={true}
            />

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-colors"
              >
                ← Back & Edit Problem
              </button>

              <button
                type="button"
                disabled={!disclaimerAccepted}
                onClick={handleConfirmAndProceed}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  disclaimerAccepted
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-amber-900/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Confirm & Search Verified Advocates</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
