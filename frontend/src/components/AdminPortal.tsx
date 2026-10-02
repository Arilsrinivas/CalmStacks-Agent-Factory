import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AdvocateProfileRecord, AdminAnalyticsData } from '../types';

export const AdminPortal: React.FC = () => {
  const [pendingAdvocates, setPendingAdvocates] = useState<AdvocateProfileRecord[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const pending = await api.getPendingAdvocates();
      setPendingAdvocates(pending);

      const stats = await api.getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await api.verifyAdvocate(id, status);
      setActionMessage(
        status === 'verified'
          ? `✓ Advocate credentials successfully verified and activated in public BCI directory.`
          : `✗ Application rejected and notification issued to applicant.`
      );
      setTimeout(() => setActionMessage(null), 4000);
      await loadAdminData();
    } catch (err) {
      console.error('Verification error', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Admin Title & Compliance Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                Compliance & Verification Authority
              </span>
              <span className="text-xs text-slate-400">
                Bar Council of India Rule 36 Oversight
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-white mt-1">
              State Bar Enrollment Verification & Platform Metrics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Audit applicant Bar Council certificates, maintain statutory non-promotional standards, and review system throughput.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Platform Audit Status</span>
            <span className="text-xs font-bold text-emerald-400">100% Non-Solicitation Compliant</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950 border border-emerald-800 text-xs text-emerald-200 font-semibold animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Platform Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow">
            <span className="text-slate-400 text-[11px] font-semibold block uppercase">Registered Users</span>
            <span className="text-2xl font-bold text-white font-mono mt-1 block">
              {analytics.total_registered_users}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow">
            <span className="text-slate-400 text-[11px] font-semibold block uppercase">Verified Advocates</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
              {analytics.total_verified_advocates}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow">
            <span className="text-slate-400 text-[11px] font-semibold block uppercase">Pending Audits</span>
            <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">
              {analytics.pending_verifications_count}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow">
            <span className="text-slate-400 text-[11px] font-semibold block uppercase">Case Intakes</span>
            <span className="text-2xl font-bold text-blue-400 font-mono mt-1 block">
              {analytics.total_intakes_submitted}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow">
            <span className="text-slate-400 text-[11px] font-semibold block uppercase">Bookings</span>
            <span className="text-2xl font-bold text-purple-400 font-mono mt-1 block">
              {analytics.total_consultations_booked}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow">
            <span className="text-slate-400 text-[11px] font-semibold block uppercase">Active Workspaces</span>
            <span className="text-2xl font-bold text-amber-500 font-mono mt-1 block">
              {analytics.active_workspaces_count}
            </span>
          </div>
        </div>
      )}

      {/* Advocate Verification Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Pending Advocate Verification Queue ({pendingAdvocates.length})
            </h2>
            <p className="text-xs text-slate-400">
              BCI Rule 36 requires strict verification against State Bar Rolls before public listing.
            </p>
          </div>
          <span className="text-xs text-amber-400 font-semibold bg-amber-950/60 px-2 py-1 rounded border border-amber-800/40">
            Target SLA: 24 Hours
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Loading verification requests...</p>
          </div>
        ) : pendingAdvocates.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <div className="text-3xl mb-2 text-emerald-400">✓</div>
            <h3 className="text-sm font-bold text-emerald-400 font-serif">Queue is Clear</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              All advocate credentials have been reviewed and processed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAdvocates.map((adv) => (
              <div
                key={adv.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white font-serif">{adv.full_name}</h3>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                      {adv.bar_council_enrollment}
                    </span>
                    <span className="text-xs text-slate-400">{adv.state_bar_council}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-300 font-medium">Standing:</span> {adv.experience_years} Years
                    </div>
                    <div>
                      <span className="text-slate-300 font-medium">Location:</span> {adv.city}, {adv.state}
                    </div>
                    <div>
                      <span className="text-slate-300 font-medium">Fee:</span> ₹{adv.consultation_fee}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Admitted Courts:</span>{' '}
                    {adv.courts.join(', ')}
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Practice Areas:</span>{' '}
                    {adv.practice_areas.join(', ')}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleVerify(adv.id, 'verified')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
                  >
                    ✓ Approve & Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(adv.id, 'rejected')}
                    className="px-3 py-2 bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practice Area Distribution Breakdown */}
      {analytics && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2">
            Practice Area Demand Distribution
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Aggregated procedural metrics without advocate competitive ranking or bidding.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(analytics.practice_area_breakdown).map(([area, count]) => (
              <div
                key={area}
                className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center"
              >
                <span className="text-slate-300">{area}</span>
                <span className="font-mono font-bold text-amber-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
