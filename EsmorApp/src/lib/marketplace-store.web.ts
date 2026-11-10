// Web implementation of the marketplace repository.
// SQLite needs WASM + cross-origin isolation on the web, so the browser build
// stores user listings and orders in localStorage (mirror of marketplace-store.ts).
import { INITIAL_MARKETPLACE_PRODUCTS } from '@/constants/marketplace-seed';
import { readJsonArray, removeStorageKey, writeJsonArray } from '@/lib/web-storage';
import type { MarketplaceOrder, MarketplaceProduct } from '@/types/marketplace';

export { INITIAL_MARKETPLACE_PRODUCTS };

const PRODUCTS_KEY = 'esmor.marketplace.products.v1';
const ORDERS_KEY = 'esmor.marketplace.orders.v1';

function newestFirst<T>(items: readonly T[], dateKey: keyof T): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(String(a[dateKey])).getTime() || 0;
    const bTime = new Date(String(b[dateKey])).getTime() || 0;
    return bTime - aTime;
  });
}

export async function getAllMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const customProducts = readJsonArray<MarketplaceProduct>(PRODUCTS_KEY);
  return [...newestFirst(customProducts, 'createdAt'), ...INITIAL_MARKETPLACE_PRODUCTS];
}

export async function getAllMarketplaceOrders(): Promise<MarketplaceOrder[]> {
  return newestFirst(readJsonArray<MarketplaceOrder>(ORDERS_KEY), 'orderedAt');
}

export async function addMarketplaceProduct(product: MarketplaceProduct): Promise<void> {
  const customProducts = readJsonArray<MarketplaceProduct>(PRODUCTS_KEY);
  writeJsonArray(PRODUCTS_KEY, [product, ...customProducts]);
}

export async function createMarketplaceOrder(order: MarketplaceOrder): Promise<void> {
  const orders = readJsonArray<MarketplaceOrder>(ORDERS_KEY);
  writeJsonArray(ORDERS_KEY, [order, ...orders]);
}

/** Delete every marketplace row this device holds (used by Reset profile). */
export async function resetMarketplaceData(): Promise<void> {
  removeStorageKey(PRODUCTS_KEY);
  removeStorageKey(ORDERS_KEY);
}
