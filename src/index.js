const { VehicleType, SpotSize, TicketStatus } = require('./enums');
const { Vehicle, Motorcycle, Car, Bus } = require('./Vehicle');
const { ParkingSpot } = require('./ParkingSpot');
const { Floor } = require('./Floor');
const { Ticket } = require('./Ticket');
const { FeeStrategy, HourlyFeeStrategy, FlatPlusHourlyStrategy } = require('./FeeCalculator');
const { ParkingLot } = require('./ParkingLot');

module.exports = {
  // Enums
  VehicleType,
  SpotSize,
  TicketStatus,

  // Classes
  Vehicle,
  Motorcycle,
  Car,
  Bus,
  ParkingSpot,
  Floor,
  Ticket,
  FeeStrategy,
  HourlyFeeStrategy,
  FlatPlusHourlyStrategy,
  ParkingLot,
};
