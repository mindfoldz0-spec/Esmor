import * as SQLite from 'expo-sqlite';
import type { TransportRide, TransportBooking, CargoCategory, UnitType } from '@/types/transport';

const DATABASE_NAME = 'esmor.db';

export const INITIAL_MAHARASHTRA_RIDES: TransportRide[] = [
  {
    id: 'ride-1',
    driverName: 'ज्ञानेश्वर तांबडे (Dnyaneshwar Tambade)',
    driverPhone: '+91 98220 12345',
    vehicleType: 'tata_ace',
    vehicleNumber: 'MH 12 QX 4521',
    fromVillage: 'सुपा / बारामती (Supa, Baramati)',
    toMarket: 'गुलटेकडी मार्केट यार्ड, पुणे (Pune Market Yard)',
    district: 'Pune',
    departureDate: 'उद्या (Tomorrow)',
    departureTime: '05:30 AM',
    availableCapacityPercent: 45,
    availableWeightKg: 400,
    farePerUnit: 140,
    unitType: 'sack',
    estimatedMarketDistanceKm: 72,
    pickupHub: 'सुपा ग्रामपंचायत चौक / मारुती मंदिर',
    isVerified: true,
    fromCoords: {
      latitude: 18.3388,
      longitude: 74.3773,
      name: 'सुपा, बारामती (Supa, Baramati)',
      district: 'Pune',
    },
    toCoords: {
      latitude: 18.4905,
      longitude: 73.8643,
      name: 'गुलटेकडी मार्केट यार्ड, पुणे (Pune Market Yard)',
      district: 'Pune',
    },
    depotCoords: {
      latitude: 18.3188,
      longitude: 74.405,
      name: 'बारामती वाहन तळ',
    },
    mandiCategory: 'regional',
    voiceSummary: {
      mr: 'उद्या सकाळी साडेपाच वाजता बारामती ते पुणे मार्केट यार्डसाठी छोटा हत्ती उपलब्ध आहे. ४५ टक्के जागा रिकामी आहे. भाडे १४० रुपये प्रति पोते.',
      hi: 'कल सुबह साढ़े पांच बजे बारामती से पुणे मार्केट यार्ड के लिए छोटा हाथी उपलब्ध है। ४५ प्रतिशत जगह खाली है। किराया १४० रुपये प्रति बोरी।',
      en: 'Tata Ace leaving Supa Baramati for Pune Market Yard tomorrow at 5:30 AM. 45% space free. Fare 140 rupees per sack.',
    },
  },
  {
    id: 'ride-2',
    driverName: 'संजय काळे (Sanjay Kale)',
    driverPhone: '+91 94231 87654',
    vehicleType: 'bolero_pickup',
    vehicleNumber: 'MH 17 BD 8902',
    fromVillage: 'धांदरफळ / संगमनेर (Sangamner)',
    toMarket: 'नाशिक कृषी उत्पन्न बाजार समिती (Nashik APMC)',
    district: 'Ahmednagar',
    departureDate: 'आज रात्री (Tonight)',
    departureTime: '08:00 PM',
    availableCapacityPercent: 60,
    availableWeightKg: 650,
    farePerUnit: 45,
    unitType: 'crate',
    estimatedMarketDistanceKm: 65,
    pickupHub: 'धांदरफळ शेतकरी सेवा केंद्र',
    isVerified: true,
    fromCoords: {
      latitude: 19.5772,
      longitude: 74.2144,
      name: 'धांदरफळ, संगमनेर (Sangamner)',
      district: 'Ahmednagar',
    },
    toCoords: {
      latitude: 20.015,
      longitude: 73.795,
      name: 'नाशिक कृषी उत्पन्न बाजार समिती (Nashik APMC)',
      district: 'Nashik',
    },
    depotCoords: {
      latitude: 19.555,
      longitude: 74.23,
      name: 'संगमनेर वाहन तळ',
    },
    mandiCategory: 'regional',
    voiceSummary: {
      mr: 'आज रात्री आठ वाजता संगमनेर ते नाशिक कृषी बाजार समितीसाठी बोलेरो पिकअप उपलब्ध आहे. ६० टक्के जागा रिकामी आहे. भाडे ४५ रुपये प्रति क्रेट.',
      hi: 'आज रात आठ बजे संगमनेर से नाशिक कृषि बाजार समिति के लिए बोलेरो पिकअप उपलब्ध है। ६० प्रतिशत जगह खाली है। किराया ४५ रुपये प्रति क्रेट।',
      en: 'Bolero Pickup leaving Sangamner for Nashik APMC tonight at 8:00 PM. 60% space free. Fare 45 rupees per crate.',
    },
  },
  {
    id: 'ride-3',
    driverName: 'बाळू पाटील (Balu Patil)',
    driverPhone: '+91 97654 32190',
    vehicleType: 'tractor',
    vehicleNumber: 'MH 09 CT 1145',
    fromVillage: 'वारणा नगर / कोल्हापूर (Warna Nagar)',
    toMarket: 'सांगली हळद व धान्य मार्केट (Sangli Market)',
    district: 'Kolhapur',
    departureDate: 'उद्या (Tomorrow)',
    departureTime: '06:00 AM',
    availableCapacityPercent: 50,
    availableWeightKg: 1200,
    farePerUnit: 180,
    unitType: 'quintal',
    estimatedMarketDistanceKm: 42,
    pickupHub: 'वारणा दूध डेअरी संकलन केंद्र',
    isVerified: true,
    fromCoords: {
      latitude: 16.6975,
      longitude: 74.2483,
      name: 'वारणा नगर, कोल्हापूर (Warna Nagar)',
      district: 'Kolhapur',
    },
    toCoords: {
      latitude: 16.8524,
      longitude: 74.5815,
      name: 'सांगली हळद व धान्य मार्केट (Sangli Market)',
      district: 'Sangli',
    },
    depotCoords: {
      latitude: 16.715,
      longitude: 74.27,
      name: 'वारणा दूध संकलन तळ',
    },
    mandiCategory: 'nearby',
    voiceSummary: {
      mr: 'उद्या सकाळी सहा वाजता वारणा नगर ते सांगली मार्केटसाठी ट्रॅक्टर ट्रॉली उपलब्ध आहे. ५० टक्के जागा रिकामी आहे. भाडे १८० रुपये प्रति क्विंटल.',
      hi: 'कल सुबह छह बजे वारणा नगर से सांगली मार्केट के लिए ट्रैक्टर ट्रॉली उपलब्ध है। ५० प्रतिशत जगह खाली है। किराया १८० रुपये प्रति क्विंटल।',
      en: 'Tractor Trolley leaving Warna Nagar for Sangli Market tomorrow at 6:00 AM. 50% space free. Fare 180 rupees per quintal.',
    },
  },
  {
    id: 'ride-4',
    driverName: 'अशोक मोरे (Ashok More)',
    driverPhone: '+91 98601 54321',
    vehicleType: 'three_wheeler',
    vehicleNumber: 'MH 14 GL 7733',
    fromVillage: 'ओतूर / जुन्नर (Otur, Junnar)',
    toMarket: 'वाशी नवी मुंबई APMC (Vashi APMC)',
    district: 'Pune',
    departureDate: 'उद्या (Tomorrow)',
    departureTime: '02:00 PM',
    availableCapacityPercent: 35,
    availableWeightKg: 280,
    farePerUnit: 50,
    unitType: 'crate',
    estimatedMarketDistanceKm: 135,
    pickupHub: 'ओतूर बस स्टँड समोरील किराणा दुकान',
    isVerified: true,
    fromCoords: {
      latitude: 19.1818,
      longitude: 74.101,
      name: 'ओतूर, जुन्नर (Otur, Junnar)',
      district: 'Pune',
    },
    toCoords: {
      latitude: 19.076,
      longitude: 73.0033,
      name: 'वाशी नवी मुंबई APMC (Vashi APMC)',
      district: 'Thane',
    },
    depotCoords: {
      latitude: 19.2,
      longitude: 74.12,
      name: 'जुन्नर फाटा डेपो',
    },
    mandiCategory: 'terminal',
    voiceSummary: {
      mr: 'उद्या दुपारी दोन वाजता जुन्नर ते वाशी नवी मुंबई एपीएमसीसाठी मालवाहू रिक्षा उपलब्ध आहे. ३५ टक्के जागा रिकामी आहे. भाडे ५० रुपये प्रति क्रेट.',
      hi: 'कल दोपहर दो बजे जुन्नर से वाशी नवी मुंबई एपीएमसी के लिए थ्री व्हीलर उपलब्ध है। ३५ प्रतिशत जगह खाली है। किराया ५० रुपये प्रति क्रेट।',
      en: 'Cargo Auto leaving Junnar for Vashi Navi Mumbai APMC tomorrow at 2:00 PM. 35% space free. Fare 50 rupees per crate.',
    },
  },
];

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
    })();
  }
  return dbPromise;
}

export async function getAllTransportRides(): Promise<TransportRide[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{ id: string; payload: string }>(
      'SELECT id, payload FROM custom_transport_rides ORDER BY created_at DESC'
    );
    const customRides: TransportRide[] = rows
      .map((r) => {
        try {
          return JSON.parse(r.payload) as TransportRide;
        } catch {
          return null;
        }
      })
      .filter((r): r is TransportRide => r !== null);

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
  const bookingId = `book-${Date.now()}`;
  const totalFare = params.ride.farePerUnit * params.quantity;
  // Hiring an entire tempo alone typically costs ₹1,800 - ₹2,200 for 50-80km.
  // Shared pooling saves roughly 60% of that total vehicle charter cost.
  const privateCharterEstimate = 1800;
  const estimatedSavings = Math.max(0, privateCharterEstimate - totalFare);

  const booking: TransportBooking = {
    id: bookingId,
    rideId: params.ride.id,
    userName: params.userName,
    userPhone: params.userPhone,
    cargoCategory: params.cargoCategory,
    quantity: params.quantity,
    unitType: params.ride.unitType,
    totalFare,
    estimatedSavings,
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
    pickupHub: params.ride.pickupHub,
  };

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

export async function createCustomRide(ride: TransportRide): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO custom_transport_rides (id, payload, created_at) VALUES (?, ?, ?)',
    [ride.id, JSON.stringify(ride), new Date().toISOString()]
  );
}
