import { Pool } from 'pg';
import { GearItem, Category, GearItemWithCalculated } from '../../client/utils/types';

/**
 * PostgreSQL データベース接続とクエリ実行
 */
class DatabaseConnection {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
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
        g.id, g.user_id, g.category_id, g.name, g.brand, g.product_url,
        g.required_quantity, g.owned_quantity, g.weight_grams, g.price_cents,
        g.season, g.priority, g.llm_data, g.created_at, g.updated_at,
        c.id as cat_id, c.name as cat_name, c.path as cat_path, 
        c.color as cat_color, c.created_at as cat_created_at,
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
      query += ` AND g.season = ANY($${paramIndex})`;
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
        requiredQuantity: row.required_quantity,
        ownedQuantity: row.owned_quantity,
        weightGrams: row.weight_grams,
        priceCents: row.price_cents,
        season: row.season,
        priority: row.priority,
        llmData: row.llm_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // 計算フィールド
        shortage: row.shortage,
        totalWeight: row.total_weight,
        totalPrice: row.total_price,
        missingQuantity: row.missing_quantity,
        // カテゴリ情報
        category: row.cat_id ? {
          id: row.cat_id,
          name: row.cat_name,
          path: row.cat_path,
          color: row.cat_color,
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
        g.id, g.user_id, g.category_id, g.name, g.brand, g.product_url,
        g.required_quantity, g.owned_quantity, g.weight_grams, g.price_cents,
        g.season, g.priority, g.llm_data, g.created_at, g.updated_at,
        c.id as cat_id, c.name as cat_name, c.path as cat_path, 
        c.color as cat_color, c.created_at as cat_created_at,
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
        requiredQuantity: row.required_quantity,
        ownedQuantity: row.owned_quantity,
        weightGrams: row.weight_grams,
        priceCents: row.price_cents,
        season: row.season,
        priority: row.priority,
        llmData: row.llm_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // 計算フィールド
        shortage: row.shortage,
        totalWeight: row.total_weight,
        totalPrice: row.total_price,
        missingQuantity: row.missing_quantity,
        // カテゴリ情報
        category: row.cat_id ? {
          id: row.cat_id,
          name: row.cat_name,
          path: row.cat_path,
          color: row.cat_color,
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
   * ギアアイテムの作成
   */
  async createGearItem(userId: string, gearData: Omit<GearItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const query = `
      INSERT INTO gear_items (
        user_id, category_id, name, brand, product_url,
        required_quantity, owned_quantity, weight_grams, price_cents,
        season, priority, llm_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id
    `;

    const params = [
      userId,
      gearData.categoryId,
      gearData.name,
      gearData.brand,
      gearData.productUrl,
      gearData.requiredQuantity,
      gearData.ownedQuantity,
      gearData.weightGrams,
      gearData.priceCents,
      gearData.season,
      gearData.priority,
      gearData.llmData ? JSON.stringify(gearData.llmData) : null
    ];

    try {
      const result = await this.pool.query(query, params);
      return result.rows[0].id;
    } catch (error) {
      console.error('Database insert error:', error);
      throw new Error('Failed to create gear item');
    }
  }

  /**
   * ギアアイテムの更新
   */
  async updateGearItem(id: string, userId: string, updates: Partial<GearItem>): Promise<boolean> {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    // 動的にUPDATE文を構築
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        fields.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, userId);

    const query = `
      UPDATE gear_items 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    `;

    try {
      const result = await this.pool.query(query, params);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update gear item');
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
      SELECT id, user_id, name, parent_id, path, color, created_at
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
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch categories');
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
