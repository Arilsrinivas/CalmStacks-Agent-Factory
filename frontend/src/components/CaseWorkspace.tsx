import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  CaseWorkspaceRecord,
  CaseDocumentRecord,
  WorkspaceMessageRecord,
  ConsultationRecord,
} from '../types';
import { useAuth } from '../context/AuthContext';

interface CaseWorkspaceProps {
  initialWorkspaceId?: string;
}

export const CaseWorkspace: React.FC<CaseWorkspaceProps> = ({ initialWorkspaceId }) => {
  const { user, role } = useAuth();
  const [workspaces, setWorkspaces] = useState<CaseWorkspaceRecord[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(initialWorkspaceId || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'consultation' | 'vault' | 'messages'>('overview');

  // Active workspace data
  const [currentWorkspace, setCurrentWorkspace] = useState<CaseWorkspaceRecord | null>(null);
  const [consultation, setConsultation] = useState<ConsultationRecord | null>(null);
  const [documents, setDocuments] = useState<CaseDocumentRecord[]>([]);
  const [messages, setMessages] = useState<WorkspaceMessageRecord[]>([]);

  // Document Upload Form
  const [fileName, setFileName] = useState('');
  const [docCategory, setDocCategory] = useState<
    'Agreement/Contract' | 'Legal Notice' | 'Police Complaint/FIR' | 'Court Order/Pleadings' | 'Identity Proof' | 'Financial Statement'
  >('Agreement/Contract');
  const [isUploading, setIsUploading] = useState(false);

  // Chat Form
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Load available workspaces
  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const list = await api.listWorkspaces();
        setWorkspaces(list);
        if (list.length > 0) {
          const target = initialWorkspaceId && list.some((w) => w.id === initialWorkspaceId)
            ? initialWorkspaceId
            : list[0].id;
          setActiveWorkspaceId(target);
        }
      } catch (err) {
        console.error('Error loading workspaces', err);
      }
    }
    loadWorkspaces();
  }, [initialWorkspaceId]);

  // Load active workspace details
  useEffect(() => {
    if (!activeWorkspaceId) return;

    async function loadDetails() {
      try {
        const ws = await api.getWorkspace(activeWorkspaceId);
        setCurrentWorkspace(ws);

        if (ws?.consultation_id) {
          const consultations = await api.listConsultations();
          const cons = consultations.find((c) => c.id === ws.consultation_id) || null;
          setConsultation(cons);
        }

        const docs = await api.listDocuments(activeWorkspaceId);
        setDocuments(docs);

        const msgs = await api.listMessages(activeWorkspaceId);
        setMessages(msgs);
      } catch (err) {
        console.error('Error loading workspace details', err);
      }
    }
    loadDetails();
  }, [activeWorkspaceId]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !activeWorkspaceId) return;

    setIsUploading(true);
    try {
      const newDoc = await api.uploadDocument({
        workspace_id: activeWorkspaceId,
        uploaded_by_user_id: user?.id || 'anonymous',
        uploaded_by_name: user?.full_name || 'Participant',
        file_name: fileName.trim(),
        file_size_bytes: Math.floor(1024 * 1024 * (1 + Math.random() * 4)),
        mime_type: fileName.endsWith('.docx') ? 'application/vnd.openxmlformats' : 'application/pdf',
        category: docCategory,
      });
      setDocuments([newDoc, ...documents]);
      setFileName('');
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeWorkspaceId) return;

    setIsSending(true);
    try {
      const msg = await api.sendMessage({
        workspace_id: activeWorkspaceId,
        sender_id: user?.id || 'anonymous',
        sender_name: user?.full_name || 'Participant',
        sender_role: role,
        message_text: newMessageText.trim(),
      });
      setMessages([...messages, msg]);
      setNewMessageText('');
    } catch (err) {
      console.error('Message send failed', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400 max-w-2xl mx-auto shadow-md">
          <div className="text-3xl mb-2">📁</div>
          <h2 className="text-sm font-bold text-white font-serif">No Active Case Workspace Selected</h2>
          <p className="text-xs text-slate-400 mt-1">
            Book a consultation with a verified advocate to provision an encrypted case workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner: Case Workspace Header & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-amber-950/80 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40">
                {currentWorkspace.id.toUpperCase()}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                ● Status: Active & Privileged
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Statutory Privilege: Sec 132 Bharatiya Sakshya Adhiniyam
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
              {currentWorkspace.title}
            </h1>
          </div>

          {/* Switch Case Workspace dropdown */}
          {workspaces.length > 1 && (
            <div className="text-xs">
              <label className="text-slate-400 block mb-1 font-semibold">Switch Case File:</label>
              <select
                value={activeWorkspaceId}
                onChange={(e) => setActiveWorkspaceId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded p-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id.toUpperCase()} - {w.title.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-4 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Case Dossier & Overview', icon: '📋' },
            { id: 'consultation', label: 'Consultation Booking', icon: '📅' },
            { id: 'vault', label: `Secure Document Vault (${documents.length})`, icon: '🔒' },
            { id: 'messages', label: `Privileged Chat (${messages.length})`, icon: '💬' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Case Overview & Linked AI Dossier */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold font-serif text-white mb-2">
              Case Profile & Statutory Framing
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              This persistent digital workspace is cryptographically siloed and accessible only by the verified client and the assigned legal practitioner. All exchanges within this space are protected by legal professional privilege.
            </p>

            {currentWorkspace.intake_summary ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Linked AI Case Intake Dossier
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Submitted on: {new Date(currentWorkspace.intake_summary.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Factual Chronology:</h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentWorkspace.intake_summary.facts_summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Parties Identified:</h4>
                    <p className="text-slate-300">
                      <strong>Client:</strong> {currentWorkspace.intake_summary.parties_involved.client_role}
                    </p>
                    <p className="text-slate-300">
                      <strong>Opposing:</strong> {currentWorkspace.intake_summary.parties_involved.opposing_party}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Key Relief Demanded:</h4>
                    <p className="text-slate-300">{currentWorkspace.intake_summary.key_relief_sought}</p>
                  </div>
                </div>

                {currentWorkspace.intake_summary.suggested_practice_areas && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Classified Practice Areas:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentWorkspace.intake_summary.suggested_practice_areas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-400">
                Direct consultation appointment booked. No automated intake narrative attached.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Consultation Details */}
      {activeTab === 'consultation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <h2 className="text-lg font-bold font-serif text-white mb-4">
            Scheduled Consultation Details
          </h2>

          {consultation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Appointment Status</span>
                  <span className="inline-block mt-1 font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-wide">
                    {consultation.status}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Scheduled Date & Time</span>
                  <span className="text-white text-sm font-mono font-bold">
                    {new Date(consultation.scheduled_at).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    • {new Date(consultation.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Consultation Mode</span>
                  <span className="text-amber-400 font-bold capitalize">
                    {consultation.mode.replace('_', ' ')} Session
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Assigned Advocate</span>
                  <span className="text-white font-medium">{consultation.advocate_name || 'Enrolled Advocate'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Client Name</span>
                  <span className="text-white font-medium">{consultation.client_name || 'Citizen Client'}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Direct Video / Audio Meeting Link
                  </h4>
                  <div className="bg-slate-900 p-3 rounded border border-slate-700 font-mono text-amber-400 select-all">
                    https://meet.legalconnect.local/room/{currentWorkspace.id}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    End-to-end encrypted room opens 10 minutes prior to scheduled session time.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-1">
                    Consultation Brief & Scope
                  </h4>
                  <p className="text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 italic">
                    "{consultation.notes || 'Preliminary advisory session regarding disputed legal notices and claim preparation.'}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Consultation record loading...</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Secure Document Vault */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Upload Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold font-serif text-white mb-2">
              Evidentiary Document Vault
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Upload lease deeds, dishonoured cheques, bank statements, legal notices, or police filings. All files are encrypted at rest with AES-256 and accessible only to authorized case participants.
            </p>

            <form onSubmit={handleUploadDocument} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Document Title / File Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. lease_agreement_signed_2025.pdf or bank_challan.png"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Legal Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Agreement/Contract">Agreement / Contract</option>
                    <option value="Legal Notice">Legal Notice</option>
                    <option value="Police Complaint/FIR">Police Complaint / FIR</option>
                    <option value="Court Order/Pleadings">Court Order / Pleadings</option>
                    <option value="Financial Statement">Financial Statement</option>
                    <option value="Identity Proof">Identity Proof</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-slate-500">
                  Accepted formats: PDF, PNG, JPG, DOCX (Max 25MB)
                </span>
                <button
                  type="submit"
                  disabled={isUploading || !fileName.trim()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isUploading || !fileName.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Encrypting & Uploading...</span>
                    </>
                  ) : '🔒 Upload to Encrypted Vault'}
                </button>
              </div>
            </form>
          </div>

          {/* Document List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Stored Case Artifacts ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                <div className="text-3xl mb-2">📄</div>
                <h3 className="text-sm font-bold text-white font-serif">No Documents</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  No documents have been uploaded to this encrypted case vault yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                        📄
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{doc.file_name}</div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                            {doc.category || 'General'}
                          </span>
                          <span>•</span>
                          <span>{(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>•</span>
                          <span>Uploaded by: {doc.uploaded_by_name || 'Participant'}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:self-center">
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                        AES-256 Verified
                      </span>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Privileged Real-Time Case Messaging Thread */}
      {activeTab === 'messages' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col h-[600px]">
          <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Privileged Case Communications Thread
              </h2>
              <p className="text-[11px] text-slate-400">
                Encrypted correspondence between client and enrolled advocate.
              </p>
            </div>
            <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
              🔒 Statutory Privilege Active
            </span>
          </div>

          {/* Messages scroll box */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isSystem = msg.sender_id === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="inline-block bg-slate-950 border border-slate-800 text-slate-400 text-[11px] px-3 py-1 rounded-full">
                      ⚖️ {msg.message_text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{msg.sender_name}</span>
                    <span className="text-[10px] bg-slate-800 text-amber-400 px-1 rounded capitalize">
                      {msg.sender_role}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl max-w-lg text-xs leading-relaxed ${
                      isMe
                        ? 'bg-amber-600 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.message_text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Send Box */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-800 pt-3 flex space-x-2">
            <input
              type="text"
              required
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type privileged message or case inquiry..."
              className="flex-1 bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isSending || !newMessageText.trim()}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isSending || !newMessageText.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-amber-900/30'
              }`}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
