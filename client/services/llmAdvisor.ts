import { callAPIWithRetry, API_CONFIG } from './api.client';
import { GearItemWithCalculated, WeightBreakdown, ULStatus } from '../utils/types';

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SuggestedEdit {
  gearId: string;
  gearName: string;
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
}

export interface AdvisorResponse {
  message: string;
  suggestedEdits: SuggestedEdit[];
}

export interface GearAdvisorContext {
  items: GearItemWithCalculated[];
  weightBreakdown?: WeightBreakdown | null;
  ulStatus?: ULStatus | null;
}

/**
 * ギアアドバイザーAPIを呼び出す
 */
export async function callAdvisor(
  conversation: AdvisorMessage[],
  gearContext: GearAdvisorContext
): Promise<AdvisorResponse> {
  const response = await callAPIWithRetry(
    '/llm/advisor',
    { conversation, gearContext },
    API_CONFIG.timeout.heavy
  );
  return response.data as AdvisorResponse;
}
