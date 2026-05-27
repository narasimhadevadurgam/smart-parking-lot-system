/**
 * Enumerations for the Parking Lot System
 */

const VehicleType = Object.freeze({
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
  BUS: 'bus',
});

const SpotSize = Object.freeze({
  SMALL: 'small',     // fits motorcycle
  MEDIUM: 'medium',   // fits car
  LARGE: 'large',     // fits bus
});

const TicketStatus = Object.freeze({
  ACTIVE: 'active',
  PAID: 'paid',
});

module.exports = { VehicleType, SpotSize, TicketStatus };
