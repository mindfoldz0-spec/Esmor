import type { CargoCategory, TransportBooking, TransportRide, UnitType } from '@/types/transport';

/** Estimate for chartering a tempo outright for a 50–80 km run. */
const PRIVATE_CHARTER_ESTIMATE = 1800;

export type BookingRequest = {
  ride: TransportRide;
  userName: string;
  userPhone: string;
  cargoCategory: CargoCategory;
  quantity: number;
};

/**
 * Build a confirmed booking from a ride and a quantity.
 * Shared by the native (SQLite) and web (localStorage) stores so both
 * compute fare and savings identically.
 */
export function createTransportBooking(params: BookingRequest): TransportBooking {
  const totalFare = params.ride.farePerUnit * params.quantity;

  return {
    id: `book-${Date.now()}`,
    rideId: params.ride.id,
    userName: params.userName,
    userPhone: params.userPhone,
    cargoCategory: params.cargoCategory,
    quantity: params.quantity,
    unitType: params.ride.unitType as UnitType,
    totalFare,
    estimatedSavings: Math.max(0, PRIVATE_CHARTER_ESTIMATE - totalFare),
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
    pickupHub: params.ride.pickupHub,
  };
}
