import { Pool } from 'pg';
import { GearItem, Category, GearItemWithCalculated, WeightBreakdown, deriveStatus } from '../../client/utils/types';

/**
 * PostgreSQL データベース接続とクエリ実行
 */
class DatabaseConnection {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      database: process.env.DB_NAME || 'gear_manager',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * ギアアイテムをJOINで効率的に取得
   */
  async getGearWithCategories(
    userId: string,
    filters?: {
      categoryIds?: string[];
      priorities?: number[];
      seasons?: string[];
      search?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    },
    sort?: {
      field: 'name' | 'weight_grams' | 'price_cents' | 'priority' | 'created_at';
      order: 'ASC' | 'DESC';
    }
  ): Promise<{ items: GearItemWithCalculated[]; total: number }> {
    let query = `
      SELECT
        g.id, g.user_id, g.category_id, g.name, g.brand, g.product_url, g.image_url,
        g.required_quantity, g.owned_quantity, g.weight_grams, g.price_cents,
        g.weight_class, g.weight_confidence, g.weight_source, g.is_in_kit,
        g.seasons, g.priority, g.llm_data, g.created_at, g.updated_at,
        c.id as cat_id, c.name as cat_name, c.path as cat_path,
        c.color as cat_color, c.tags as cat_tags, c.created_at as cat_created_at,
        -- 計算フィールド
        (g.required_quantity - g.owned_quantity) as shortage,
        (g.weight_grams * g.required_quantity) as total_weight,
        (g.price_cents * g.required_quantity) as total_price,
        GREATEST(0, g.required_quantity - g.owned_quantity) as missing_quantity
      FROM gear_items g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    // フィルタ条件の追加
    if (filters?.categoryIds?.length) {
      query += ` AND g.category_id = ANY($${paramIndex})`;
      params.push(filters.categoryIds);
      paramIndex++;
    }

    if (filters?.priorities?.length) {
      query += ` AND g.priority = ANY($${paramIndex})`;
      params.push(filters.priorities);
      paramIndex++;
    }

    if (filters?.seasons?.length) {
      query += ` AND g.seasons && $${paramIndex}`; // Array overlap operator
      params.push(filters.seasons);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (g.name ILIKE $${paramIndex} OR g.brand ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // カウントクエリ（ページネーション用）
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    );

    // ソート
    if (sort) {
      query += ` ORDER BY g.${sort.field} ${sort.order}`;
    } else {
      query += ` ORDER BY g.name ASC`;
    }

    // ページネーション
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pagination.limit, offset);
    }

    try {
      const [itemsResult, countResult] = await Promise.all([
        this.pool.query(query, params),
        this.pool.query(countQuery, params.slice(0, paramIndex - (pagination ? 2 : 0)))
      ]);

      const items: GearItemWithCalculated[] = itemsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        brand: row.brand,
        productUrl: row.product_url,
        imageUrl: row.image_url,
        requiredQuantity: row.required_quantity,
        ownedQuantity: row.owned_quantity,
        weightClass: row.weight_class || 'base',
        weightGrams: row.weight_grams,
        weightConfidence: row.weight_confidence || 'low',
        weightSource: row.weight_source || 'manual',
        priceCents: row.price_cents,
        seasons: row.seasons,
        priority: row.priority,
        isInKit: row.is_in_kit ?? true,
        llmData: row.llm_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // 計算フィールド
        shortage: row.shortage,
        totalWeight: row.total_weight,
        totalPrice: row.total_price,
        missingQuantity: row.missing_quantity,
        procurementStatus: deriveStatus(row.required_quantity, row.owned_quantity),
        // カテゴリ情報
        category: row.cat_id ? {
          id: row.cat_id,
          name: row.cat_name,
          path: row.cat_path,
          color: row.cat_color,
          tags: row.cat_tags || [],
          createdAt: row.cat_created_at
        } : undefined
      }));

      const total = parseInt(countResult.rows[0]?.total || '0');

      return { items, total };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch gear items');
    }
  }

  /**
   * 単一ギアアイテムを取得
   */
  async getGearById(id: string, userId: string): Promise<GearItemWithCalculated | null> {
    const query = `
      SELECT
        g.id, g.user_id, g.category_id, g.name, g.brand, g.product_url, g.image_url,
        g.required_quantity, g.owned_quantity, g.weight_grams, g.price_cents,
        g.weight_class, g.weight_confidence, g.weight_source, g.is_in_kit,
        g.seasons, g.priority, g.llm_data, g.created_at, g.updated_at,
        c.id as cat_id, c.name as cat_name, c.path as cat_path,
        c.color as cat_color, c.tags as cat_tags, c.created_at as cat_created_at,
        -- 計算フィールド
        (g.required_quantity - g.owned_quantity) as shortage,
        (g.weight_grams * g.required_quantity) as total_weight,
        (g.price_cents * g.required_quantity) as total_price,
        GREATEST(0, g.required_quantity - g.owned_quantity) as missing_quantity
      FROM gear_items g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.id = $1 AND g.user_id = $2
    `;

    try {
      const result = await this.pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        brand: row.brand,
        productUrl: row.product_url,
        imageUrl: row.image_url,
        requiredQuantity: row.required_quantity,
        ownedQuantity: row.owned_quantity,
        weightClass: row.weight_class || 'base',
        weightGrams: row.weight_grams,
        weightConfidence: row.weight_confidence || 'low',
        weightSource: row.weight_source || 'manual',
        priceCents: row.price_cents,
        seasons: row.seasons,
        priority: row.priority,
        isInKit: row.is_in_kit ?? true,
        llmData: row.llm_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // 計算フィールド
        shortage: row.shortage,
        totalWeight: row.total_weight,
        totalPrice: row.total_price,
        missingQuantity: row.missing_quantity,
        procurementStatus: deriveStatus(row.required_quantity, row.owned_quantity),
        // カテゴリ情報
        category: row.cat_id ? {
          id: row.cat_id,
          name: row.cat_name,
          path: row.cat_path,
          color: row.cat_color,
          tags: row.cat_tags || [],
          createdAt: row.cat_created_at
        } : undefined
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch gear item');
    }
  }

  /**
   * 分析データを効率的に取得（集計クエリ使用）
   */
  async getAnalyticsSummary(userId: string): Promise<{
    totalWeight: number;
    totalPrice: number;
    totalItems: number;
    missingItems: number;
    chartData: Array<{
      name: string;
      value: number;
      color: string;
      items: GearItemWithCalculated[];
    }>;
  }> {
    // 集計クエリで効率的に計算
    const summaryQuery = `
      SELECT 
        SUM(g.weight_grams * g.required_quantity) as total_weight,
        SUM(g.price_cents * g.required_quantity) as total_price,
        COUNT(*) as total_items,
        SUM(CASE WHEN g.required_quantity > g.owned_quantity THEN 1 ELSE 0 END) as missing_items
      FROM gear_items g
      WHERE g.user_id = $1
    `;

    // カテゴリ別データ
    const categoryQuery = `
      SELECT 
        COALESCE(c.name, 'Other') as category_name,
        COALESCE(c.color, '#6B7280') as category_color,
        SUM(g.weight_grams * g.required_quantity) as category_weight,
        json_agg(
          json_build_object(
            'id', g.id,
            'name', g.name,
            'brand', g.brand,
            'totalWeight', g.weight_grams * g.required_quantity,
            'shortage', g.required_quantity - g.owned_quantity
          )
        ) as items
      FROM gear_items g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.user_id = $1
      GROUP BY c.name, c.color
      ORDER BY category_weight DESC
    `;

    try {
      const [summaryResult, categoryResult] = await Promise.all([
        this.pool.query(summaryQuery, [userId]),
        this.pool.query(categoryQuery, [userId])
      ]);

      const summary = summaryResult.rows[0];
      const chartData = categoryResult.rows.map(row => ({
        name: row.category_name,
        value: parseFloat(row.category_weight || '0'),
        color: row.category_color,
        items: row.items
      }));

      return {
        totalWeight: parseFloat(summary.total_weight || '0'),
        totalPrice: parseFloat(summary.total_price || '0'),
        totalItems: parseInt(summary.total_items || '0'),
        missingItems: parseInt(summary.missing_items || '0'),
        chartData
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch analytics summary');
    }
  }

  /**
   * Weight Breakdown集計（データモデル仕様準拠）
   * すべての集計は is_in_kit=true を前提とする
   */
  async getWeightBreakdown(userId: string): Promise<WeightBreakdown> {
    const query = `
      SELECT
        -- Base Weight
        COALESCE(SUM(CASE WHEN g.weight_class = 'base' THEN g.weight_grams * g.owned_quantity ELSE 0 END), 0) as base_weight,
        -- Worn Weight
        COALESCE(SUM(CASE WHEN g.weight_class = 'worn' THEN g.weight_grams * g.owned_quantity ELSE 0 END), 0) as worn_weight,
        -- Consumables
        COALESCE(SUM(CASE WHEN g.weight_class = 'consumable' THEN g.weight_grams * g.owned_quantity ELSE 0 END), 0) as consumables,
        -- Big3 (categories with big3_* tags)
        COALESCE(SUM(
          CASE WHEN g.weight_class = 'base' AND c.tags && ARRAY['big3_pack', 'big3_shelter', 'big3_sleep']
          THEN g.weight_grams * g.owned_quantity ELSE 0 END
        ), 0) as big3
      FROM gear_items g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.user_id = $1 AND g.is_in_kit = true AND g.weight_grams IS NOT NULL
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      const row = result.rows[0];

      const baseWeight = parseInt(row.base_weight || '0');
      const wornWeight = parseInt(row.worn_weight || '0');
      const consumables = parseInt(row.consumables || '0');
      const big3 = parseInt(row.big3 || '0');

      return {
        baseWeight,
        wornWeight,
        consumables,
        packedWeight: baseWeight + consumables,
        skinOutWeight: baseWeight + wornWeight + consumables,
        big3
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch weight breakdown');
    }
  }

  /**
   * 一括削除（IN句使用）
   */
  async deleteGearItems(ids: string[], userId: string): Promise<number> {
    const query = `
      DELETE FROM gear_items 
      WHERE id = ANY($1) AND user_id = $2
    `;

    try {
      const result = await this.pool.query(query, [ids, userId]);
      return result.rowCount;
    } catch (error) {
      console.error('Database delete error:', error);
      throw new Error('Failed to delete gear items');
    }
  }

  /**
   * カテゴリ一覧取得
   */
  async getCategories(userId?: string): Promise<Category[]> {
    const query = `
      SELECT id, user_id, name, parent_id, path, color, tags, created_at
      FROM categories
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY path
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        parentId: row.parent_id,
        path: row.path,
        color: row.color,
        tags: row.tags || [],
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * カテゴリを作成
   */
  async createCategory(name: string, color: string, userId?: string, tags?: string[]): Promise<Category> {
    const query = `
      INSERT INTO categories (user_id, name, parent_id, path, color, tags)
      VALUES ($1, $2, $3, ARRAY[$2], $4, $5)
      RETURNING id, user_id, name, parent_id, path, color, tags, created_at
    `;

    try {
      const result = await this.pool.query(query, [userId || null, name, null, color, tags || []]);
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        parentId: row.parent_id,
        path: row.path,
        color: row.color,
        tags: row.tags || [],
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to create category');
    }
  }

  /**
   * カテゴリを更新
   */
  async updateCategory(id: string, updates: { name?: string; color?: string; tags?: string[] }): Promise<Category | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      setClauses.push(`path = ARRAY[$${paramIndex}]`);
      values.push(updates.name);
      paramIndex++;
    }

    if (updates.color !== undefined) {
      setClauses.push(`color = $${paramIndex}`);
      values.push(updates.color);
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}`);
      values.push(updates.tags);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE categories
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, name, parent_id, path, color, tags, created_at
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        parentId: row.parent_id,
        path: row.path,
        color: row.color,
        tags: row.tags || [],
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to update category');
    }
  }

  /**
   * カテゴリを削除
   */
  async deleteCategory(id: string): Promise<boolean> {
    const query = `DELETE FROM categories WHERE id = $1`;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to delete category');
    }
  }

  /**
   * ギアアイテムを作成
   */
  async createGearItem(gear: any, userId: string): Promise<GearItem> {
    const query = `
      INSERT INTO gear_items (
        user_id, category_id, name, brand, product_url, image_url,
        required_quantity, owned_quantity, weight_class, weight_grams,
        weight_confidence, weight_source, price_cents, seasons, priority, is_in_kit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, user_id, category_id, name, brand, product_url, image_url,
                required_quantity, owned_quantity, weight_class, weight_grams,
                weight_confidence, weight_source, price_cents, seasons, priority,
                is_in_kit, created_at, updated_at
    `;

    try {
      const result = await this.pool.query(query, [
        userId,
        gear.categoryId || null,
        gear.name,
        gear.brand || null,
        gear.productUrl || null,
        gear.imageUrl || null,
        gear.requiredQuantity || 1,
        gear.ownedQuantity || 0,
        gear.weightClass || 'base',
        gear.weightGrams || null,
        gear.weightConfidence || 'low',
        gear.weightSource || 'manual',
        gear.priceCents || null,
        gear.seasons || null,
        gear.priority || 3,
        gear.isInKit ?? true
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        brand: row.brand,
        productUrl: row.product_url,
        imageUrl: row.image_url,
        requiredQuantity: row.required_quantity,
        ownedQuantity: row.owned_quantity,
        weightClass: row.weight_class,
        weightGrams: row.weight_grams,
        weightConfidence: row.weight_confidence,
        weightSource: row.weight_source,
        priceCents: row.price_cents,
        seasons: row.seasons,
        priority: row.priority,
        isInKit: row.is_in_kit,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to create gear item');
    }
  }

  /**
   * ギアアイテムを更新
   */
  async updateGearItem(id: string, updates: any, userId: string): Promise<GearItem | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMapping: Record<string, string> = {
      categoryId: 'category_id',
      name: 'name',
      brand: 'brand',
      productUrl: 'product_url',
      imageUrl: 'image_url',
      requiredQuantity: 'required_quantity',
      ownedQuantity: 'owned_quantity',
      weightClass: 'weight_class',
      weightGrams: 'weight_grams',
      weightConfidence: 'weight_confidence',
      weightSource: 'weight_source',
      priceCents: 'price_cents',
      seasons: 'seasons',
      priority: 'priority',
      isInKit: 'is_in_kit'
    };

    for (const [key, dbField] of Object.entries(fieldMapping)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return null;
    }

    values.push(id, userId);
    const query = `
      UPDATE gear_items
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, user_id, category_id, name, brand, product_url, image_url,
                required_quantity, owned_quantity, weight_class, weight_grams,
                weight_confidence, weight_source, price_cents, seasons, priority,
                is_in_kit, created_at, updated_at
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        brand: row.brand,
        productUrl: row.product_url,
        imageUrl: row.image_url,
        requiredQuantity: row.required_quantity,
        ownedQuantity: row.owned_quantity,
        weightClass: row.weight_class,
        weightGrams: row.weight_grams,
        weightConfidence: row.weight_confidence,
        weightSource: row.weight_source,
        priceCents: row.price_cents,
        seasons: row.seasons,
        priority: row.priority,
        isInKit: row.is_in_kit,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to update gear item');
    }
  }

  /**
   * ギアアイテムを削除
   */
  async deleteGearItem(id: string, userId: string): Promise<boolean> {
    const query = `DELETE FROM gear_items WHERE id = $1 AND user_id = $2`;

    try {
      const result = await this.pool.query(query, [id, userId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to delete gear item');
    }
  }

  /**
   * camelCase を snake_case に変換
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 接続を閉じる
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseConnection();
