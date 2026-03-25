import { API_CONFIG, callAPIWithRetry } from './api.client';
import { GearItemWithCalculated, ULStatus, WeightBreakdown } from '../utils/types';

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SuggestedEdit {
  gearId: string;
  gearName: string;
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
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
