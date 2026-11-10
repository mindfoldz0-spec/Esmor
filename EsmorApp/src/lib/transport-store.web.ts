// Web implementation of the transport repository.
// SQLite needs WASM + cross-origin isolation on the web, so the browser build
// stores bookings and user-posted rides in localStorage (mirror of transport-store.ts).
import { INITIAL_MAHARASHTRA_RIDES } from '@/constants/transport-seed';
import { createTransportBooking } from '@/lib/booking';
import { readJsonArray, removeStorageKey, writeJsonArray } from '@/lib/web-storage';
import type { TransportBooking, TransportRide, CargoCategory } from '@/types/transport';

export { INITIAL_MAHARASHTRA_RIDES };

const BOOKINGS_KEY = 'esmor.transport.bookings.v1';
const CUSTOM_RIDES_KEY = 'esmor.transport.custom-rides.v1';

function newestFirst<T>(items: readonly T[], dateKey: keyof T): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(String(a[dateKey])).getTime() || 0;
    const bTime = new Date(String(b[dateKey])).getTime() || 0;
    return bTime - aTime;
  });
}

/** Only the user-posted (custom) rides (stored newest-first). */
export async function getCustomTransportRides(): Promise<TransportRide[]> {
  return readJsonArray<TransportRide>(CUSTOM_RIDES_KEY);
}

export async function getAllTransportRides(): Promise<TransportRide[]> {
  return [...(await getCustomTransportRides()), ...INITIAL_MAHARASHTRA_RIDES];
}

export async function getUserBookings(): Promise<TransportBooking[]> {
  return newestFirst(readJsonArray<TransportBooking>(BOOKINGS_KEY), 'bookedAt');
}

export async function bookTransportSpace(params: {
  ride: TransportRide;
  userName: string;
  userPhone: string;
  cargoCategory: CargoCategory;
  quantity: number;
}): Promise<TransportBooking> {
  const booking = createTransportBooking(params);
  const bookings = readJsonArray<TransportBooking>(BOOKINGS_KEY);
  writeJsonArray(BOOKINGS_KEY, [booking, ...bookings]);
  return booking;
}

export async function createCustomRide(ride: TransportRide): Promise<void> {
  const customRides = readJsonArray<TransportRide>(CUSTOM_RIDES_KEY);
  writeJsonArray(CUSTOM_RIDES_KEY, [ride, ...customRides]);
}

/** Delete every transport row this device holds (used by Reset profile). */
export async function resetTransportData(): Promise<void> {
  removeStorageKey(BOOKINGS_KEY);
  removeStorageKey(CUSTOM_RIDES_KEY);
}
