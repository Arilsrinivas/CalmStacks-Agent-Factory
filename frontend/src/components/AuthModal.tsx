import React, { useState } from 'react';
import { api } from '../api/client';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [barEnrollment, setBarEnrollment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({
          full_name: fullName,
          email,
          phone,
          role,
          bar_enrollment: role === 'advocate' ? barEnrollment : undefined,
        });
        login(res.user);
      } else {
        // Quick sign in by role
        const user = api.switchRole(role);
        login(user);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          ✕
        </button>

        <div className="mb-5 text-center">
          <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-slate-950 font-black mx-auto mb-2">
            LC
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            {isRegister ? 'Create LegalConnect Account' : 'Sign in to LegalConnect'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ethical legal gateway for Citizens, Advocates & Compliance Officers
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['client', 'advocate', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 text-xs font-semibold rounded capitalize border transition-colors ${
                    role === r
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {isRegister ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adv. Amit Saxena or Smt. Kavita Roy"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (+91)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {role === 'advocate' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    State Bar Council Enrolment Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={barEnrollment}
                    onChange={(e) => setBarEnrollment(e.target.value)}
                    placeholder="e.g. D/1234/2018 or MAH/5678/2016"
                    className="w-full bg-slate-950 border border-amber-500/50 rounded p-2 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Advocates require Bar Council verification before public listing.
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                In demo mode, you can instantly sign in as a pre-configured <strong className="text-amber-400 capitalize">{role}</strong> persona.
              </p>
              <div className="text-[11px] text-slate-400">
                • Client: Rohit Sharma (Litigant with Tenancy Dispute)<br />
                • Advocate: Adv. Rajesh Kumar (Verified Delhi High Court)<br />
                • Admin: Suresh Menon (BCI Compliance Officer)
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition-colors"
          >
            {isSubmitting ? 'Authenticating...' : isRegister ? 'Register & Continue' : `Sign In as ${role.toUpperCase()}`}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-amber-400 underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-amber-400 underline font-semibold"
              >
                Register New User
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
