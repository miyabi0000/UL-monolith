/**
 * アドバイザーAPI 型定義
 * client/services/llmAdvisor.ts と対応する型をサーバー側で定義
 */

export type AdvisorRole = 'user' | 'assistant';

export interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

export interface GearItem {
  id: string;
  name: string;
  brand?: string;
  weightGrams?: number;
  priceCents?: number;
  weightClass?: string;
  isInKit?: boolean;
  category?: { name: string } | null;
}

export interface WeightBreakdown {
  baseWeight?: number;
  big3?: number;
}

export interface ULStatus {
  classification?: string;
}

export interface GearContext {
  items: GearItem[];
  weightBreakdown?: WeightBreakdown | null;
  ulStatus?: ULStatus | null;
  packName?: string | null;
}

export interface AdvisorRequestBody {
  conversation?: unknown;
  gearContext?: unknown;
}

export interface SuggestedEdit {
  gearId: string;
  gearName: string;
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
}

export interface GearRef {
  gearId: string;
  gearName: string;
}

export interface AdvisorResponseData {
  message: string;
  gearRefs: GearRef[];
  suggestedEdits: SuggestedEdit[];
}
