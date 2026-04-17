import { useCallback, useEffect, useRef, useState } from 'react'
import { convertFromGrams, convertToGrams } from '../utils/weightUnit'
import { useWeightUnit } from '../contexts/WeightUnitContext'

/**
 * フォーム入力用の重量フィールドを単位対応にするフック。
 * - 内部はグラム保存（DB と整合）
 * - 表示は現在単位（g/oz）
 * - 単位切替時は入力中の値を再換算してユーザー入力を保持
 *
 * 使い方:
 *   const { inputValue, setInputValue, toGrams, unit } = useWeightInput(initialGrams)
 *   <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
 *   // 保存時: toGrams()
 */
export function useWeightInput(initialGrams: number | null | undefined) {
  const { unit } = useWeightUnit()
  const [inputValue, setInputValue] = useState<string>(() =>
    initialGrams != null ? String(convertFromGrams(initialGrams, unit)) : ''
  )
  const prevUnitRef = useRef(unit)
  const initialGramsRef = useRef(initialGrams)

  // initialGrams が変わったら（例: 編集対象の切替）再初期化
  useEffect(() => {
    if (initialGrams !== initialGramsRef.current) {
      initialGramsRef.current = initialGrams
      setInputValue(initialGrams != null ? String(convertFromGrams(initialGrams, unit)) : '')
    }
  }, [initialGrams, unit])

  // 単位切替時: 入力中の値を再換算（ユーザー入力を捨てない）
  useEffect(() => {
    if (prevUnitRef.current !== unit) {
      setInputValue(current => {
        if (!current) return current
        const num = parseFloat(current)
        if (isNaN(num)) return current
        const grams = convertToGrams(num, prevUnitRef.current)
        return grams > 0 ? String(convertFromGrams(grams, unit)) : ''
      })
      prevUnitRef.current = unit
    }
  }, [unit])

  const toGrams = useCallback((): number | undefined => {
    if (!inputValue) return undefined
    const num = parseFloat(inputValue)
    if (isNaN(num)) return undefined
    return convertToGrams(num, unit)
  }, [inputValue, unit])

  return { inputValue, setInputValue, toGrams, unit }
}
