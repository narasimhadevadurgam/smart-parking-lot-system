const { VehicleType, SpotSize, TicketStatus } = require('./enums');
const { Vehicle, Motorcycle, Car, Bus } = require('./Vehicle');
const { ParkingSpot } = require('./ParkingSpot');
const { Floor } = require('./Floor');
const { Ticket } = require('./Ticket');
const { FeeStrategy, HourlyFeeStrategy, FlatPlusHourlyStrategy } = require('./FeeCalculator');
const { SpotAllocationStrategy, FirstAvailableStrategy, NearestFirstStrategy } = require('./SpotAllocationStrategy');
const { EntryGate } = require('./EntryGate');
const { ExitGate } = require('./ExitGate');
const { DisplayPanel } = require('./DisplayPanel');
const { ParkingLot } = require('./ParkingLot');
const { Membership, MembershipType } = require('./Membership');
const { PaymentProcessor, PaymentMethod, PaymentStatus, Payment } = require('./PaymentProcessor');

module.exports = {
  // Enums
  VehicleType,
  SpotSize,
  TicketStatus,
  MembershipType,
  PaymentMethod,
  PaymentStatus,

  // Core Classes
  Vehicle,
  Motorcycle,
  Car,
  Bus,
  ParkingSpot,
  Floor,
  Ticket,

  // Strategy: Fee Calculation
  FeeStrategy,
  HourlyFeeStrategy,
  FlatPlusHourlyStrategy,

  // Strategy: Spot Allocation
  SpotAllocationStrategy,
  FirstAvailableStrategy,
  NearestFirstStrategy,

  // Gate Classes
  EntryGate,
  ExitGate,

  // Display
  DisplayPanel,

  // Membership & Payment
  Membership,
  PaymentProcessor,
  Payment,

  // Facade
  ParkingLot,
};
