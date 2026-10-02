# LegalConnect Frontend Web Application

**System**: LegalConnect MVP v1.0  
**Stack**: React 18, TypeScript 5, Vite, Tailwind CSS  
**Target Jurisdiction**: Republic of India (Advocates Act 1961, BCI Rule 36, DPDPA 2023)

---

## 1. Architectural Mission & Regulatory Compliance

LegalConnect is a digital legal gateway bridging Indian citizens and MSMEs with verified legal practitioners. The client web application strictly enforces statutory boundaries:

1. **Bar Council of India (BCI) Rule 36 Compliance**:
   - Strictly unranked, non-promotional advocate directory.
   - Zero sponsored listings, fee bidding, subjective reviews, or star ratings.
   - Profile attributes strictly limited to verifiable Bar credentials (Enrollment number, State Bar Council, experience, admitted courts, languages, transparent schedule fee).
2. **AI Advice Segregation**:
   - The Case Intake Assistant parses raw, multilingual dispute narratives into structured legal facts (Facts, Parties, Timeline, Relief, Categories).
   - A mandatory statutory disclaimer banner is prominently displayed declaring that AI does not render legal advice.
3. **Privileged Workspace Collaboration**:
   - Encrypted Case Workspaces with dedicated Document Vault (AES-256) and privileged chronological messaging under Section 132 of the Bharatiya Sakshya Adhiniyam, 2023 / Section 126 of the Indian Evidence Act.

---

## 2. Component Structure

```
frontend/
├── index.html                   # HTML entry with responsive Tailwind & Indian judicial typography
├── package.json                 # React 18, TypeScript, and build scripts
├── tsconfig.json                # Strict TypeScript configuration
├── vite.config.ts               # Vite configuration with contracts aliases
├── scripts/
│   └── fallback-build.cjs       # Standalone build & distribution packager
├── src/
│   ├── main.tsx                 # Application mount
│   ├── App.tsx                  # Root layout, navigation router, and auth wrapper
│   ├── index.css                # Deep Navy (#0F172A), Saffron Gold (#D97706), Clean Slate theme
│   ├── types/
│   │   └── index.ts             # Contracts-compliant TypeScript type definitions
│   ├── api/
│   │   ├── client.ts            # Client module mapping 1:1 to contracts/api.yaml
│   │   └── mockData.ts          # Authentic Indian legal seed data (High Courts, Sec 138, RERA)
│   ├── context/
│   │   └── AuthContext.tsx      # Role switcher & session state (Client, Advocate, Admin)
│   └── components/
│       ├── Navbar.tsx           # Navigation bar with role switcher & BCI compliance header
│       ├── Footer.tsx           # Indian regulatory framework & statutory notes
│       ├── DisclaimerBanner.tsx # Mandatory statutory legal notice banner
│       ├── CaseIntakeWizard.tsx # Plain-language intake, AI structuring & relief extraction
│       ├── AdvocateDirectory.tsx# BCI-compliant unranked directory with multi-parameter filters
│       ├── AdvocateBookingModal.tsx # Verified Bar credentials, slot picker & booking confirmation
│       ├── CaseWorkspace.tsx    # Tabbed workspace (Overview, Booking, Vault, Privileged Chat)
│       ├── AdvocateDashboard.tsx# Consultation requests docket, reschedule modal, workspace links
│       ├── AdminPortal.tsx      # State Bar enrollment verification queue & analytics
│       └── AuthModal.tsx        # Multi-role authentication & registration dialog
└── dist/                        # Standalone production distribution bundle
```

---

## 3. Core User Flows & Personas

- **Client Persona**: Describes dispute in plain language, reviews AI structured summary, acknowledges statutory disclaimer, searches verified advocates, selects consultation slot, and interacts in the Case Workspace.
- **Advocate Persona**: Reviews incoming consultation requests, accepts or reschedules appointments, inspects attached AI intake dossiers, and collaborates in the case docket.
- **Admin Persona**: Audits pending advocate Bar Council enrollment certificates, approves or rejects applications, and monitors non-promotional platform health metrics.

---

## 4. Verification & Build

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build
```
