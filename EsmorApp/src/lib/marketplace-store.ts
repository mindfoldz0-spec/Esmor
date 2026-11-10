import * as SQLite from 'expo-sqlite';
import { INITIAL_MARKETPLACE_PRODUCTS } from '@/constants/marketplace-seed';
import type { MarketplaceProduct, MarketplaceOrder } from '@/types/marketplace';

const DATABASE_NAME = 'esmor.db';

export { INITIAL_MARKETPLACE_PRODUCTS };



let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS marketplace_products (
          id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS marketplace_orders (
          id TEXT PRIMARY KEY NOT NULL,
          product_id TEXT NOT NULL,
          product_title TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit TEXT NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL,
          buyer_name TEXT NOT NULL,
          buyer_phone TEXT NOT NULL,
          delivery_address TEXT NOT NULL,
          status TEXT NOT NULL,
          ordered_at TEXT NOT NULL
        );
      `);
      return db;
    })().catch((err) => {
      // A transient failure must not brick every future call — allow retry.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function getAllMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{ id: string; payload: string }>(
      'SELECT id, payload FROM marketplace_products ORDER BY created_at DESC'
    );
    const customProducts: MarketplaceProduct[] = rows
      .map((r) => {
        try {
          return JSON.parse(r.payload) as MarketplaceProduct;
        } catch {
          return null;
        }
      })
      .filter((p): p is MarketplaceProduct => p !== null);

    return [...customProducts, ...INITIAL_MARKETPLACE_PRODUCTS];
  } catch (err) {
    console.warn('Failed to load marketplace products from SQLite:', err);
    return INITIAL_MARKETPLACE_PRODUCTS;
  }
}

export async function addMarketplaceProduct(product: MarketplaceProduct): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO marketplace_products (id, payload, created_at) VALUES (?, ?, ?)',
      [product.id, JSON.stringify(product), product.createdAt]
    );
  } catch (err) {
    console.error('Failed to save product to SQLite:', err);
    throw err;
  }
}

export async function getAllMarketplaceOrders(): Promise<MarketplaceOrder[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      product_id: string;
      product_title: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total_price: number;
      buyer_name: string;
      buyer_phone: string;
      delivery_address: string;
      status: string;
      ordered_at: string;
    }>('SELECT * FROM marketplace_orders ORDER BY ordered_at DESC');

    return rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productTitle: row.product_title,
      quantity: row.quantity,
      unit: row.unit as MarketplaceOrder['unit'],
      unitPrice: row.unit_price,
      totalPrice: row.total_price,
      buyerName: row.buyer_name,
      buyerPhone: row.buyer_phone,
      deliveryAddress: row.delivery_address,
      status: row.status as MarketplaceOrder['status'],
      orderedAt: row.ordered_at,
    }));
  } catch (err) {
    console.warn('Failed to load marketplace orders:', err);
    return [];
  }
}

/** Delete every marketplace row this device holds (used by Reset profile). */
export async function resetMarketplaceData(): Promise<void> {
  try {
    const db = await getDb();
    await db.execAsync('DELETE FROM marketplace_orders; DELETE FROM marketplace_products;');
  } catch (err) {
    console.warn('Could not reset marketplace data:', err);
  }
}

export async function createMarketplaceOrder(order: MarketplaceOrder): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO marketplace_orders 
       (id, product_id, product_title, quantity, unit, unit_price, total_price, buyer_name, buyer_phone, delivery_address, status, ordered_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.productId,
        order.productTitle,
        order.quantity,
        order.unit,
        order.unitPrice,
        order.totalPrice,
        order.buyerName,
        order.buyerPhone,
        order.deliveryAddress,
        order.status,
        order.orderedAt,
      ]
    );
  } catch (err) {
    console.error('Failed to save order to SQLite:', err);
    throw err;
  }
}
