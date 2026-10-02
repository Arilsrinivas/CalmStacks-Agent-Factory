import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  AdvocateProfileRecord,
  ConsultationSlotRecord,
  AIIntakeSummaryRecord,
  ConsultationMode,
  CaseWorkspaceRecord,
} from '../types';
import { useAuth } from '../context/AuthContext';

interface AdvocateBookingModalProps {
  advocate: AdvocateProfileRecord;
  intakeSummary: AIIntakeSummaryRecord | null;
  onClose: () => void;
  onBookingSuccess: (workspace: CaseWorkspaceRecord) => void;
}

export const AdvocateBookingModal: React.FC<AdvocateBookingModalProps> = ({
  advocate,
  intakeSummary,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<ConsultationSlotRecord[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('video');
  const [notes, setNotes] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const available = await api.getAdvocateSlots(advocate.id);
        setSlots(available);
        if (available.length > 0) {
          setSelectedSlotId(available[0].id);
          setSelectedMode(available[0].mode);
        }
      } catch (err) {
        console.error('Failed to load slots', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [advocate.id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    const chosenSlot = slots.find((s) => s.id === selectedSlotId);
    if (!chosenSlot) return;

    setIsSubmitting(true);
    try {
      const clientName = user?.full_name || 'Citizen Litigant';
      const clientId = user?.id || 'user-client-1';

      const bookingBrief = notes.trim()
        ? notes
        : intakeSummary?.facts_summary
        ? `Intake attached: ${intakeSummary.facts_summary.slice(0, 150)}...`
        : 'Initial legal advice session regarding pending dispute.';

      const result = await api.bookConsultation({
        client_id: clientId,
        client_name: clientName,
        advocate_id: advocate.id,
        advocate_name: advocate.full_name || 'Enrolled Advocate',
        slot_id: chosenSlot.id,
        scheduled_at: chosenSlot.start_time,
        mode: selectedMode,
        notes: bookingBrief,
        intake_summary: intakeSummary || undefined,
      });

      onBookingSuccess(result.workspace);
    } catch (err) {
      console.error('Booking failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Advocate Brief Header */}
        <div className="border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif text-white">{advocate.full_name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                  <svg className="w-3 h-3 mr-1 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified BCI Standing
                </span>
              </div>
              <p className="text-xs text-amber-400 font-medium mt-1">
                {advocate.state_bar_council} • Enrolment: <span className="font-mono">{advocate.bar_council_enrollment}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Standing: {advocate.experience_years} Years Active Practice • Location: {advocate.city}, {advocate.state}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Consultation Fee</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">₹{advocate.consultation_fee}</span>
              <span className="text-[10px] text-slate-500 block">per 45-min session</span>
            </div>
          </div>
        </div>

        {/* Attached Case Intake Notice */}
        {intakeSummary && (
          <div className="mb-6 bg-slate-950 p-3.5 rounded-lg border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
              <span>Attached Case Dossier:</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-provisioned to Case Workspace</span>
            </div>
            <p className="text-slate-300 line-clamp-2">{intakeSummary.facts_summary}</p>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleBook} className="space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Consultation Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'video', label: 'Encrypted Video', icon: '📹' },
                  { id: 'audio', label: 'Secure Audio', icon: '📞' },
                  { id: 'in_person', label: 'Chamber Visit', icon: '⚖️' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedMode === mode.id
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-lg mb-1">{mode.icon}</div>
                  <div className="text-xs">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slot Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Available Appointment Slot
            </label>
            {loadingSlots ? (
              <div className="text-xs text-slate-400 py-4 text-center">Loading advocate calendar...</div>
            ) : slots.length === 0 ? (
              <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg text-center">
                No open slots available for this week. Please check another advocate.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const dateObj = new Date(slot.start_time);
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setSelectedMode(slot.mode);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold">
                        {dateObj.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-amber-400 font-mono mt-0.5">
                        {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize mt-1">
                        Default: {slot.mode.replace('_', ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Client Notes / Objectives */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Brief Note for Advocate (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Highlight any specific question or urgency regarding your dispute..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* BCI Statutory Notice */}
          <p className="text-[10px] text-slate-500 leading-tight">
            Consultation fee is settled transparently in accordance with the advocate's scheduled tariff. Confirmation immediately provisions a private, end-to-end encrypted Case Workspace.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlotId || slots.length === 0}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-lg transition-all ${
                isSubmitting || !selectedSlotId || slots.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-amber-900/30'
              }`}
            >
              {isSubmitting ? 'Confirming Booking...' : 'Confirm Appointment & Open Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
