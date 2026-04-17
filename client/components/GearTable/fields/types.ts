/**
 * EditableFields 系で共通利用する型定義。
 */

/** 変更検知フラグを受け取るフィールドの共通プロパティ */
export interface BaseFieldProps {
  /** 未保存変更の可視化に使うフラグ（true なら赤枠・赤文字） */
  isChanged?: boolean
}

/** 価格表示の通貨単位 */
export type Currency = 'JPY' | 'USD'
