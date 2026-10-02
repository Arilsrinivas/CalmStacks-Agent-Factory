import crypto from 'node:crypto';
import { getDatabase } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  IntakeSubmissionRequest,
  AIIntakeSummaryResponse,
  PartiesInvolved,
} from '../types/index.js';

const STATUTORY_DISCLAIMER =
  'This summary is automatically synthesized solely to organize factual statements. The AI does NOT provide legal advice.';

export class IntakeService {
  private get db() {
    return getDatabase();
  }

  public submitIntake(clientId: string, data: IntakeSubmissionRequest): AIIntakeSummaryResponse {
    const { raw_problem_description, preferred_language = 'en' } = data;

    if (!raw_problem_description || raw_problem_description.trim().length < 15) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'Problem description must be at least 15 characters in length'
      );
    }

    const intakeId = `intake-${crypto.randomUUID()}`;
    const summaryId = `summary-${crypto.randomUUID()}`;

    // 1. Insert case intake record
    this.db
      .prepare(`
        INSERT INTO case_intakes (id, client_id, raw_problem_description, preferred_language, status, created_at)
        VALUES (?, ?, ?, ?, 'submitted', datetime('now'))
      `)
      .run(intakeId, clientId, raw_problem_description, preferred_language);

    // 2. Perform AI extraction heuristics based on problem narrative
    const descLower = raw_problem_description.toLowerCase();

    // Determine practice areas
    const suggestedPracticeAreas: string[] = [];
    if (/landlord|tenant|rent|deposit|lease|flat|property|evict|possession|land/i.test(descLower)) {
      suggestedPracticeAreas.push('Property & Real Estate');
      suggestedPracticeAreas.push('Civil Litigation');
    }
    if (/cheque|bounce|138|loan|debt|bank|emi|default|npa/i.test(descLower)) {
      suggestedPracticeAreas.push('Banking & Finance');
      suggestedPracticeAreas.push('Civil Litigation');
    }
    if (/divorce|marriage|custody|maintenance|alimony|matrimonial|domestic/i.test(descLower)) {
      suggestedPracticeAreas.push('Family & Matrimonial');
    }
    if (/company|contract|agreement|shareholder|vendor|commercial|msme|payment/i.test(descLower)) {
      suggestedPracticeAreas.push('Corporate & Commercial');
      suggestedPracticeAreas.push('Arbitration');
    }
    if (/salary|employment|employer|workplace|termination|gratuity|pf|labour/i.test(descLower)) {
      suggestedPracticeAreas.push('Labour & Employment');
    }
    if (/consumer|defective|product|warranty|refund|service deficiency/i.test(descLower)) {
      suggestedPracticeAreas.push('Consumer Disputes');
    }
    if (/police|fir|bail|fraud|theft|cyber|harassment|threat/i.test(descLower)) {
      suggestedPracticeAreas.push('Criminal Defense');
    }
    if (suggestedPracticeAreas.length === 0) {
      suggestedPracticeAreas.push('Civil Litigation', 'Consumer Disputes');
    }

    // Determine parties
    let clientRole = 'Aggrieved Complainant';
    let opposingParty = 'Counterparty';
    let disputeNature = 'Civil Dispute';

    if (/tenant|landlord|rent|deposit|lease/i.test(descLower)) {
      if (/landlord|rent|deposit/i.test(descLower) && !descLower.includes('my tenant')) {
        clientRole = 'Tenant';
        opposingParty = 'Landlord / Property Owner';
      } else {
        clientRole = 'Property Owner';
        opposingParty = 'Tenant';
      }
      disputeNature = 'Tenancy and Security Deposit Dispute';
    } else if (/employer|salary|job/i.test(descLower)) {
      clientRole = 'Employee';
      opposingParty = 'Employer / Corporate Entity';
      disputeNature = 'Employment & Wage Dispute';
    } else if (/consumer|refund|defective/i.test(descLower)) {
      clientRole = 'Consumer';
      opposingParty = 'Service Provider / Manufacturer';
      disputeNature = 'Deficiency in Goods/Services';
    } else if (/cheque|loan|debt/i.test(descLower)) {
      clientRole = 'Creditor / Account Holder';
      opposingParty = 'Debtor / Issuer';
      disputeNature = 'Negotiable Instruments & Financial Default';
    }

    const partiesInvolved: PartiesInvolved = {
      client_role: clientRole,
      opposing_party: opposingParty,
      dispute_nature: disputeNature,
    };

    // Determine key relief sought
    let keyRelief = 'Recovery of dues and legal notice issuance.';
    if (/deposit|refund|return/i.test(descLower)) {
      keyRelief = 'Immediate refund of withheld security deposit/funds along with applicable statutory interest.';
    } else if (/evict|stay/i.test(descLower)) {
      keyRelief = 'Injunction against unlawful eviction and preservation of status quo.';
    } else if (/divorce|separation/i.test(descLower)) {
      keyRelief = 'Mutual settlement agreement and appropriate decree.';
    } else if (/cheque|138/i.test(descLower)) {
      keyRelief = 'Issuance of formal statutory demand notice under Section 138 NI Act.';
    }

    const factsSummary = `Factual Case Brief: ${raw_problem_description.trim()} The dispute involves ${clientRole} against ${opposingParty} concerning ${disputeNature}.`;

    // 3. Save AI summary
    this.db
      .prepare(`
        INSERT INTO ai_intake_summaries (
          id, intake_id, facts_summary, parties_involved, key_relief_sought,
          suggested_practice_areas, disclaimer_accepted, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `)
      .run(
        summaryId,
        intakeId,
        factsSummary,
        JSON.stringify(partiesInvolved),
        keyRelief,
        JSON.stringify(suggestedPracticeAreas)
      );

    const now = new Date().toISOString();

    return {
      id: summaryId,
      intake_id: intakeId,
      facts_summary: factsSummary,
      parties_involved: partiesInvolved,
      key_relief_sought: keyRelief,
      suggested_practice_areas: suggestedPracticeAreas,
      disclaimer_accepted: true,
      statutory_disclaimer: STATUTORY_DISCLAIMER,
      created_at: now,
    };
  }

  public getIntakeSummary(intakeId: string): AIIntakeSummaryResponse {
    const summaryRow = this.db
      .prepare('SELECT * FROM ai_intake_summaries WHERE intake_id = ?')
      .get(intakeId) as
      | {
          id: string;
          intake_id: string;
          facts_summary: string;
          parties_involved: string;
          key_relief_sought: string;
          suggested_practice_areas: string;
          disclaimer_accepted: number;
          created_at: string;
        }
      | undefined;

    if (!summaryRow) {
      throw new AppError(404, 'NOT_FOUND', `Intake summary not found for intake id: ${intakeId}`);
    }

    return {
      id: summaryRow.id,
      intake_id: summaryRow.intake_id,
      facts_summary: summaryRow.facts_summary,
      parties_involved: JSON.parse(summaryRow.parties_involved),
      key_relief_sought: summaryRow.key_relief_sought,
      suggested_practice_areas: JSON.parse(summaryRow.suggested_practice_areas),
      disclaimer_accepted: Boolean(summaryRow.disclaimer_accepted),
      statutory_disclaimer: STATUTORY_DISCLAIMER,
      created_at: summaryRow.created_at,
    };
  }

  public getIntakePracticeAreas(intakeId: string): string[] {
    const summary = this.getIntakeSummary(intakeId);
    return summary.suggested_practice_areas;
  }
}

export const intakeService = new IntakeService();
