import { describe, it, expect } from 'vitest'
import { formatChartValue, formatChartAxisValue, getPayloadUnit } from '../formatters'

describe('formatChartValue', () => {
  describe('cost モード', () => {
    it('1000円 相当は ¥ 付き 3 桁区切り', () => {
      expect(formatChartValue(100000, 'cost')).toBe('¥1,000')
    })

    it('compact=true で 10000 円以上は 万 表示', () => {
      expect(formatChartValue(1500000, 'cost', 'g', { compact: true })).toBe('¥1.5万')
    })

    it('compact=true でも 10000 円未満は通常表示', () => {
      expect(formatChartValue(500000, 'cost', 'g', { compact: true })).toBe('¥5,000')
    })
  })

  describe('weight モード (g)', () => {
    it('compact=true で 1000g 以上は kg 表示', () => {
      expect(formatChartValue(1500, 'weight', 'g', { compact: true })).toBe('1.5kg')
    })

    it('compact=true で 1000g 未満は g', () => {
      expect(formatChartValue(500, 'weight', 'g', { compact: true })).toBe('500g')
    })
  })

  describe('weight モード (oz)', () => {
    it('compact=true で 16oz 以上は lb 表示', () => {
      // 1000g ≒ 35.27oz ≒ 2.2lb
      const result = formatChartValue(1000, 'weight', 'oz', { compact: true })
      expect(result).toMatch(/lb$/)
    })
  })
})

describe('formatChartAxisValue (旧互換エイリアス)', () => {
  it('compact: true と同じ結果', () => {
    expect(formatChartAxisValue(1500, 'weight', 'g')).toBe(
      formatChartValue(1500, 'weight', 'g', { compact: true }),
    )
  })
})

describe('getPayloadUnit', () => {
  it('cost は ¥', () => {
    expect(getPayloadUnit('cost', 'g')).toBe('¥')
  })

  it('weight は unit 引数', () => {
    expect(getPayloadUnit('weight', 'g')).toBe('g')
    expect(getPayloadUnit('weight', 'oz')).toBe('oz')
  })

  it('weight-class は unit 引数 (cost ではない)', () => {
    expect(getPayloadUnit('weight-class', 'g')).toBe('g')
  })
})
