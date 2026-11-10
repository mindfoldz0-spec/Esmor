import * as SQLite from 'expo-sqlite';
import { INITIAL_MAHARASHTRA_RIDES } from '@/constants/transport-seed';
import { createTransportBooking } from '@/lib/booking';
import type { TransportRide, TransportBooking, CargoCategory, UnitType } from '@/types/transport';

const DATABASE_NAME = 'esmor.db';

export { INITIAL_MAHARASHTRA_RIDES };



let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transport_bookings (
          id TEXT PRIMARY KEY NOT NULL,
          ride_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_phone TEXT NOT NULL,
          cargo_category TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_type TEXT NOT NULL,
          total_fare REAL NOT NULL,
          estimated_savings REAL NOT NULL,
          status TEXT NOT NULL,
          booked_at TEXT NOT NULL,
          pickup_hub TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS custom_transport_rides (
          id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL
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

/** Only the user-posted (custom) rides, read straight from SQLite. */
export async function getCustomTransportRides(): Promise<TransportRide[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{ id: string; payload: string }>(
      'SELECT id, payload FROM custom_transport_rides ORDER BY created_at DESC'
    );

    return rows
      .map((r) => {
        try {
          return JSON.parse(r.payload) as TransportRide;
        } catch {
          return null;
        }
      })
      .filter((r): r is TransportRide => r !== null);
  } catch (err) {
    console.warn('Failed to read custom rides from DB:', err);
    return [];
  }
}

export async function getAllTransportRides(): Promise<TransportRide[]> {
  try {
    const customRides = await getCustomTransportRides();
    return [...customRides, ...INITIAL_MAHARASHTRA_RIDES];
  } catch (err) {
    console.warn('Failed to read transport rides from DB, using defaults:', err);
    return INITIAL_MAHARASHTRA_RIDES;
  }
}

export async function bookTransportSpace(params: {
  ride: TransportRide;
  userName: string;
  userPhone: string;
  cargoCategory: CargoCategory;
  quantity: number;
}): Promise<TransportBooking> {
  const db = await getDb();
  const booking = createTransportBooking(params);

  await db.runAsync(
    `INSERT INTO transport_bookings (
      id, ride_id, user_name, user_phone, cargo_category, quantity,
      unit_type, total_fare, estimated_savings, status, booked_at, pickup_hub
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking.id,
      booking.rideId,
      booking.userName,
      booking.userPhone,
      booking.cargoCategory,
      booking.quantity,
      booking.unitType,
      booking.totalFare,
      booking.estimatedSavings,
      booking.status,
      booking.bookedAt,
      booking.pickupHub,
    ]
  );

  return booking;
}

export async function getUserBookings(): Promise<TransportBooking[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      ride_id: string;
      user_name: string;
      user_phone: string;
      cargo_category: string;
      quantity: number;
      unit_type: string;
      total_fare: number;
      estimated_savings: number;
      status: string;
      booked_at: string;
      pickup_hub: string;
    }>('SELECT * FROM transport_bookings ORDER BY booked_at DESC');

    return rows.map((r) => ({
      id: r.id,
      rideId: r.ride_id,
      userName: r.user_name,
      userPhone: r.user_phone,
      cargoCategory: r.cargo_category as CargoCategory,
      quantity: r.quantity,
      unitType: r.unit_type as UnitType,
      totalFare: r.total_fare,
      estimatedSavings: r.estimated_savings,
      status: r.status as TransportBooking['status'],
      bookedAt: r.booked_at,
      pickupHub: r.pickup_hub,
    }));
  } catch (err) {
    console.warn('Failed to load user bookings:', err);
    return [];
  }
}

/** Delete every transport row this device holds (used by Reset profile). */
export async function resetTransportData(): Promise<void> {
  try {
    const db = await getDb();
    await db.execAsync('DELETE FROM transport_bookings; DELETE FROM custom_transport_rides;');
  } catch (err) {
    console.warn('Could not reset transport data:', err);
  }
}

export async function createCustomRide(ride: TransportRide): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO custom_transport_rides (id, payload, created_at) VALUES (?, ?, ?)',
    [ride.id, JSON.stringify(ride), new Date().toISOString()]
  );
}
