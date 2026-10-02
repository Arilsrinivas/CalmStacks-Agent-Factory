import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-slate-950 font-bold">
                LC
              </div>
              <span className="text-lg font-bold text-white font-serif">LEGALCONNECT</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              India's trusted digital gateway bridging citizens, MSMEs, and verified Bar Council legal practitioners with privileged, secure workspaces.
            </p>
            <div className="flex items-center space-x-2 text-xs text-amber-500 font-semibold">
              <span>🇮🇳 Built for the Republic of India</span>
            </div>
          </div>

          {/* Col 2: Regulatory Pillars */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Statutory Compliance
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400 hover:text-slate-300">
                • Advocates Act, 1961 (No Touting / Advertising)
              </li>
              <li className="text-slate-400 hover:text-slate-300">
                • Bar Council of India (BCI) Rule 36 Directory Standards
              </li>
              <li className="text-slate-400 hover:text-slate-300">
                • Digital Personal Data Protection Act, 2023 (DPDPA)
              </li>
              <li className="text-slate-400 hover:text-slate-300">
                • Bharatiya Sakshya Adhiniyam, 2023 (Statutory Privilege)
              </li>
            </ul>
          </div>

          {/* Col 3: Key Practice Areas */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Practice Domains
            </h3>
            <ul className="space-y-2 text-xs">
              <li>Property & Tenancy Disputes (RERA)</li>
              <li>Cheque Bounce (Sec 138 NI Act)</li>
              <li>Commercial Contracts & MSME Recovery</li>
              <li>Family & Matrimonial Settlements</li>
              <li>Consumer Protection Redressal</li>
            </ul>
          </div>

          {/* Col 4: Platform Non-Solicitation Guarantee */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Ethical Guarantee
            </h3>
            <p className="text-xs leading-relaxed text-slate-400 bg-slate-900 p-3 rounded border border-slate-800">
              LegalConnect does not solicit work, offer paid promotions, or display subjective reviews. All listings are unranked and verified against State Bar rolls.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2026 CalmStacks Technologies Private Limited. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>Bar Council Enrollment Verification Enabled</span>
            <span>•</span>
            <span>256-bit AES Vault Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
