import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ConsultationRecord, CaseWorkspaceRecord } from '../types';
import { useAuth } from '../context/AuthContext';

interface AdvocateDashboardProps {
  onNavigateToWorkspace: (workspaceId: string) => void;
}

export const AdvocateDashboard: React.FC<AdvocateDashboardProps> = ({
  onNavigateToWorkspace,
}) => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<CaseWorkspaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const cons = await api.listConsultations();
      setConsultations(cons);

      const ws = await api.listWorkspaces();
      setWorkspaces(ws);
    } catch (err) {
      console.error('Error fetching advocate data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: 'confirmed' | 'reschedule_offered' | 'declined' | 'completed',
    notes?: string
  ) => {
    try {
      await api.updateConsultationStatus(id, status, notes);
      setReschedulingId(null);
      setRescheduleNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const findWorkspaceIdForConsultation = (consId: string) => {
    const ws = workspaces.find((w) => w.consultation_id === consId);
    return ws ? ws.id : null;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Advocate Practitioner Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                Practitioner Chambers Portal
              </span>
              <span className="text-xs text-emerald-400 font-medium flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 inline-block"></span>
                Active Bar Council Standing
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-white mt-1">
              Advocate Consultation Management & Case Docket
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Logged in as: <strong className="text-white">{user?.full_name || 'Adv. Rajesh Kumar'}</strong> (Bar Council of Delhi • D/1842/2012)
            </p>
          </div>

          <div className="flex space-x-3 text-center">
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Pending Requests</span>
              <span className="text-xl font-bold text-amber-400 font-mono">
                {consultations.filter((c) => c.status === 'requested').length}
              </span>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Confirmed Sessions</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {consultations.filter((c) => c.status === 'confirmed').length}
              </span>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Active Workspaces</span>
              <span className="text-xl font-bold text-blue-400 font-mono">
                {workspaces.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Consultations Requests Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Consultation Intake Queue ({consultations.length})
          </h2>
          <span className="text-xs text-slate-400">
            Accept, reschedule, or review attached AI case dossiers
          </span>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 py-8 text-center">Loading consultation requests...</div>
        ) : consultations.length === 0 ? (
          <div className="text-xs text-slate-400 py-8 text-center bg-slate-950 rounded-lg">
            No incoming consultation requests at this time.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {consultations.map((c) => {
              const wsId = findWorkspaceIdForConsultation(c.id);
              const isReschedulingThis = reschedulingId === c.id;

              return (
                <div key={c.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {c.id.toUpperCase()}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          Client: {c.client_name || 'Citizen Litigant'}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                            c.status === 'confirmed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : c.status === 'requested'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Scheduled for:{' '}
                        <strong className="text-slate-200">
                          {new Date(c.scheduled_at).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          • {new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                        </strong>{' '}
                        ({c.mode.replace('_', ' ')} consultation)
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      {c.status === 'requested' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(c.id, 'confirmed')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold transition-colors"
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => setReschedulingId(c.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs font-semibold transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(c.id, 'declined')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded text-xs font-semibold transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {c.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(c.id, 'completed')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-semibold transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}

                      {wsId && (
                        <button
                          type="button"
                          onClick={() => onNavigateToWorkspace(wsId)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-xs font-bold transition-colors shadow"
                        >
                          Open Workspace →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes / Case Briefing */}
                  {c.notes && (
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-xs text-slate-300">
                      <span className="text-slate-400 font-semibold">Client Narrative Brief: </span>
                      {c.notes}
                    </div>
                  )}

                  {/* Reschedule Input Panel */}
                  {isReschedulingThis && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-amber-500/40 space-y-2 text-xs">
                      <div className="font-bold text-amber-400">Propose Alternative Consultation Time:</div>
                      <input
                        type="text"
                        value={rescheduleNotes}
                        onChange={(e) => setRescheduleNotes(e.target.value)}
                        placeholder="e.g. Please choose between Tomorrow at 15:00 IST or Friday at 17:00 IST due to High Court hearing."
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!rescheduleNotes.trim()}
                          onClick={() =>
                            handleUpdateStatus(c.id, 'reschedule_offered', rescheduleNotes)
                          }
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded"
                        >
                          Send Reschedule Proposal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Workspaces Directory for Advocate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">
          Privileged Case Docket Workspaces ({workspaces.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map((w) => (
            <div
              key={w.id}
              className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {w.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                    {w.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{w.title}</h4>
                {w.intake_summary && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {w.intake_summary.facts_summary}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {new Date(w.created_at).toLocaleDateString('en-IN')}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateToWorkspace(w.id)}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Enter Case Vault & Messages →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
