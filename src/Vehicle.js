const { VehicleType, SpotSize } = require('./enums');

/**
 * Base Vehicle class (abstract).
 * Represents any vehicle that can park in the lot.
 * Subclasses: Motorcycle, Car, Bus.
 *
 * Uses private fields for encapsulation.
 * Liskov Substitution: All subclasses can be used wherever Vehicle is expected.
 */
class Vehicle {
  #licensePlate;
  #type;
  #requiredSpotSize;

  /**
   * @param {string} licensePlate - Unique vehicle identifier
   * @param {string} type - VehicleType enum value
   * @param {string} requiredSpotSize - Minimum SpotSize needed
   * @throws {Error} If instantiated directly (abstract class)
   */
  constructor(licensePlate, type, requiredSpotSize) {
    if (new.target === Vehicle) {
      throw new Error('Vehicle is abstract and cannot be instantiated directly.');
    }
    if (!licensePlate || typeof licensePlate !== 'string') {
      throw new Error('License plate must be a non-empty string.');
    }
    this.#licensePlate = licensePlate;
    this.#type = type;
    this.#requiredSpotSize = requiredSpotSize;
  }

  /** @returns {string} Vehicle license plate */
  get licensePlate() {
    return this.#licensePlate;
  }

  /** @returns {string} Vehicle type (motorcycle/car/bus) */
  get type() {
    return this.#type;
  }

  /** @returns {string} Minimum spot size required */
  get requiredSpotSize() {
    return this.#requiredSpotSize;
  }
}

/**
 * Motorcycle - requires a SMALL spot.
 */
class Motorcycle extends Vehicle {
  /** @param {string} licensePlate - Unique vehicle identifier */
  constructor(licensePlate) {
    super(licensePlate, VehicleType.MOTORCYCLE, SpotSize.SMALL);
  }
}

/**
 * Car - requires a MEDIUM spot.
 */
class Car extends Vehicle {
  /** @param {string} licensePlate - Unique vehicle identifier */
  constructor(licensePlate) {
    super(licensePlate, VehicleType.CAR, SpotSize.MEDIUM);
  }
}

/**
 * Bus - requires a LARGE spot.
 */
class Bus extends Vehicle {
  /** @param {string} licensePlate - Unique vehicle identifier */
  constructor(licensePlate) {
    super(licensePlate, VehicleType.BUS, SpotSize.LARGE);
  }
}

module.exports = { Vehicle, Motorcycle, Car, Bus };
