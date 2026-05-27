const { VehicleType } = require('./enums');

/**
 * Strategy Pattern for fee calculation.
 *
 * Open/Closed Principle: New fee strategies can be added by creating
 * new subclasses without modifying existing code.
 *
 * Dependency Inversion: ParkingLot depends on the FeeStrategy abstraction,
 * not on any concrete implementation.
 */

/**
 * Abstract base class for fee calculation strategies.
 * All concrete strategies must implement calculate().
 */
class FeeStrategy {
  /**
   * Calculate the parking fee for a given ticket.
   *
   * @param {Ticket} ticket - The parking ticket with duration and vehicle info
   * @returns {number} Fee amount
   * @throws {Error} If not implemented by subclass
   */
  calculate(ticket) {
    throw new Error('FeeStrategy.calculate() must be implemented by subclass.');
  }
}

/**
 * Hourly rate fee strategy.
 * Charges a fixed rate per hour based on vehicle type.
 *
 * Default rates: Motorcycle ₹10/hr, Car ₹20/hr, Bus ₹50/hr
 */
class HourlyFeeStrategy extends FeeStrategy {
  #rates;

  /**
   * @param {object} rates - Custom rates: { motorcycle, car, bus }
   */
  constructor(rates = {}) {
    super();
    this.#rates = {
      [VehicleType.MOTORCYCLE]: rates.motorcycle || 10,
      [VehicleType.CAR]: rates.car || 20,
      [VehicleType.BUS]: rates.bus || 50,
    };
  }

  /**
   * Calculate fee: hours × rate per vehicle type.
   *
   * @param {Ticket} ticket - Active or completed ticket
   * @returns {number} Total fee
   */
  calculate(ticket) {
    const hours = ticket.getDurationHours();
    const rate = this.#rates[ticket.vehicle.type];
    return hours * rate;
  }

  /** @returns {object} Current rate configuration */
  getRates() {
    return { ...this.#rates };
  }
}

/**
 * Flat rate + hourly fee strategy.
 * Charges a flat entry fee for the first hour, then hourly rate after that.
 *
 * Example: Car parks for 3 hours → ₹10 (flat) + 2 × ₹15 (hourly) = ₹40
 */
class FlatPlusHourlyStrategy extends FeeStrategy {
  #flatFees;
  #hourlyRates;

  /**
   * @param {object} flatFees - Entry fees: { motorcycle, car, bus }
   * @param {object} hourlyRates - Per-hour rates after first hour
   */
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

  /**
   * Calculate fee: flat fee + (hours - 1) × hourly rate.
   * First hour is covered by the flat fee.
   *
   * @param {Ticket} ticket - Active or completed ticket
   * @returns {number} Total fee
   */
  calculate(ticket) {
    const hours = ticket.getDurationHours();
    const flat = this.#flatFees[ticket.vehicle.type];
    const hourly = this.#hourlyRates[ticket.vehicle.type];

    if (hours <= 1) return flat;
    return flat + (hours - 1) * hourly;
  }
}

module.exports = { FeeStrategy, HourlyFeeStrategy, FlatPlusHourlyStrategy };
