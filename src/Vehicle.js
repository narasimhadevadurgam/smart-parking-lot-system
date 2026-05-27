const { VehicleType, SpotSize } = require('./enums');

/**
 * Base Vehicle class
 * Each vehicle has a type, license plate, and a required spot size.
 */
class Vehicle {
  #licensePlate;
  #type;
  #requiredSpotSize;

  constructor(licensePlate, type, requiredSpotSize) {
    if (new.target === Vehicle) {
      throw new Error('Vehicle is abstract and cannot be instantiated directly.');
    }
    this.#licensePlate = licensePlate;
    this.#type = type;
    this.#requiredSpotSize = requiredSpotSize;
  }

  get licensePlate() {
    return this.#licensePlate;
  }

  get type() {
    return this.#type;
  }

  get requiredSpotSize() {
    return this.#requiredSpotSize;
  }
}

class Motorcycle extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.MOTORCYCLE, SpotSize.SMALL);
  }
}

class Car extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.CAR, SpotSize.MEDIUM);
  }
}

class Bus extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.BUS, SpotSize.LARGE);
  }
}

module.exports = { Vehicle, Motorcycle, Car, Bus };
