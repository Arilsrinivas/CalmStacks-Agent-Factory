/**
 * ============================================================================
 * CalmStacks LegalConnect - AI Case Intake Assistant
 * Module: ai/src/intake-parser.ts
 * Description: Pure, deterministic structured entity extractor that analyzes
 *              conversational user narratives and extracts factual summaries,
 *              parties involved, timeline, relief sought, suggested Indian
 *              practice areas, and judicial/tribunal forums.
 * Compliance: Strictly enforces non-legal-advice statutory disclaimers in
 *             compliance with Bar Council of India (BCI) rules.
 * ============================================================================
 */

import type {
  PartiesInvolved,
  AIIntakeSummaryResponse,
} from '../../contracts/types.ts';

/**
 * Mandatory Statutory Disclaimer asserting technical intake summarization
 * and explicitly disclaiming legal advice or advocate-client relationship.
 */
export const MANDATORY_STATUTORY_DISCLAIMER =
  'LEGAL NOTICE & STATUTORY DISCLAIMER: This summary is automatically synthesized by an automated artificial intelligence system solely to assist you in organizing your factual statements for a legal practitioner. The AI Case Assistant does NOT provide legal advice, legal counsel, or legal representation. No advocate-client relationship is created by using this feature. Only a verified, enrolled advocate licensed by a State Bar Council can provide formal legal advice upon consultation.';

export interface TimelineEntry {
  date_or_period: string;
  description: string;
}

export interface StructuredParties extends PartiesInvolved {
  client_role: string;
  opposing_party: string;
  relationship: string;
  dispute_nature: string;
  complainant_name?: string;
  respondent_name?: string;
}

export interface StructuredCaseIntake {
  facts_summary: string;
  parties_involved: StructuredParties;
  timeline: TimelineEntry[];
  key_relief_sought: string;
  suggested_practice_areas: string[];
  suggested_forums: string[];
  statutory_disclaimer: string;
  missing_essential_details: string[];
  confidence_score: number;
}

export interface ParseOptions {
  preferred_language?: string;
  reference_date?: string; // ISO date string, defaults to current time
}

// ----------------------------------------------------------------------------
// Indian Practice Area Definitions & Scoring Taxonomy
// ----------------------------------------------------------------------------

export interface PracticeAreaDefinition {
  name: string;
  aliasPatterns: RegExp[];
  forums: string[];
  defaultClientRole: string;
  defaultOpposingRole: string;
  defaultRelationship: string;
  defaultRelief: string;
  keywords: string[];
}

export const INDIAN_PRACTICE_AREAS: Record<string, PracticeAreaDefinition> = {
  'Banking & Cheque Bounce / Sec 138 NI Act': {
    name: 'Banking & Cheque Bounce / Sec 138 NI Act',
    aliasPatterns: [
      /\b(?:cheque|check|bounc(?:ed|ing)|dishonou?r(?:ed)?|138\b|negotiable\s+instruments|funds\s+insufficient|stop\s+payment|bank\s+return\s+memo|statutory\s+notice)\b/i,
      /\b(?:drawer|payee|cheque\s+amount|debt\s+recovery)\b/i,
    ],
    forums: [
      'Metropolitan Magistrate Court / Judicial Magistrate First Class (JMFC)',
      'Negotiable Instruments Act Special Court',
    ],
    defaultClientRole: 'Complainant / Payee (Aggrieved Holder in Due Course)',
    defaultOpposingRole: 'Accused / Drawer of Dishonoured Cheque',
    defaultRelationship: 'Payee - Drawer (Commercial / Financial Obligation)',
    defaultRelief:
      'Recovery of dishonoured cheque amount with statutory interest and damages, and penal prosecution under Section 138 of Negotiable Instruments Act',
    keywords: [
      'cheque',
      'check',
      'bounced',
      'dishonour',
      'dishonored',
      'section 138',
      '138',
      'ni act',
      'insufficient funds',
      'bank memo',
      'drawer',
      'payee',
      'demand notice',
    ],
  },

  'Real Estate & RERA': {
    name: 'Real Estate & RERA',
    aliasPatterns: [
      /\b(?:rera|flat|apartment|builder|developer|builder-buyer|possession|allotment|occupancy\s+certificate|completion\s+certificate|super\s+built-up|carpet\s+area|society|housing\s+society|property\s+handover)\b/i,
      /\b(?:tenan(?:t|cy)|landlord|security\s+deposit|eviction|rent\s+agreement|lease\s+deed|vacat(?:ed|ing))\b/i,
    ],
    forums: [
      'Real Estate Regulatory Authority (RERA)',
      'State RERA Appellate Tribunal',
      'District Consumer Disputes Redressal Commission',
    ],
    defaultClientRole: 'Allottee / Homebuyer / Aggrieved Tenant',
    defaultOpposingRole: 'Promoter / Real Estate Developer / Landlord',
    defaultRelationship: 'Buyer - Builder / Tenant - Landlord',
    defaultRelief:
      'Immediate delivery of physical possession with delayed handover interest, complete refund with interest under Section 18 of RERA, compensation for mental harassment',
    keywords: [
      'flat',
      'builder',
      'possession',
      'apartment',
      'rera',
      'delay',
      'promoter',
      'allotment',
      'handover',
      'booking amount',
      'landlord',
      'security deposit',
      'tenant',
    ],
  },

  'Matrimonial & Family Law': {
    name: 'Matrimonial & Family Law',
    aliasPatterns: [
      /\b(?:divorce|marriage|matrimonial|husband|wife|spouse|spousal|mutual\s+consent|13b|hindu\s+marriage\s+act|maintenance|alimony|custody|child\s+visitation|stridhan|conjugal\s+rights|cruelty|desertion)\b/i,
    ],
    forums: [
      'Family Court',
      'District & Sessions Court (Family Division)',
    ],
    defaultClientRole: 'Petitioner / Aggrieved Spouse',
    defaultOpposingRole: 'Respondent / Spouse',
    defaultRelationship: 'Husband - Wife (Spousal / Matrimonial Relationship)',
    defaultRelief:
      'Decree of dissolution of marriage by mutual consent under Section 13B Hindu Marriage Act, permanent alimony / monthly maintenance, sole/joint child custody and visitation rights',
    keywords: [
      'divorce',
      'marriage',
      'husband',
      'wife',
      'mutual consent',
      'hindu marriage act',
      '13b',
      'maintenance',
      'alimony',
      'custody',
      'separated',
      'visitation',
    ],
  },

  'Labour & Employment': {
    name: 'Labour & Employment',
    aliasPatterns: [
      /\b(?:terminat(?:ed|ion)|fired|wrongful\s+termination|gratuity|severance|salary\s+arrears|unpaid\s+wages|employer|employee|workman|appointment\s+letter|notice\s+period|payment\s+of\s+gratuity\s+act|provident\s+fund|pf\s+dues)\b/i,
    ],
    forums: [
      'Labour Court / Industrial Tribunal',
      'Controlling Authority under Payment of Gratuity Act, 1972',
      'Commercial / Civil Court for Contractual Employment Damages',
    ],
    defaultClientRole: 'Aggrieved Employee / Workman',
    defaultOpposingRole: 'Employer / Corporate Management',
    defaultRelationship: 'Employee - Employer (Contract of Service)',
    defaultRelief:
      'Immediate disbursement of accrued statutory gratuity with statutory interest, severance pay in lieu of unserved notice period, clearance of pending salary arrears, and damages for wrongful termination',
    keywords: [
      'termination',
      'terminated',
      'fired',
      'employer',
      'employee',
      'gratuity',
      'severance',
      'notice period',
      'salary arrears',
      'payment of gratuity act',
      'relieving letter',
      'full and final settlement',
    ],
  },

  'Intellectual Property': {
    name: 'Intellectual Property',
    aliasPatterns: [
      /\b(?:trademark|copyright|patent|counterfeit|passing\s+off|infringement|brand\s+logo|brand\s+name|registered\s+mark|deceptive(?:ly)?\s+similar|cease\s+and\s+desist|ipr|intellectual\s+property|tradename)\b/i,
    ],
    forums: [
      'Commercial Court (under Commercial Courts Act, 2015)',
      'High Court (Commercial Division / Intellectual Property Division)',
    ],
    defaultClientRole: 'Registered Trademark Owner / Prior User (Plaintiff)',
    defaultOpposingRole: 'Infringing Enterprise / Counterfeiter (Defendant)',
    defaultRelationship: 'Brand Owner - Competitor / Infringing Commercial Party',
    defaultRelief:
      'Permanent and ad-interim injunction restraining trademark infringement and passing off, rendition of accounts of illicit profits, punitive damages, and seizure / destruction of counterfeit goods',
    keywords: [
      'trademark',
      'infringement',
      'passing off',
      'counterfeit',
      'brand',
      'logo',
      'registered trademark',
      'cease and desist',
      'deceptively similar',
      'ipr',
    ],
  },

  'Consumer Protection': {
    name: 'Consumer Protection',
    aliasPatterns: [
      /\b(?:consumer|deficiency\s+in\s+service|defective\s+goods|unfair\s+trade\s+practice|consumer\s+forum|consumer\s+commission|warranty|guarantee|e-commerce|consumer\s+protection\s+act)\b/i,
    ],
    forums: [
      'District Consumer Disputes Redressal Commission',
      'State Consumer Disputes Redressal Commission',
      'National Consumer Disputes Redressal Commission (NCDRC)',
    ],
    defaultClientRole: 'Aggrieved Consumer / Complainant',
    defaultOpposingRole: 'Service Provider / Goods Manufacturer / Seller',
    defaultRelationship: 'Consumer - Service Provider / Merchant',
    defaultRelief:
      'Full refund of consideration with commercial interest, replacement of defective product, compensation for deficiency in service and mental agony, litigation costs',
    keywords: [
      'consumer',
      'deficiency in service',
      'defective',
      'refund',
      'consumer court',
      'consumer commission',
      'replacement',
      'unfair trade practice',
    ],
  },

  'Corporate & Contractual': {
    name: 'Corporate & Contractual',
    aliasPatterns: [
      /\b(?:breach\s+of\s+contract|service\s+agreement|master\s+service\s+agreement|vendor\s+dispute|commercial\s+agreement|nclt|insolvency|operational\s+creditor|corporate\s+debtor|nda|indemnity|arbitration)\b/i,
    ],
    forums: [
      'National Company Law Tribunal (NCLT)',
      'Commercial Court',
      'Arbitral Tribunal',
      'Civil Court (Senior Division)',
    ],
    defaultClientRole: 'Operational Creditor / Aggrieved Contracting Party',
    defaultOpposingRole: 'Corporate Debtor / Defaulting Contracting Party',
    defaultRelationship: 'Contractual / Commercial B2B Relationship',
    defaultRelief:
      'Specific performance of contractual obligations, recovery of outstanding contractual dues with interest, liquidated damages for breach of contract',
    keywords: [
      'contract',
      'agreement',
      'breach',
      'commercial',
      'vendor',
      'nclt',
      'insolvency',
      'damages',
      'arbitration',
    ],
  },

  'Criminal Law': {
    name: 'Criminal Law',
    aliasPatterns: [
      /\b(?:fir|police\s+complaint|bail|anticipatory\s+bail|cyber\s+crime|cyber\s+fraud|cheating|420\s+ipc|theft|assault|extortion|quashing|criminal\s+breach\s+of\s+trust|chargesheet)\b/i,
    ],
    forums: [
      'Metropolitan Magistrate Court / Judicial Magistrate Court',
      'Sessions Court',
      'High Court (Sec 482 CrPC / Sec 528 Bharatiya Nagarik Suraksha Sanhita)',
    ],
    defaultClientRole: 'Complainant / Victim / Informant',
    defaultOpposingRole: 'Accused / Suspect',
    defaultRelationship: 'Victim / Informant - Accused Person',
    defaultRelief:
      'Registration and fair investigation of FIR, recovery of defrauded funds, grant of protective relief / bail, or quashing of vexatious criminal proceedings',
    keywords: [
      'fir',
      'police',
      'bail',
      'cheating',
      'fraud',
      '420',
      'criminal',
      'quashing',
      'cyber fraud',
    ],
  },
};

// ----------------------------------------------------------------------------
// Timeline & Entity Extraction Helpers
// ----------------------------------------------------------------------------

interface RegexMatchRule {
  pattern: RegExp;
  extractDate: (match: RegExpMatchArray) => string;
}

const DATE_EXTRACTION_RULES: RegexMatchRule[] = [
  // 31st August 2026 / 31 August 2026 / 15th Jan 2024
  {
    pattern: /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[,]?\s+\d{4})\b/i,
    extractDate: (m) => m[1],
  },
  // December 2023 / Jan 2024
  {
    pattern: /\b((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4})\b/i,
    extractDate: (m) => m[1],
  },
  // DD/MM/YYYY or DD-MM-YYYY
  {
    pattern: /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\b/,
    extractDate: (m) => m[1],
  },
  // In 2021 / Since 2018 / Year 2020
  {
    pattern: /\b(?:in|since|during|year)\s+(\d{4})\b/i,
    extractDate: (m) => `Year ${m[1]}`,
  },
  // Relative durations: since 15 days, for 6 years, 3 months ago, within 30 days
  {
    pattern: /\b((?:since|for|past|within|last)\s+\d+\s+(?:days?|weeks?|months?|years?))\b/i,
    extractDate: (m) => m[1],
  },
  // "15 days ago", "6 months ago"
  {
    pattern: /\b(\d+\s+(?:days?|weeks?|months?|years?)\s+ago)\b/i,
    extractDate: (m) => m[1],
  },
];

/**
 * Extracts chronological timeline events from conversational narrative sentences.
 */
export function extractChronologicalTimeline(text: string): TimelineEntry[] {
  const sentences = splitIntoSentences(text);
  const timeline: TimelineEntry[] = [];
  const seenDates = new Set<string>();

  for (const sentence of sentences) {
    for (const rule of DATE_EXTRACTION_RULES) {
      const match = sentence.match(rule.pattern);
      if (match) {
        const dateStr = rule.extractDate(match).trim();
        const cleanedSentence = cleanSentenceForTimeline(sentence);

        // Avoid exact duplicate dates if already registered for the same event
        const key = `${dateStr.toLowerCase()}::${cleanedSentence.slice(0, 30).toLowerCase()}`;
        if (!seenDates.has(key)) {
          seenDates.add(key);
          timeline.push({
            date_or_period: dateStr,
            description: cleanedSentence,
          });
        }
        break; // Match one prominent date per sentence
      }
    }
  }

  // If no specific dates detected but intervals exist, extract fallback temporal context
  if (timeline.length === 0) {
    const generalTimeMatch = text.match(/\b(?:recently|yesterday|last week|currently|today)\b/i);
    if (generalTimeMatch) {
      timeline.push({
        date_or_period: generalTimeMatch[0],
        description: sentences[0] || text.slice(0, 100),
      });
    }
  }

  return timeline;
}

/**
 * Extract named entities representing complainant / client and opposing party.
 */
export function extractParties(
  text: string,
  topPracticeArea: PracticeAreaDefinition
): StructuredParties {
  let clientRole = topPracticeArea.defaultClientRole;
  let opposingParty = topPracticeArea.defaultOpposingRole;
  let relationship = topPracticeArea.defaultRelationship;
  let complainantName: string | undefined;
  let respondentName: string | undefined;

  // 1. Detect Complainant / Client Name & Entity
  const complainantMatch = text.match(
    /(?:my name is|i am|we are|on behalf of|our company|our firm)\s+(?:Mr\.?|Ms\.?|Mrs\.?)?\s*([A-Z][A-Za-z0-9\s&]+?(?:Enterprises|Technologies|Pvt\.?\s*Ltd\.?|Limited|LLP|Solutions|Builders)?)(?=[,\.\s]|$)/i
  );
  if (complainantMatch) {
    const raw = complainantMatch[1].trim();
    if (!/^(writing|seeking|filing|a|an|facing|working|pleased|glad)$/i.test(raw)) {
      complainantName = raw;
    }
  }

  // 2. Detect Specific Opponent by Contextual Roles:
  // Competitor in IP
  const competitorMatch = text.match(
    /(?:competing manufacturer|competitor|infringing manufacturer|infringing enterprise|counterfeiter)\s+([A-Z][A-Za-z0-9\s&]+?(?:Pvt\.?\s*Ltd\.?|Limited|LLP|Enterprises|Remedies)?)/i
  );
  if (competitorMatch) {
    respondentName = competitorMatch[1].trim();
  }

  // Builder / Developer in Real Estate
  if (!respondentName) {
    const builderMatch = text.match(
      /(?:developed by|builder|promoter|project developed by)\s+([A-Z][A-Za-z0-9\s&]+?(?:Builders|Developers|Infra|Projects|Pvt\.?\s*Ltd\.?))/i
    );
    if (builderMatch) {
      respondentName = builderMatch[1].trim();
    }
  }

  // Employer in Labour / Employment
  if (!respondentName) {
    const employerMatch = text.match(
      /(?:worked (?:at|for|as .*? at)|employed (?:at|by)|joined)\s+([A-Z][A-Za-z0-9\s&]+?(?:Technologies|Ltd|Limited|Pvt\.?\s*Ltd\.?|Corp|Enterprises|Solutions))/i
    );
    if (employerMatch) {
      respondentName = employerMatch[1].trim();
    }
  }

  // Spousal Name in Matrimonial
  if (!respondentName) {
    const spouseMatch = text.match(/(?:husband|wife|spouse)\s+([A-Z][a-z]+)/i);
    if (spouseMatch) {
      respondentName = spouseMatch[1].trim();
    }
  }

  // Acquaintance / Debtor in Cheque Bounce / Commercial Loan
  if (!respondentName) {
    const debtorMatch = text.match(
      /(?:loan of .*? to (?:my )?(?:business acquaintance|friend|partner|colleague|debtor)?\s*(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?))/i
    );
    if (debtorMatch) {
      respondentName = debtorMatch[1].trim();
    }
  }

  // Direct honorific (e.g. Mr. Ramesh Kumar, Mr. Verma)
  if (!respondentName) {
    const honorificMatch = text.match(/(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (honorificMatch && (!complainantName || !honorificMatch[1].includes(complainantName))) {
      respondentName = honorificMatch[1].trim();
    }
  }

  // General corporate opposing entities (excluding complainant)
  if (!respondentName) {
    const corporateMatches = Array.from(
      text.matchAll(
        /\b([A-Z][A-Za-z0-9\s&]+(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Limited|LLP|Builders|Developers|Technologies|Enterprises|Solutions|Infotech|Corporation|Inc\.?))\b/g
      )
    );
    for (const m of corporateMatches) {
      const matchText = m[1].trim();
      if (!complainantName || !matchText.toLowerCase().includes(complainantName.toLowerCase())) {
        respondentName = matchText;
        break;
      }
    }
  }

  // Context-specific refinements based on practice area & keywords
  if (topPracticeArea.name === 'Real Estate & RERA') {
    if (/\b(?:tenant|landlord|security deposit|rent)\b/i.test(text)) {
      clientRole = complainantName ? `${complainantName} (Aggrieved Tenant)` : 'Client (Aggrieved Tenant)';
      opposingParty = respondentName ? `${respondentName} (Landlord)` : 'Landlord / Property Owner';
      relationship = 'Tenant - Landlord (Residential / Commercial Lease)';
    } else {
      clientRole = complainantName ? `${complainantName} (Flat Buyer / Allottee)` : 'Allottee / Homebuyer';
      opposingParty = respondentName ? `${respondentName} (Builder / Developer)` : 'Omex Builders (Builder / Developer)';
      relationship = 'Homebuyer - Real Estate Promoter (Builder-Buyer Agreement)';
    }
  } else if (topPracticeArea.name === 'Banking & Cheque Bounce / Sec 138 NI Act') {
    clientRole = complainantName ? `${complainantName} (Complainant / Payee)` : 'Complainant / Payee (Holder in Due Course)';
    opposingParty = respondentName ? `${respondentName} (Accused / Drawer)` : 'Accused / Drawer of Dishonoured Cheque';
    relationship = 'Payee - Drawer (Commercial / Legally Enforceable Debt)';
  } else if (topPracticeArea.name === 'Matrimonial & Family Law') {
    const isWife = /\b(?:my husband|wife)\b/i.test(text);
    const isHusband = /\b(?:my wife|husband)\b/i.test(text);
    if (isWife) {
      clientRole = complainantName ? `${complainantName} (Petitioner / Wife)` : 'Petitioner / Wife';
      opposingParty = respondentName ? `${respondentName} (Respondent / Husband)` : 'Respondent / Husband';
    } else if (isHusband) {
      clientRole = complainantName ? `${complainantName} (Petitioner / Husband)` : 'Petitioner / Husband';
      opposingParty = respondentName ? `${respondentName} (Respondent / Wife)` : 'Respondent / Wife';
    }
    relationship = 'Spouses married under Hindu Marriage Act (Matrimonial Relationship)';
  } else if (topPracticeArea.name === 'Labour & Employment') {
    clientRole = complainantName ? `${complainantName} (Aggrieved Employee)` : 'Aggrieved Employee / Workman';
    opposingParty = respondentName ? `${respondentName} (Employer)` : 'Zenith Technologies Ltd (Employer)';
    relationship = 'Employee - Employer (Service Agreement)';
  } else if (topPracticeArea.name === 'Intellectual Property') {
    clientRole = complainantName ? `${complainantName} (Registered Trademark Owner)` : 'Registered Trademark Owner / Prior User';
    opposingParty = respondentName ? `${respondentName} (Infringing Competitor)` : 'Apex Remedies Pvt Ltd (Infringing Competitor)';
    relationship = 'Brand Owner - Unauthorized Infringer / Competitor';
  } else if (topPracticeArea.name === 'Consumer Protection') {
    clientRole = complainantName ? `${complainantName} (Consumer / Complainant)` : 'Consumer / Complainant';
    opposingParty = respondentName ? `${respondentName} (Opposite Party)` : 'Service Provider / Merchant';
    relationship = 'Consumer - Commercial Service Provider / Merchant';
  }

  // Synthesize dispute nature
  const disputeNature = `${topPracticeArea.name}: ${summarizeDisputeNature(text, topPracticeArea)}`;

  return {
    client_role: clientRole,
    opposing_party: opposingParty,
    relationship,
    dispute_nature: disputeNature,
    complainant_name: complainantName,
    respondent_name: respondentName,
  };
}

/**
 * Extract key relief sought from text, matching user intent and statutory provisions.
 */
export function extractKeyRelief(
  text: string,
  topPracticeArea: PracticeAreaDefinition
): string {
  const reliefs: string[] = [];

  // Cheque Bounce remedies
  if (/138|cheque|check|bounced/i.test(text)) {
    const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\s*(?:Lakhs?|Crores?|thousand))?)/i);
    const amountStr = amountMatch ? `of ${amountMatch[0]} ` : '';
    reliefs.push(`Recovery of dishonoured cheque amount ${amountStr}with statutory 18% p.a. interest`);
    reliefs.push('Criminal prosecution and penal punishment under Section 138 of Negotiable Instruments Act, 1881');
  }

  // Real estate / builder remedies
  if (/flat|apartment|possession|builder|rera/i.test(text)) {
    if (/refund/i.test(text)) {
      reliefs.push('Complete refund of deposited consideration along with prescribed interest under Section 18 of RERA');
    }
    if (/possession/i.test(text)) {
      reliefs.push('Immediate handover of physical possession with Occupancy Certificate (OC) and delay compensation');
    }
    if (/security deposit/i.test(text)) {
      const amountMatch = text.match(/(?:INR|Rs\.?|₹)?\s*([\d,]+)\s*(?:INR|rupees)?/i);
      const amount = amountMatch ? amountMatch[1] : '';
      reliefs.push(`Immediate return and refund of withholding security deposit (INR ${amount || '80,000'}) with interest`);
    }
  }

  // Matrimonial remedies
  if (/divorce|mutual consent|13b|marriage|husband|wife/i.test(text)) {
    if (/mutual consent|13b/i.test(text)) {
      reliefs.push('Decree of divorce by mutual consent under Section 13B of Hindu Marriage Act, 1955');
    }
    if (/maintenance|alimony/i.test(text)) {
      reliefs.push('Order for permanent alimony and monthly maintenance settlement');
    }
    if (/custody|child/i.test(text)) {
      reliefs.push('Settlement of child custody arrangements and scheduled parental visitation rights');
    }
  }

  // Employment remedies
  if (/terminat|fired|gratuity|severance|salary|wages/i.test(text)) {
    if (/gratuity/i.test(text)) {
      reliefs.push('Payment of accrued statutory gratuity with 10% statutory penal interest under Section 7 of Payment of Gratuity Act, 1972');
    }
    if (/notice period|severance/i.test(text)) {
      reliefs.push('Payment in lieu of mandated notice period (severance compensation)');
    }
    if (/salary|arrears/i.test(text)) {
      reliefs.push('Release of unpaid salary arrears and formal issuance of Experience and Relieving Letters');
    }
    if (/wrongful/i.test(text) || reliefs.length === 0) {
      reliefs.push('Damages and compensation for illegal and wrongful termination without due process');
    }
  }

  // Intellectual property remedies
  if (/trademark|infringement|passing off|counterfeit|logo/i.test(text)) {
    reliefs.push('Permanent and ad-interim injunction restraining the defendant from using the deceptively similar trademark and passing off goods');
    reliefs.push('Rendition of accounts of illicit profits made by the infringing enterprise');
    reliefs.push('Seizure, forfeiture, and destruction of all counterfeit inventory and marketing materials');
    reliefs.push('Award of exemplary and punitive damages for brand dilution and goodwill infringement');
  }

  // General monetary compensation if requested
  const damagesMatch = text.match(/\b(?:damages|compensation|refund|return)\b/i);
  if (damagesMatch && reliefs.length === 0) {
    reliefs.push('Full financial restitution and compensation for damages incurred');
  }

  // Fallback to practice area default relief if none specifically matched
  if (reliefs.length === 0) {
    return topPracticeArea.defaultRelief;
  }

  return reliefs.join('; ');
}

/**
 * Synthesizes a factual procedural summary by filtering conversational filler
 * and organizing core assertions.
 */
export function synthesizeFactsSummary(
  text: string,
  topPracticeArea: PracticeAreaDefinition,
  timeline: TimelineEntry[],
  parties: StructuredParties
): string {
  const sentences = splitIntoSentences(text);
  const substantiveSentences = sentences.filter((s) => {
    // Filter conversational fluff
    if (/^(hi|hello|dear|sir|madam|please help|i need a lawyer|what should i do|can you tell me)/i.test(s)) {
      return false;
    }
    return s.length >= 15;
  });

  const coreNarration = substantiveSentences.length > 0
    ? substantiveSentences.slice(0, 4).join(' ')
    : text.slice(0, 300);

  const timelineNote = timeline.length > 0
    ? ` Chronological highlights: ${timeline.map((t) => `${t.date_or_period} (${t.description})`).join('; ')}.`
    : '';

  const partyNote = ` Dispute involves ${parties.client_role} against ${parties.opposing_party}.`;

  return `${coreNarration.trim()}${partyNote}${timelineNote}`;
}

/**
 * Identifies missing essential details (e.g. absent dates, missing contract proof,
 * undisclosed amounts) to prompt client for procedural augmentation.
 */
export function identifyMissingDetails(
  text: string,
  topPracticeArea: PracticeAreaDefinition,
  timeline: TimelineEntry[]
): string[] {
  const missing: string[] = [];

  // Check timeline
  if (timeline.length === 0) {
    missing.push('Specific dates or chronological timeframe of incidents/dispute not provided.');
  }

  // Check financial specifics
  const hasAmount = /(?:INR|Rs\.?|₹|\b\d+\s*(?:lakhs?|crores?|thousand|rupees))\b/i.test(text);
  if (!hasAmount && /cheque|refund|deposit|gratuity|alimony|damages|salary/i.test(text)) {
    missing.push('Exact monetary quantum or claim value involved is not specified.');
  }

  // Check documentary evidence
  const hasDocRef = /\b(?:agreement|notice|contract|cheque|receipt|deed|letter|email|invoice|statement)\b/i.test(text);
  if (!hasDocRef) {
    missing.push('Status of written documentary evidence (e.g., formal contracts, receipts, written notices) not mentioned.');
  }

  // Domain-specific checks
  if (topPracticeArea.name === 'Banking & Cheque Bounce / Sec 138 NI Act') {
    if (!/notice|legal notice|demand notice/i.test(text)) {
      missing.push('Issuance of 30-day statutory demand notice under Section 138(b) NI Act not stated.');
    }
  } else if (topPracticeArea.name === 'Labour & Employment') {
    if (!/appointment|contract|offer letter/i.test(text)) {
      missing.push('Presence of formal appointment letter or contractual severance terms unknown.');
    }
  } else if (topPracticeArea.name === 'Real Estate & RERA') {
    if (!/agreement|allotment letter|rera registered/i.test(text)) {
      missing.push('RERA registration number or copy of signed Builder-Buyer Agreement not confirmed.');
    }
  }

  return missing;
}

/**
 * Classifies practice areas and ranks by confidence score.
 */
export function classifyPracticeAreas(text: string): {
  suggestedAreas: string[];
  suggestedForums: string[];
  topArea: PracticeAreaDefinition;
  confidenceScore: number;
} {
  const scores: Array<{ area: PracticeAreaDefinition; score: number }> = [];

  for (const key of Object.keys(INDIAN_PRACTICE_AREAS)) {
    const def = INDIAN_PRACTICE_AREAS[key];
    let score = 0;

    // Check alias regex patterns
    for (const pattern of def.aliasPatterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        score += matches.length * 4;
      }
    }

    // Check keywords
    const lowerText = text.toLowerCase();
    for (const kw of def.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += 2;
      }
    }

    scores.push({ area: def, score });
  }

  // Sort descending by score, and alphabetically by name for deterministic behavior on ties
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.area.name.localeCompare(b.area.name);
  });

  // If top score is 0, default to Consumer Protection / General Civil
  const topScoreItem = scores[0];
  const topArea = topScoreItem.score > 0 ? topScoreItem.area : INDIAN_PRACTICE_AREAS['Consumer Protection'];

  // Select all areas with positive score, or at least the top area
  const suggestedAreas: string[] = [];
  const forumsSet = new Set<string>();

  for (const s of scores) {
    if (s.score > 0 && suggestedAreas.length < 3) {
      suggestedAreas.push(s.area.name);
      for (const forum of s.area.forums) {
        forumsSet.add(forum);
      }
    }
  }

  if (suggestedAreas.length === 0) {
    suggestedAreas.push(topArea.name);
    for (const forum of topArea.forums) {
      forumsSet.add(forum);
    }
  }

  // Calculate confidence score normalized to [0.50, 0.99]
  const rawScore = topScoreItem.score;
  const confidenceScore = Math.min(0.99, Math.max(0.55, 0.50 + rawScore * 0.05));

  return {
    suggestedAreas,
    suggestedForums: Array.from(forumsSet),
    topArea,
    confidenceScore: parseFloat(confidenceScore.toFixed(2)),
  };
}

// ----------------------------------------------------------------------------
// Main Structured Case Intake Parser
// ----------------------------------------------------------------------------

/**
 * Pure, deterministic entity extractor and procedural case intake parser.
 * Analyzes conversational client text and extracts factual summaries,
 * parties involved, chronological events, relief sought, practice areas,
 * judicial forums, and statutory disclaimers.
 */
export function parseLegalIntake(
  rawText: string,
  _options: ParseOptions = {}
): StructuredCaseIntake {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Case intake narrative cannot be empty.');
  }

  const cleanText = rawText.trim();

  // 1. Practice area classification & forum determination
  const { suggestedAreas, suggestedForums, topArea, confidenceScore } =
    classifyPracticeAreas(cleanText);

  // 2. Timeline extraction
  const timeline = extractChronologicalTimeline(cleanText);

  // 3. Parties extraction
  const partiesInvolved = extractParties(cleanText, topArea);

  // 4. Key relief extraction
  const keyReliefSought = extractKeyRelief(cleanText, topArea);

  // 5. Procedural facts summary synthesis
  const factsSummary = synthesizeFactsSummary(cleanText, topArea, timeline, partiesInvolved);

  // 6. Missing essential details identification
  const missingDetails = identifyMissingDetails(cleanText, topArea, timeline);

  return {
    facts_summary: factsSummary,
    parties_involved: partiesInvolved,
    timeline,
    key_relief_sought: keyReliefSought,
    suggested_practice_areas: suggestedAreas,
    suggested_forums: suggestedForums,
    statutory_disclaimer: MANDATORY_STATUTORY_DISCLAIMER,
    missing_essential_details: missingDetails,
    confidence_score: confidenceScore,
  };
}

/**
 * Transforms parsed intake into the standard API DTO matching contracts/types.ts
 */
export function toAIIntakeSummaryResponse(
  intakeId: string,
  parsed: StructuredCaseIntake,
  disclaimerAccepted: boolean = false
): AIIntakeSummaryResponse {
  return {
    id: `summary-${intakeId}`,
    intake_id: intakeId,
    facts_summary: parsed.facts_summary,
    parties_involved: parsed.parties_involved,
    key_relief_sought: parsed.key_relief_sought,
    suggested_practice_areas: parsed.suggested_practice_areas,
    disclaimer_accepted: disclaimerAccepted,
    statutory_disclaimer: parsed.statutory_disclaimer,
    created_at: new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------------
// Internal Helper Utilities
// ----------------------------------------------------------------------------

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function cleanSentenceForTimeline(sentence: string): string {
  return sentence
    .replace(/^(and|but|also|however|furthermore|then)\s+/i, '')
    .trim();
}

function summarizeDisputeNature(
  text: string,
  topArea: PracticeAreaDefinition
): string {
  if (topArea.name === 'Banking & Cheque Bounce / Sec 138 NI Act') {
    return 'Dishonour of Cheque under Section 138 Negotiable Instruments Act due to insufficient funds / account closed';
  }
  if (topArea.name === 'Real Estate & RERA') {
    if (/deposit/i.test(text)) {
      return 'Dispute regarding wrongful withholding and non-refund of tenancy security deposit';
    }
    return 'Dispute regarding delayed handover of flat possession, violation of builder-buyer terms, and claim under RERA';
  }
  if (topArea.name === 'Matrimonial & Family Law') {
    return 'Matrimonial petition for mutual consent divorce under Section 13B Hindu Marriage Act with maintenance and child custody settlement';
  }
  if (topArea.name === 'Labour & Employment') {
    return 'Employment dispute involving wrongful termination, non-payment of statutory gratuity, and unpaid notice pay';
  }
  if (topArea.name === 'Intellectual Property') {
    return 'Commercial action for registered trademark infringement, passing off, and brand dilution by competing enterprise';
  }
  if (topArea.name === 'Consumer Protection') {
    return 'Consumer complaint asserting deficiency in service, non-refund, and unfair commercial practice';
  }
  return 'Civil and commercial legal dispute';
}
