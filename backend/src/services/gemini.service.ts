import { GoogleGenAI, Type } from '@google/genai';
import {
  IAiAnalysisResult,
  IReportInputForAi,
  AiCategory,
  AiUrgency,
  AiRecommendedAction,
} from '../types/ai.types';
import {
  REPORT_ANALYSIS_SYSTEM_INSTRUCTION,
  buildReportAnalysisPrompt,
} from '../prompts/report-analysis.prompt';

const VALID_CATEGORIES: AiCategory[] = [
  'INFRASTRUCTURE',
  'SAFETY',
  'ENVIRONMENT',
  'TRAFFIC',
  'PUBLIC_SERVICE',
  'OTHER',
];

const VALID_URGENCIES: AiUrgency[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const VALID_ACTIONS: AiRecommendedAction[] = [
  'NO_ACTION',
  'NEEDS_MORE_INFORMATION',
  'HUMAN_VERIFICATION',
];

/**
 * Structured schema definition for Gemini 3.5 Flash-Lite JSON output
 */
const reportAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Neutral 1-3 sentence factual summary preserving original meaning.',
    },
    category: {
      type: Type.STRING,
      enum: VALID_CATEGORIES,
      description: 'Single best-fit civic incident category.',
    },
    urgency: {
      type: Type.STRING,
      enum: VALID_URGENCIES,
      description: 'Incident urgency level based strictly on the civic or safety hazard.',
    },
    specificity: {
      type: Type.INTEGER,
      description: 'Granularity score from 0 (extremely vague) to 100 (rich, specific details). NOT a truth score.',
    },
    keyClaims: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of atomic factual observations reported by the citizen.',
    },
    missingInformation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific missing context or evidence that would aid human verification.',
    },
    suspiciousSignals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Vague, contradictory, or sensational signals deserving reviewer attention.',
    },
    recommendedAction: {
      type: Type.STRING,
      enum: VALID_ACTIONS,
      description: 'Workflow routing recommendation for human dispatch/verification.',
    },
  },
  required: [
    'summary',
    'category',
    'urgency',
    'specificity',
    'keyClaims',
    'missingInformation',
    'suspiciousSignals',
    'recommendedAction',
  ],
};

export class GeminiService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error('GEMINI_API_KEY is not configured in backend environment');
    }
    return new GoogleGenAI({ apiKey });
  }

  public getModelName(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  }

  /**
   * Calls Gemini 3.5 Flash-Lite with structured JSON output to analyze a citizen report.
   */
  public async analyzeReport(report: IReportInputForAi): Promise<IAiAnalysisResult> {
    const ai = this.getClient();
    const model = this.getModelName();
    const prompt = buildReportAnalysisPrompt(report);

    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: REPORT_ANALYSIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: reportAnalysisSchema,
          temperature: 0.1, // Low temperature for deterministic, factual extraction
        },
      });
    } catch (apiError: any) {
      // Safe backend logging without leaking secrets
      console.error(
        `Gemini API request failed for report "${report.title}":`,
        apiError.message || 'Unknown Gemini API error'
      );
      throw new Error(
        `Gemini API execution failure: ${apiError.message || 'Service unavailable'}`
      );
    }

    if (!response || !response.text) {
      throw new Error('Gemini API returned an empty or invalid response');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(response.text);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', response.text);
      throw new Error('Gemini response could not be parsed as valid JSON');
    }

    // Validate structured output fields
    const validated = this.validateAndNormalizeOutput(parsed);
    return validated;
  }

  /**
   * Validates and normalizes structured output from the model.
   */
  private validateAndNormalizeOutput(data: any): IAiAnalysisResult {
    if (!data || typeof data !== 'object') {
      throw new Error('AI analysis payload is not an object');
    }

    const summary =
      typeof data.summary === 'string' && data.summary.trim()
        ? data.summary.trim()
        : 'Summary could not be generated.';

    const category: AiCategory = VALID_CATEGORIES.includes(data.category)
      ? data.category
      : 'OTHER';

    const urgency: AiUrgency = VALID_URGENCIES.includes(data.urgency)
      ? data.urgency
      : 'MEDIUM';

    // Clamp specificity between 0 and 100
    const rawSpecificity = Number(data.specificity);
    const specificity = Number.isFinite(rawSpecificity)
      ? Math.max(0, Math.min(100, Math.round(rawSpecificity)))
      : 50;

    const keyClaims = Array.isArray(data.keyClaims)
      ? data.keyClaims.filter((c: any) => typeof c === 'string' && c.trim()).map((c: string) => c.trim())
      : [];

    const missingInformation = Array.isArray(data.missingInformation)
      ? data.missingInformation.filter((m: any) => typeof m === 'string' && m.trim()).map((m: string) => m.trim())
      : [];

    const suspiciousSignals = Array.isArray(data.suspiciousSignals)
      ? data.suspiciousSignals.filter((s: any) => typeof s === 'string' && s.trim()).map((s: string) => s.trim())
      : [];

    const recommendedAction: AiRecommendedAction = VALID_ACTIONS.includes(data.recommendedAction)
      ? data.recommendedAction
      : 'HUMAN_VERIFICATION';

    return {
      summary,
      category,
      urgency,
      specificity,
      keyClaims,
      missingInformation,
      suspiciousSignals,
      recommendedAction,
    };
  }
}

export const geminiService = new GeminiService();
export default geminiService;
