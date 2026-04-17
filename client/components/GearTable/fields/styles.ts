import { STATUS_TONES } from '../../../utils/designSystem'

/**
 * EditableFields 系で共通利用するカラートーン。
 * - ERROR_TONE: 変更あり（未保存）の赤枠・赤文字
 * - SUCCESS_TONE: 所持数が必要数に達した時の強調
 */
export const ERROR_TONE = STATUS_TONES.error
export const SUCCESS_TONE = STATUS_TONES.success

/** 変更時の枠線インラインスタイル。`isChanged` が true の場合に適用する。 */
export const changedBorderStyle = { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } as const

/** 変更時の枠線のみ（color 上書きなし） */
export const changedBorderOnly = { borderColor: ERROR_TONE.solid } as const
