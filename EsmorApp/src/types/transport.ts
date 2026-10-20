export type VehicleType = 'tata_ace' | 'bolero_pickup' | 'tractor' | 'three_wheeler';

export type UnitType = 'sack' | 'crate' | 'quintal';

export type CargoCategory = 'vegetables' | 'fruits' | 'grains' | 'kirana' | 'handcrafts' | 'other';

export type MandiDistanceCategory = 'nearby' | 'regional' | 'terminal';

export type GeoPoint = {
  latitude: number;
  longitude: number;
  name: string;
  district?: string;
  address?: string;
};

export type TransportRide = {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  fromVillage: string;
  toMarket: string;
  district: string;
  departureDate: string;
  departureTime: string;
  availableCapacityPercent: number; // e.g. 45%
  availableWeightKg: number; // e.g. 400 kg
  farePerUnit: number; // e.g. 150 per sack
  unitType: UnitType;
  estimatedMarketDistanceKm: number;
  pickupHub: string;
  isVerified: boolean;
  fromCoords?: GeoPoint;
  toCoords?: GeoPoint;
  depotCoords?: GeoPoint;
  mandiCategory?: MandiDistanceCategory;
  voiceSummary: {
    mr: string;
    hi: string;
    en: string;
  };
};

export type TransportBooking = {
  id: string;
  rideId: string;
  userName: string;
  userPhone: string;
  cargoCategory: CargoCategory;
  quantity: number;
  unitType: UnitType;
  totalFare: number;
  estimatedSavings: number;
  status: 'confirmed' | 'in_transit' | 'delivered';
  bookedAt: string;
  pickupHub: string;
};

export type TrackingPhase = 'approaching_source' | 'en_route_mandi';

export type RoutePoint = [number, number]; // [longitude, latitude]
