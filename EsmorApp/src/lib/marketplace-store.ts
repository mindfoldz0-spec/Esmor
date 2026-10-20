import * as SQLite from 'expo-sqlite';
import type { MarketplaceProduct, MarketplaceOrder } from '@/types/marketplace';

const DATABASE_NAME = 'esmor.db';

export const INITIAL_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod-1',
    title: 'रत्नागिरी हापूस आंबे (Alphonso Mangoes)',
    marathiTitle: 'रत्नागिरी हापूस आंबे',
    hindiTitle: 'रत्नागिरी हापुस आम',
    category: 'fruits',
    price: 950,
    unit: 'box',
    quantityAvailable: 45,
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-1',
    sellerName: 'ज्ञानेश्वर तांबडे (Dnyaneshwar)',
    sellerPhone: '+91 98220 12345',
    sellerVillage: 'सुपा / बारामती',
    district: 'Pune',
    description: 'बागेतील अस्सल गोड आणि रसाळ हापूस आंबे. केमिकल मुक्त, नैसर्गिकरीत्या पिकवलेले.',
    isOrganic: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    title: 'नाशिक गावरान कांदा (Nashik Red Onion)',
    marathiTitle: 'नाशिक गावरान कांदा',
    hindiTitle: 'नाशिक लाल प्याज',
    category: 'vegetables',
    price: 1350,
    unit: 'quintal',
    quantityAvailable: 80,
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-2',
    sellerName: 'संजय काळे (Sanjay Kale)',
    sellerPhone: '+91 94231 87654',
    sellerVillage: 'धांदरफळ / संगमनेर',
    district: 'Ahmednagar',
    description: 'नवीन काढणीचा उत्कृष्ट टिकाऊ लाल कांदा. साठवणुकीसाठी व स्वयंपाकासाठी उत्तम.',
    isOrganic: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    title: 'कोल्हापुरी सेंद्रिय गूळ (Organic Jaggery)',
    marathiTitle: 'कोल्हापुरी सेंद्रिय गूळ',
    hindiTitle: 'कोल्हापुरी जैविक गुड़',
    category: 'dairy',
    price: 65,
    unit: 'kg',
    quantityAvailable: 150,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-3',
    sellerName: 'बाळू पाटील (Balu Patil)',
    sellerPhone: '+91 97654 32190',
    sellerVillage: 'वारणा नगर / कोल्हापूर',
    district: 'Kolhapur',
    description: 'उसाच्या रसापासून बनवलेला केमिकल विरहित शुद्ध गूळ. १ किलो ढेप.',
    isOrganic: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    title: 'ताजे लाल टोमॅटो (Fresh Farm Tomatoes)',
    marathiTitle: 'ताजे लाल टोमॅटो',
    hindiTitle: 'ताजा लाल टमाटर',
    category: 'vegetables',
    price: 360,
    unit: 'crate',
    quantityAvailable: 35,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-4',
    sellerName: 'अशोक मोरे (Ashok More)',
    sellerPhone: '+91 98601 54321',
    sellerVillage: 'ओतूर / जुन्नर',
    district: 'Pune',
    description: 'नारायणगाव पद्धतीचे उत्कृष्ट दर्जाचे ताजे टोमॅटो. २५ किलो प्रति क्रेट.',
    isOrganic: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    title: 'इंद्रायणी सुगंधी तांदूळ (Indrayani Rice)',
    marathiTitle: 'इंद्रायणी सुगंधी तांदूळ',
    hindiTitle: 'इंद्रायणी सुगंधित चावल',
    category: 'grains',
    price: 58,
    unit: 'kg',
    quantityAvailable: 300,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-5',
    sellerName: 'ज्ञानेश्वर तांबडे',
    sellerPhone: '+91 98220 12345',
    sellerVillage: 'मावळ / पुणे',
    district: 'Pune',
    description: 'मावळातील सुगंधी व मऊ शिजणारा अस्सल जुना इंद्रायणी तांदूळ.',
    isOrganic: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    title: 'शुद्ध गावठी गाईचे तूप (Desi Cow Ghee)',
    marathiTitle: 'शुद्ध गावठी गाईचे तूप',
    hindiTitle: 'शुद्ध देसी गाय का घी',
    category: 'dairy',
    price: 780,
    unit: 'liter',
    quantityAvailable: 25,
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-6',
    sellerName: 'बाळू पाटील',
    sellerPhone: '+91 97654 32190',
    sellerVillage: 'वारणा नगर',
    district: 'Kolhapur',
    description: 'पारंपरिक बिलोना पद्धतीने काढलेले सुगंधी व दाणेदार देशी गाईचे तूप.',
    isOrganic: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    title: '१६ लिटर बॅटरी स्प्रे पंप (Battery Sprayer)',
    marathiTitle: '१६ लिटर बॅटरी स्प्रे पंप',
    hindiTitle: '१६ लीटर बैटरी स्प्रे पंप',
    category: 'equipment',
    price: 2450,
    unit: 'piece',
    quantityAvailable: 12,
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
    sellerId: 'seller-7',
    sellerName: 'संजय काळे',
    sellerPhone: '+91 94231 87654',
    sellerVillage: 'संगमनेर',
    district: 'Ahmednagar',
    description: '१२ व्होल्ट हेवी ड्युटी बॅटरी, डबल मोटर, ६ महिन्यांची वॉरंटी.',
    isOrganic: false,
    createdAt: new Date().toISOString(),
  },
];

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
    })();
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
