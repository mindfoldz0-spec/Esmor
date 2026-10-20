import * as Location from 'expo-location';
import type { GeoPoint, MandiDistanceCategory, TransportRide, RoutePoint } from '@/types/transport';

export type MandiInfo = {
  id: string;
  name: string;
  marathiName: string;
  hindiName: string;
  latitude: number;
  longitude: number;
  district: string;
  specialties: string[];
  type: 'vegetables' | 'fruits' | 'grains' | 'onion' | 'turmeric' | 'general';
};

/**
 * Curated Maharashtra APMC Mandis with verified real GPS coordinates.
 * OpenStreetMap verified locations across Western Maharashtra, Marathwada & Vidarbha.
 */
export const MAHARASHTRA_MANDIS: MandiInfo[] = [
  {
    id: 'mandi-pune-market-yard',
    name: 'Gultekdi Market Yard, Pune',
    marathiName: 'गुलटेकडी मार्केट यार्ड, पुणे',
    hindiName: 'गुलटेकड़ी मार्केट यार्ड, पुणे',
    latitude: 18.4905,
    longitude: 73.8643,
    district: 'Pune',
    specialties: ['vegetables', 'fruits', 'grains'],
    type: 'general',
  },
  {
    id: 'mandi-baramati',
    name: 'Baramati APMC (Kisan Yard)',
    marathiName: 'बारामती कृषी उत्पन्न बाजार समिती',
    hindiName: 'बारामती कृषि उपज मंडी',
    latitude: 18.1517,
    longitude: 74.5772,
    district: 'Pune',
    specialties: ['vegetables', 'grains', 'fruits'],
    type: 'vegetables',
  },
  {
    id: 'mandi-nashik',
    name: 'Nashik APMC (Panchavati Yard)',
    marathiName: 'नाशिक कृषी उत्पन्न बाजार समिती (दिंडोरी रोड)',
    hindiName: 'नाशिक कृषि उपज मंडी (पंचवटी)',
    latitude: 20.015,
    longitude: 73.795,
    district: 'Nashik',
    specialties: ['vegetables', 'onion', 'grapes'],
    type: 'vegetables',
  },
  {
    id: 'mandi-vashi',
    name: 'Vashi APMC Navi Mumbai (Central Wholesale)',
    marathiName: 'वाशी कृषी बाजार समिती, नवी मुंबई',
    hindiName: 'वाशी थोक मंडी, नवी मुंबई',
    latitude: 19.076,
    longitude: 73.0033,
    district: 'Thane',
    specialties: ['fruits', 'vegetables', 'grains', 'spices'],
    type: 'general',
  },
  {
    id: 'mandi-alephata',
    name: 'Alephata APMC (Onion & Potato Yard)',
    marathiName: 'आळेफाटा कांदा-बटाटा उपबाजार समिती (जुन्नर)',
    hindiName: 'आलेफाटा प्याज-आलू मंडी (जुन्नर)',
    latitude: 19.1818,
    longitude: 74.101,
    district: 'Pune',
    specialties: ['onion', 'vegetables'],
    type: 'onion',
  },
  {
    id: 'mandi-sangamner',
    name: 'Sangamner APMC (Vegetable Hub)',
    marathiName: 'संगमनेर कृषी उत्पन्न बाजार समिती',
    hindiName: 'संगमनेर कृषि उपज मंडी',
    latitude: 19.5772,
    longitude: 74.2144,
    district: 'Ahmednagar',
    specialties: ['vegetables', 'pomegranate'],
    type: 'vegetables',
  },
  {
    id: 'mandi-sangli',
    name: 'Sangli APMC (Turmeric & Grain Yard)',
    marathiName: 'सांगली हळद व धान्य मार्केट यार्ड',
    hindiName: 'सांगली हल्दी और अनाज मंडी',
    latitude: 16.8524,
    longitude: 74.5815,
    district: 'Sangli',
    specialties: ['turmeric', 'grains', 'raisins'],
    type: 'turmeric',
  },
  {
    id: 'mandi-kolhapur',
    name: 'Shahu Chhatrapati Market Yard, Kolhapur',
    marathiName: 'शाहू छत्रपती मार्केट यार्ड, कोल्हापूर',
    hindiName: 'शाहू छत्रपति मार्केट यार्ड, कोल्हापुर',
    latitude: 16.6975,
    longitude: 74.2483,
    district: 'Kolhapur',
    specialties: ['jaggery', 'vegetables', 'grains'],
    type: 'general',
  },
  {
    id: 'mandi-lasalgaon',
    name: 'Lasalgaon APMC (Asia’s Onion Capital)',
    marathiName: 'लासलगाव कांदा बाजार समिती',
    hindiName: 'लासलगांव प्याज मंडी',
    latitude: 20.1478,
    longitude: 74.2272,
    district: 'Nashik',
    specialties: ['onion', 'grains'],
    type: 'onion',
  },
  {
    id: 'mandi-solapur',
    name: 'Solapur APMC (Jowar & Pomegranate Yard)',
    marathiName: 'सोलापूर कृषी उत्पन्न बाजार समिती',
    hindiName: 'सोलापूर कृषि उपज मंडी',
    latitude: 17.6599,
    longitude: 75.9064,
    district: 'Solapur',
    specialties: ['grains', 'fruits'],
    type: 'grains',
  },
];

export const DEFAULT_USER_LOCATION: GeoPoint = {
  latitude: 18.3388,
  longitude: 74.3773,
  name: 'सुपा / बारामती (Supa, Baramati)',
  district: 'Pune',
  address: 'Supa, Baramati Taluka, Pune, Maharashtra',
};

/**
 * Calculates geodesic distance between two points in kilometers using Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(R * c));
}

/**
 * Categorize a mandi by distance from user.
 */
export function categorizeMandiDistance(distanceKm: number): MandiDistanceCategory {
  if (distanceKm <= 45) {
    return 'nearby';
  }
  if (distanceKm <= 110) {
    return 'regional';
  }
  return 'terminal';
}

/**
 * Attempt to obtain real user coordinates via expo-location.
 * Gracefully falls back to default Maharashtra coordinates.
 */
export async function getRealUserLocation(): Promise<GeoPoint> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let placeName = 'माझे गाव (My Village)';
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (geo) {
          const parts = [geo.name, geo.district || geo.city, geo.region].filter(Boolean);
          if (parts.length > 0) {
            placeName = parts.slice(0, 2).join(', ');
          }
        }
      } catch {
        // Fallback to coordinates string if reverse geocoding is unavailable
        placeName = `स्थान (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`;
      }

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        name: placeName,
        district: 'Maharashtra',
      };
    }
  } catch (err) {
    console.warn('Could not read GPS location, using Maharashtra default:', err);
  }

  return DEFAULT_USER_LOCATION;
}

/**
 * Fetch road route geometry from Open Source Routing Machine (OSRM).
 * If OSRM is unreachable or throttled, smoothly falls back to a realistic curved polyline.
 */
export async function fetchOsrmRoadRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<{ coordinates: RoutePoint[]; distanceKm: number; durationMinutes: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: RoutePoint[] = route.geometry.coordinates;
        const distanceKm = Math.round((route.distance || 0) / 1000);
        const durationMinutes = Math.round((route.duration || 0) / 60);

        if (coordinates.length >= 2) {
          return { coordinates, distanceKm, durationMinutes };
        }
      }
    }
  } catch (err) {
    console.warn('OSRM route fetch timed out or offline, generating smooth road polyline:', err);
  }

  // Fallback: Generate a realistic 40-point curved road polyline
  const directDistanceKm = calculateDistanceKm(startLat, startLon, endLat, endLon);
  const steps = Math.max(30, Math.min(80, Math.round(directDistanceKm / 2)));
  const coordinates: RoutePoint[] = [];

  // Intermediate curve deviation (mimicking highway curves & ghat passes)
  const midLon = (startLon + endLon) / 2;
  const midLat = (startLat + endLat) / 2;
  const perpLon = -(endLat - startLat) * 0.15;
  const perpLat = (endLon - startLon) * 0.15;
  const controlLon = midLon + perpLon;
  const controlLat = midLat + perpLat;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier curve interpolation
    const lon =
      (1 - t) * (1 - t) * startLon + 2 * (1 - t) * t * controlLon + t * t * endLon;
    const lat =
      (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * controlLat + t * t * endLat;
    coordinates.push([lon, lat]);
  }

  const durationMinutes = Math.max(15, Math.round((directDistanceKm / 45) * 60));
  return { coordinates, distanceKm: directDistanceKm, durationMinutes };
}

/**
 * Generate dynamically matched freight rides based on the user's actual location
 * connecting them to nearby, regional, and terminal Mandis.
 */
export function matchRidesForUserLocation(userLoc: GeoPoint): TransportRide[] {
  // Compute distance to each mandi and sort closest to farthest
  const mandisWithDistance = MAHARASHTRA_MANDIS.map((mandi) => {
    const dist = calculateDistanceKm(
      userLoc.latitude,
      userLoc.longitude,
      mandi.latitude,
      mandi.longitude
    );
    const category = categorizeMandiDistance(dist);
    return { ...mandi, distanceKm: dist, category };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  // Pick top 1-2 nearby, 2 regional, and 1 terminal mandi
  const nearbyMandis = mandisWithDistance.filter((m) => m.category === 'nearby');
  const regionalMandis = mandisWithDistance.filter((m) => m.category === 'regional');
  const terminalMandis = mandisWithDistance.filter((m) => m.category === 'terminal');

  const selectedMandis = [
    ...(nearbyMandis.length > 0 ? nearbyMandis.slice(0, 2) : mandisWithDistance.slice(0, 1)),
    ...(regionalMandis.length > 0 ? regionalMandis.slice(0, 2) : mandisWithDistance.slice(1, 3)),
    ...(terminalMandis.length > 0 ? terminalMandis.slice(0, 1) : mandisWithDistance.slice(3, 4)),
  ];

  const VEHICLE_TEMPLATES = [
    {
      vehicleType: 'tata_ace' as const,
      driverName: 'ज्ञानेश्वर तांबडे (Dnyaneshwar Tambade)',
      driverPhone: '+91 98220 12345',
      vehicleNumber: 'MH 12 QX 4521',
      unitType: 'sack' as const,
      capacityPercent: 45,
      capacityWeight: 400,
      departureTime: '05:30 AM',
      baseRatePerKm: 2.1,
    },
    {
      vehicleType: 'bolero_pickup' as const,
      driverName: 'संजय काळे (Sanjay Kale)',
      driverPhone: '+91 94231 87654',
      vehicleNumber: 'MH 17 BD 8902',
      unitType: 'crate' as const,
      capacityPercent: 60,
      capacityWeight: 650,
      departureTime: '08:00 PM',
      baseRatePerKm: 0.7,
    },
    {
      vehicleType: 'tractor' as const,
      driverName: 'बाळू पाटील (Balu Patil)',
      driverPhone: '+91 97654 32190',
      vehicleNumber: 'MH 09 CT 1145',
      unitType: 'quintal' as const,
      capacityPercent: 50,
      capacityWeight: 1200,
      departureTime: '06:00 AM',
      baseRatePerKm: 2.5,
    },
    {
      vehicleType: 'three_wheeler' as const,
      driverName: 'अशोक मोरे (Ashok More)',
      driverPhone: '+91 98601 54321',
      vehicleNumber: 'MH 14 GL 7733',
      unitType: 'crate' as const,
      capacityPercent: 35,
      capacityWeight: 280,
      departureTime: '02:00 PM',
      baseRatePerKm: 0.65,
    },
  ];

  return selectedMandis.map((mandi, idx) => {
    const template = VEHICLE_TEMPLATES[idx % VEHICLE_TEMPLATES.length];
    const dist = mandi.distanceKm;
    // Calculate realistic pooled freight rate
    const farePerUnit = Math.max(
      35,
      Math.round((dist * template.baseRatePerKm) / 5) * 5
    );

    // Staging depot coordinates ~2-4 km from user
    const depotLat = userLoc.latitude + (idx % 2 === 0 ? 0.025 : -0.022);
    const depotLon = userLoc.longitude + (idx % 2 === 0 ? -0.02 : 0.024);

    return {
      id: `ride-geo-${mandi.id}-${idx}`,
      driverName: template.driverName,
      driverPhone: template.driverPhone,
      vehicleType: template.vehicleType,
      vehicleNumber: template.vehicleNumber,
      fromVillage: userLoc.name,
      toMarket: `${mandi.marathiName} (${mandi.name})`,
      district: mandi.district,
      departureDate: idx === 1 ? 'आज रात्री (Tonight)' : 'उद्या (Tomorrow)',
      departureTime: template.departureTime,
      availableCapacityPercent: template.capacityPercent,
      availableWeightKg: template.capacityWeight,
      farePerUnit,
      unitType: template.unitType,
      estimatedMarketDistanceKm: dist,
      pickupHub: `${userLoc.name.split(',')[0]} ग्रामपंचायत चौक / मुख्य रस्ता`,
      isVerified: true,
      fromCoords: {
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
        name: userLoc.name,
        district: userLoc.district,
      },
      toCoords: {
        latitude: mandi.latitude,
        longitude: mandi.longitude,
        name: mandi.name,
        district: mandi.district,
      },
      depotCoords: {
        latitude: depotLat,
        longitude: depotLon,
        name: 'वाहन तळ / ड्रायव्हर डेपो',
      },
      mandiCategory: mandi.category,
      voiceSummary: {
        mr: `${userLoc.name} ते ${mandi.marathiName} साठी ${template.driverName.split(' ')[0]} यांची गाडी उपलब्ध आहे. अंतर सुमारे ${dist} किमी असून भाडे ₹${farePerUnit} प्रति ${template.unitType === 'sack' ? 'पोते' : template.unitType === 'crate' ? 'क्रेट' : 'क्विंटल'}.`,
        hi: `${userLoc.name} से ${mandi.hindiName} के लिए वाहन उपलब्ध है। दूरी ~${dist} किमी, किराया ₹${farePerUnit} प्रति ${template.unitType}.`,
        en: `Vehicle available from ${userLoc.name} to ${mandi.name}. Distance ~${dist} km, fare ₹${farePerUnit} per ${template.unitType}.`,
      },
    };
  });
}
