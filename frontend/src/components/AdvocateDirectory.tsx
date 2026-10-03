import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  AdvocateProfileRecord,
  AIIntakeSummaryRecord,
  CaseWorkspaceRecord,
} from '../types';
import { AdvocateBookingModal } from './AdvocateBookingModal';

interface AdvocateDirectoryProps {
  intakeSummary: AIIntakeSummaryRecord | null;
  onNavigateToWorkspace: (workspaceId: string) => void;
}

export const AdvocateDirectory: React.FC<AdvocateDirectoryProps> = ({
  intakeSummary,
  onNavigateToWorkspace,
}) => {
  const [advocates, setAdvocates] = useState<AdvocateProfileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>(
    intakeSummary?.suggested_practice_areas?.[0] || 'All'
  );
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedCourt, setSelectedCourt] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [maxFee, setMaxFee] = useState<number>(3000);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Booking Modal State
  const [selectedAdvocateForBooking, setSelectedAdvocateForBooking] =
    useState<AdvocateProfileRecord | null>(null);

  // Available options
  const practiceAreaOptions = [
    'All',
    'Property & Real Estate',
    'Cheque Bounce (Sec 138)',
    'Family & Matrimonial',
    'Corporate & Commercial',
    'Civil Litigation',
    'Consumer Protection',
    'Labour & Employment',
    'Criminal Defense',
  ];

  const cityOptions = ['All', 'Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Lucknow'];
  const courtOptions = [
    'All',
    'Supreme Court of India',
    'Delhi High Court',
    'Bombay High Court',
    'High Court of Karnataka',
    'Calcutta High Court',
    'Tis Hazari District Court',
    'City Civil Court Bengaluru',
    'NCLT Mumbai Bench',
  ];
  const languageOptions = ['All', 'English', 'Hindi', 'Kannada', 'Marathi', 'Bengali', 'Tamil', 'Punjabi'];

  useEffect(() => {
    async function fetchAdvocates() {
      setLoading(true);
      try {
        const list = await api.listAdvocates({
          practice_area: selectedPracticeArea,
          city: selectedCity,
          court: selectedCourt,
          language: selectedLanguage,
          fee: maxFee,
          search: searchQuery,
        });
        setAdvocates(list);
      } catch (err) {
        console.error('Error listing advocates', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdvocates();
  }, [selectedPracticeArea, selectedCity, selectedCourt, selectedLanguage, maxFee, searchQuery]);

  const handleClearFilters = () => {
    setSelectedPracticeArea('All');
    setSelectedCity('All');
    setSelectedCourt('All');
    setSelectedLanguage('All');
    setMaxFee(3000);
    setSearchQuery('');
  };

  const handleBookingCompleted = (ws: CaseWorkspaceRecord) => {
    setSelectedAdvocateForBooking(null);
    onNavigateToWorkspace(ws.id);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Title & BCI Compliance Banner */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                BCI Rule 36 Certified Directory
              </span>
              <span className="text-xs text-slate-400">Non-promotional • Unranked Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white mt-1.5">
              Verified Legal Practitioner Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              In strict accordance with the Bar Council of India Rules, all advocates are verified against State Bar rolls and displayed with factual, objective credentials. No sponsored listings or subjective ratings are permitted.
            </p>
          </div>

          {/* Quick intake indicator if active */}
          {intakeSummary && (
            <div className="bg-slate-900 border border-amber-500/40 p-3 rounded-lg text-xs max-w-sm">
              <div className="text-amber-400 font-bold mb-0.5 flex items-center space-x-1">
                <span>📁 Active Intake Attached:</span>
              </div>
              <p className="text-slate-300 line-clamp-1">{intakeSummary.facts_summary}</p>
              <div className="text-[11px] text-amber-300/80 mt-1">
                Filter pre-set to: <span className="font-semibold">{selectedPracticeArea}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 shadow-lg">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <label htmlFor="search-advocates" className="sr-only">Search Advocates</label>
            <input
              id="search-advocates"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by advocate name, city, practice area (e.g. cheque bounce, tenancy, corporate)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <svg
              className="w-5 h-5 text-slate-500 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Multi-parameter Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Practice Area */}
          <div>
            <label htmlFor="practice-domain" className="block text-slate-400 font-semibold mb-1">Practice Domain</label>
            <select
              id="practice-domain"
              value={selectedPracticeArea}
              onChange={(e) => setSelectedPracticeArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {practiceAreaOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label htmlFor="city-region" className="block text-slate-400 font-semibold mb-1">City / Region</label>
            <select
              id="city-region"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {cityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Court Jurisdiction */}
          <div>
            <label htmlFor="admitted-court" className="block text-slate-400 font-semibold mb-1">Admitted Court / Forum</label>
            <select
              id="admitted-court"
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {courtOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language" className="block text-slate-400 font-semibold mb-1">Language</label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {languageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Range */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="max-fee" className="text-slate-400 font-semibold">Max Fee: ₹{maxFee}</label>
            </div>
            <input
              id="max-fee"
              type="range"
              min="500"
              max="4000"
              step="100"
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>
        </div>

        {/* Clear Filters Helper */}
        <div className="mt-3 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/80 pt-2">
          <span>
            Found <strong className="text-amber-400 font-mono">{advocates.length}</strong> verified practitioners
          </span>
          <button
            onClick={handleClearFilters}
            className="text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Directory Listings */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">Querying verified advocate records...</p>
        </div>
      ) : advocates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <div className="text-3xl mb-2">⚖️</div>
          <h3 className="text-lg font-bold text-white font-serif">No Verified Advocates Match Criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Try adjusting your practice area, city, or fee filters to discover more legal practitioners.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {advocates.map((adv) => (
            <div
              key={adv.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Name, Bar Enrollment, Verification badge */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif">{adv.full_name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {adv.bar_council_enrollment}
                      </span>
                      <span className="text-xs text-slate-400">{adv.state_bar_council}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                    <svg className="w-3 h-3 mr-1 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                </div>

                {/* Standing & Location */}
                <div className="flex items-center space-x-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-300">Standing:</span> {adv.experience_years} Years
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">Location:</span> {adv.city}, {adv.state}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">Fee:</span>{' '}
                    <span className="text-amber-400 font-mono font-bold">₹{adv.consultation_fee}</span>
                  </div>
                </div>

                {/* Practice Areas */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Practice Areas:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {adv.practice_areas.map((pa, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
                      >
                        {pa}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Admitted Courts */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Admitted Forums & Courts:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {adv.courts.map((court, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[11px] border border-slate-800"
                      >
                        ⚖️ {court}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bio snippet */}
                {adv.bio && (
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed italic">
                    "{adv.bio}"
                  </p>
                )}

                {/* Languages */}
                <div className="mt-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Languages:</span>{' '}
                  {adv.languages.join(', ')}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Fixed 45-min consultation</span>
                <button
                  type="button"
                  onClick={() => setSelectedAdvocateForBooking(adv)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Book Consultation Slot</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedAdvocateForBooking && (
        <AdvocateBookingModal
          advocate={selectedAdvocateForBooking}
          intakeSummary={intakeSummary}
          onClose={() => setSelectedAdvocateForBooking(null)}
          onBookingSuccess={handleBookingCompleted}
        />
      )}
    </div>
  );
};
