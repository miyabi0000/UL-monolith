import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  profileSchema,
  packSchema,
  categorySchema,
  gearItemSchema,
  bulkUpdateSchema,
  imageInputSchema,
  chatMessageSchema,
} from '../index';

describe('emailSchema', () => {
  it('正常な email を受理する', () => {
    const r = emailSchema.safeParse({ email: 'user@example.com' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('user@example.com');
  });

  it('空文字を弾く', () => {
    const r = emailSchema.safeParse({ email: '' });
    expect(r.success).toBe(false);
  });

  it('前後空白を trim する', () => {
    const r = emailSchema.safeParse({ email: '  user@example.com  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('user@example.com');
  });

  it('不正フォーマットを弾く', () => {
    const r = emailSchema.safeParse({ email: 'abc' });
    expect(r.success).toBe(false);
  });

  it('254 文字超を弾く', () => {
    const long = 'a'.repeat(244) + '@x.com'; // 250 chars OK
    const tooLong = 'a'.repeat(250) + '@x.com'; // 256 chars NG
    expect(emailSchema.safeParse({ email: long }).success).toBe(true);
    expect(emailSchema.safeParse({ email: tooLong }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  const valid = {
    headerTitle: 'Hi',
    headerImageUrl: '',
    displayName: 'Tarou',
    handle: '@tarou_01',
    bio: '',
  };

  it('正常入力を受理する', () => {
    const r = profileSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('displayName 必須', () => {
    const r = profileSchema.safeParse({ ...valid, displayName: '' });
    expect(r.success).toBe(false);
  });

  it('handle に許可外文字を弾く', () => {
    const r = profileSchema.safeParse({ ...valid, handle: '@山田!' });
    expect(r.success).toBe(false);
  });

  it('handle は @ なしも受理（regex は @? ）', () => {
    const r = profileSchema.safeParse({ ...valid, handle: 'tarou' });
    expect(r.success).toBe(true);
  });

  it('headerImageUrl: http(s) を受理、ftp を弾く', () => {
    expect(
      profileSchema.safeParse({ ...valid, headerImageUrl: 'https://x.com/a.png' }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...valid, headerImageUrl: 'ftp://x.com/a.png' }).success,
    ).toBe(false);
  });

  it('headerImageUrl: data:image base64 を受理', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
    const r = profileSchema.safeParse({ ...valid, headerImageUrl: dataUri });
    expect(r.success).toBe(true);
  });

  it('headerImageUrl: 137,000 文字超の data URI を弾く', () => {
    const over = 'data:image/png;base64,' + 'A'.repeat(137_001);
    const r = profileSchema.safeParse({ ...valid, headerImageUrl: over });
    expect(r.success).toBe(false);
  });

  it('displayName 50 文字境界', () => {
    expect(
      profileSchema.safeParse({ ...valid, displayName: 'a'.repeat(50) }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...valid, displayName: 'a'.repeat(51) }).success,
    ).toBe(false);
  });

  it('bio 280 文字境界', () => {
    expect(
      profileSchema.safeParse({ ...valid, bio: 'a'.repeat(280) }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...valid, bio: 'a'.repeat(281) }).success,
    ).toBe(false);
  });
});

describe('packSchema', () => {
  it('name 必須', () => {
    expect(packSchema.safeParse({ name: '', routeName: '', description: '' }).success).toBe(
      false,
    );
  });

  it('name 80 文字境界', () => {
    expect(
      packSchema.safeParse({
        name: 'a'.repeat(80),
        routeName: '',
        description: '',
      }).success,
    ).toBe(true);
    expect(
      packSchema.safeParse({
        name: 'a'.repeat(81),
        routeName: '',
        description: '',
      }).success,
    ).toBe(false);
  });

  it('routeName 200 / description 500 を受理、超過を弾く', () => {
    expect(
      packSchema.safeParse({
        name: 'X',
        routeName: 'a'.repeat(200),
        description: 'a'.repeat(500),
      }).success,
    ).toBe(true);
    expect(
      packSchema.safeParse({
        name: 'X',
        routeName: 'a'.repeat(201),
        description: '',
      }).success,
    ).toBe(false);
  });

  it('空文字は undefined に変換される', () => {
    const r = packSchema.safeParse({ name: 'X', routeName: '', description: '' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.routeName).toBeUndefined();
      expect(r.data.description).toBeUndefined();
    }
  });
});

describe('categorySchema', () => {
  it('和カラーパレット内の色を受理する', () => {
    // Asagi の hex
    const r = categorySchema.safeParse({ name: 'Hydration', color: '#00BCC9' });
    expect(r.success).toBe(true);
  });

  it('パレット外の色を弾く', () => {
    const r = categorySchema.safeParse({ name: 'X', color: '#123456' });
    expect(r.success).toBe(false);
  });

  it('name 50 文字境界', () => {
    expect(
      categorySchema.safeParse({ name: 'a'.repeat(50), color: '#00BCC9' }).success,
    ).toBe(true);
    expect(
      categorySchema.safeParse({ name: 'a'.repeat(51), color: '#00BCC9' }).success,
    ).toBe(false);
  });
});

describe('gearItemSchema', () => {
  const base = {
    name: 'Tent',
    requiredQuantity: 1,
    ownedQuantity: 1,
    weightClass: 'base' as const,
    weightConfidence: 'low' as const,
    weightSource: 'manual' as const,
    priority: 3,
    isInKit: true,
  };

  it('最小構成を受理する', () => {
    expect(gearItemSchema.safeParse(base).success).toBe(true);
  });

  it('weightGrams 範囲: 0-10000 を受理、超過を弾く', () => {
    expect(gearItemSchema.safeParse({ ...base, weightGrams: 0 }).success).toBe(true);
    expect(gearItemSchema.safeParse({ ...base, weightGrams: 10_000 }).success).toBe(true);
    expect(gearItemSchema.safeParse({ ...base, weightGrams: 10_001 }).success).toBe(false);
    expect(gearItemSchema.safeParse({ ...base, weightGrams: -1 }).success).toBe(false);
  });

  it('priority 範囲 1-5', () => {
    expect(gearItemSchema.safeParse({ ...base, priority: 1 }).success).toBe(true);
    expect(gearItemSchema.safeParse({ ...base, priority: 5 }).success).toBe(true);
    expect(gearItemSchema.safeParse({ ...base, priority: 0 }).success).toBe(false);
    expect(gearItemSchema.safeParse({ ...base, priority: 6 }).success).toBe(false);
  });

  it('priceCents 上限 10,000,000', () => {
    expect(gearItemSchema.safeParse({ ...base, priceCents: 10_000_000 }).success).toBe(true);
    expect(gearItemSchema.safeParse({ ...base, priceCents: 10_000_001 }).success).toBe(false);
  });

  it('productUrl: http(s) のみ受理', () => {
    expect(
      gearItemSchema.safeParse({ ...base, productUrl: 'https://amazon.co.jp/item' }).success,
    ).toBe(true);
    expect(gearItemSchema.safeParse({ ...base, productUrl: 'ftp://x.com' }).success).toBe(
      false,
    );
    expect(gearItemSchema.safeParse({ ...base, productUrl: 'not a url' }).success).toBe(
      false,
    );
  });

  it('weightGrams 空文字は null に変換', () => {
    const r = gearItemSchema.safeParse({ ...base, weightGrams: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.weightGrams).toBeNull();
  });

  it('weightGrams NaN 文字を弾く', () => {
    const r = gearItemSchema.safeParse({ ...base, weightGrams: 'abc' });
    expect(r.success).toBe(false);
  });
});

describe('bulkUpdateSchema', () => {
  it('category: 値必須', () => {
    expect(bulkUpdateSchema.safeParse({ field: 'category', value: '' }).success).toBe(false);
    expect(
      bulkUpdateSchema.safeParse({ field: 'category', value: 'cat-1' }).success,
    ).toBe(true);
  });

  it('priority: 1-5 のみ受理', () => {
    expect(bulkUpdateSchema.safeParse({ field: 'priority', value: '3' }).success).toBe(true);
    expect(bulkUpdateSchema.safeParse({ field: 'priority', value: '0' }).success).toBe(false);
    expect(bulkUpdateSchema.safeParse({ field: 'priority', value: '6' }).success).toBe(false);
  });

  it('owned: 0-100', () => {
    expect(bulkUpdateSchema.safeParse({ field: 'owned', value: '0' }).success).toBe(true);
    expect(bulkUpdateSchema.safeParse({ field: 'owned', value: '100' }).success).toBe(true);
    expect(bulkUpdateSchema.safeParse({ field: 'owned', value: '101' }).success).toBe(false);
  });

  it('weight: 数値変換 + 範囲', () => {
    expect(bulkUpdateSchema.safeParse({ field: 'weight', value: '500' }).success).toBe(true);
    expect(bulkUpdateSchema.safeParse({ field: 'weight', value: '' }).success).toBe(false);
    expect(bulkUpdateSchema.safeParse({ field: 'weight', value: 'abc' }).success).toBe(false);
  });

  it('seasons: 最低 1 つ', () => {
    expect(bulkUpdateSchema.safeParse({ field: 'seasons', value: [] }).success).toBe(false);
    expect(
      bulkUpdateSchema.safeParse({ field: 'seasons', value: ['summer'] }).success,
    ).toBe(true);
  });

  it('seasons: 不正値を弾く', () => {
    const r = bulkUpdateSchema.safeParse({ field: 'seasons', value: ['monsoon'] });
    expect(r.success).toBe(false);
  });

  it('未知の field を弾く', () => {
    const r = bulkUpdateSchema.safeParse({ field: 'unknown', value: 'x' });
    expect(r.success).toBe(false);
  });
});

describe('imageInputSchema', () => {
  it('空を受理（クリア許容）', () => {
    const r = imageInputSchema.safeParse({ imageUrl: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.imageUrl).toBeUndefined();
  });

  it('http(s) URL を受理', () => {
    expect(
      imageInputSchema.safeParse({ imageUrl: 'https://example.com/i.png' }).success,
    ).toBe(true);
  });

  it('data:image を受理', () => {
    expect(
      imageInputSchema.safeParse({
        imageUrl: 'data:image/jpeg;base64,/9j/4AAQ==',
      }).success,
    ).toBe(true);
  });

  it('javascript: スキームを弾く', () => {
    expect(
      imageInputSchema.safeParse({ imageUrl: 'javascript:alert(1)' }).success,
    ).toBe(false);
  });
});

describe('chatMessageSchema', () => {
  it('空白のみを弾く', () => {
    expect(chatMessageSchema.safeParse({ text: '   ' }).success).toBe(false);
  });

  it('trim 後 1 文字以上を受理', () => {
    const r = chatMessageSchema.safeParse({ text: '  hi  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.text).toBe('hi');
  });

  it('2000 文字境界', () => {
    expect(chatMessageSchema.safeParse({ text: 'a'.repeat(2000) }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ text: 'a'.repeat(2001) }).success).toBe(false);
  });
});
