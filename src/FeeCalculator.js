const { VehicleType } = require('./enums');

/**
 * Strategy Pattern for fee calculation.
 * Different strategies can be swapped without changing the ParkingLot class.
 * 
 * Open/Closed Principle: New fee strategies can be added without modifying existing code.
 */

// Base strategy interface
class FeeStrategy {
  calculate(ticket) {
    throw new Error('FeeStrategy.calculate() must be implemented by subclass.');
  }
}

/**
 * Hourly rate fee strategy.
 * Charges per hour based on vehicle type.
 */
class HourlyFeeStrategy extends FeeStrategy {
  #rates;

  constructor(rates = {}) {
    super();
    this.#rates = {
      [VehicleType.MOTORCYCLE]: rates.motorcycle || 10,
      [VehicleType.CAR]: rates.car || 20,
      [VehicleType.BUS]: rates.bus || 50,
    };
  }

  calculate(ticket) {
    const hours = ticket.getDurationHours();
    const rate = this.#rates[ticket.vehicle.type];
    return hours * rate;
  }

  getRates() {
    return { ...this.#rates };
  }
}

/**
 * Flat rate + hourly fee strategy.
 * Charges a flat entry fee plus hourly rate after the first hour.
 */
class FlatPlusHourlyStrategy extends FeeStrategy {
  #flatFees;
  #hourlyRates;

  constructor(flatFees = {}, hourlyRates = {}) {
    super();
    this.#flatFees = {
      [VehicleType.MOTORCYCLE]: flatFees.motorcycle || 5,
      [VehicleType.CAR]: flatFees.car || 10,
      [VehicleType.BUS]: flatFees.bus || 20,
    };
    this.#hourlyRates = {
      [VehicleType.MOTORCYCLE]: hourlyRates.motorcycle || 8,
      [VehicleType.CAR]: hourlyRates.car || 15,
      [VehicleType.BUS]: hourlyRates.bus || 40,
    };
  }

  calculate(ticket) {
    const hours = ticket.getDurationHours();
    const flat = this.#flatFees[ticket.vehicle.type];
    const hourly = this.#hourlyRates[ticket.vehicle.type];

    if (hours <= 1) return flat;
    return flat + (hours - 1) * hourly;
  }
}

module.exports = { FeeStrategy, HourlyFeeStrategy, FlatPlusHourlyStrategy };
