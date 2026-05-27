const { SpotSize } = require('./enums');

/**
 * ParkingSpot represents a single parking space.
 * It knows its size, floor, spot number, and whether it's occupied.
 * 
 * Single Responsibility: Only manages its own occupancy state.
 */
class ParkingSpot {
  #id;
  #floorNumber;
  #spotNumber;
  #size;
  #isOccupied;
  #vehicle;

  constructor(floorNumber, spotNumber, size) {
    this.#id = `F${floorNumber}-S${spotNumber}`;
    this.#floorNumber = floorNumber;
    this.#spotNumber = spotNumber;
    this.#size = size;
    this.#isOccupied = false;
    this.#vehicle = null;
  }

  get id() {
    return this.#id;
  }

  get floorNumber() {
    return this.#floorNumber;
  }

  get spotNumber() {
    return this.#spotNumber;
  }

  get size() {
    return this.#size;
  }

  get isOccupied() {
    return this.#isOccupied;
  }

  get vehicle() {
    return this.#vehicle;
  }

  /**
   * Check if this spot can fit the given vehicle
   */
  canFit(vehicle) {
    if (this.#isOccupied) return false;

    const sizeOrder = { small: 1, medium: 2, large: 3 };
    return sizeOrder[this.#size] >= sizeOrder[vehicle.requiredSpotSize];
  }

  /**
   * Park a vehicle in this spot
   */
  park(vehicle) {
    if (this.#isOccupied) {
      throw new Error(`Spot ${this.#id} is already occupied.`);
    }
    this.#vehicle = vehicle;
    this.#isOccupied = true;
  }

  /**
   * Remove the vehicle from this spot
   */
  vacate() {
    if (!this.#isOccupied) {
      throw new Error(`Spot ${this.#id} is already empty.`);
    }
    const vehicle = this.#vehicle;
    this.#vehicle = null;
    this.#isOccupied = false;
    return vehicle;
  }

  toJSON() {
    return {
      id: this.#id,
      floor: this.#floorNumber,
      spot: this.#spotNumber,
      size: this.#size,
      isOccupied: this.#isOccupied,
      vehicle: this.#vehicle ? this.#vehicle.licensePlate : null,
    };
  }
}

module.exports = { ParkingSpot };
