import { useState, useRef, useEffect, useCallback } from 'react'

interface UseDebouncedInputOptions<T> {
  value: T
  onChange: (value: T) => void
  delay?: number
  serialize?: (value: T) => string
  deserialize?: (input: string) => T
}

export function useDebouncedInput<T>({
  value,
  onChange,
  delay = 300,
  serialize = (v) => String(v ?? ''),
  deserialize = (s) => s as unknown as T
}: UseDebouncedInputOptions<T>) {
  // 関数参照を安定化（無限ループ防止）
  const serializeRef = useRef(serialize)
  const deserializeRef = useRef(deserialize)
  const onChangeRef = useRef(onChange)
  serializeRef.current = serialize
  deserializeRef.current = deserialize
  onChangeRef.current = onChange

  const [localValue, setLocalValue] = useState(() => serializeRef.current(value))
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 親の値が変わったらローカル値を同期（フォーカス中でない場合のみ）
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(serializeRef.current(value))
    }
  }, [value, isFocused])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleChange = useCallback((inputValue: string) => {
    setLocalValue(inputValue)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onChangeRef.current(deserializeRef.current(inputValue))
    }, delay)
  }, [delay])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    const deserialized = deserializeRef.current(localValue)
    if (deserialized !== value) {
      onChangeRef.current(deserialized)
    }
  }, [localValue, value])

  return { localValue, handleChange, handleFocus, handleBlur }
}
