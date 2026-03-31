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

/** AIがメッセージ中で言及した特定ギアへの参照 */
export interface GearRef {
  gearId: string;
  gearName: string;
}

export interface AdvisorResponse {
  message: string;
  suggestedEdits: SuggestedEdit[];
  /** レスポンス内で言及されたギアの一覧（クリックでリストにフォーカス可能） */
  gearRefs: GearRef[];
}

export interface GearAdvisorContext {
  items: GearItemWithCalculated[];
  weightBreakdown?: WeightBreakdown | null;
  ulStatus?: ULStatus | null;
  /** 選択中パックの名前（nullなら全ギアスコープ） */
  packName?: string | null;
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
