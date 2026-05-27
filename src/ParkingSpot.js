const { SpotSize } = require('./enums');

/**
 * ParkingSpot represents a single parking space on a floor.
 *
 * Single Responsibility: Only manages its own occupancy state.
 * Encapsulation: All fields are private, accessed via getters.
 */
class ParkingSpot {
  #id;
  #floorNumber;
  #spotNumber;
  #size;
  #isOccupied;
  #vehicle;

  /**
   * @param {number} floorNumber - Which floor this spot is on
   * @param {number} spotNumber - Spot number within the floor
   * @param {string} size - SpotSize enum value (small/medium/large)
   */
  constructor(floorNumber, spotNumber, size) {
    this.#id = `F${floorNumber}-S${spotNumber}`;
    this.#floorNumber = floorNumber;
    this.#spotNumber = spotNumber;
    this.#size = size;
    this.#isOccupied = false;
    this.#vehicle = null;
  }

  /** @returns {string} Unique spot identifier (e.g., "F1-S3") */
  get id() {
    return this.#id;
  }

  /** @returns {number} Floor number */
  get floorNumber() {
    return this.#floorNumber;
  }

  /** @returns {number} Spot number on this floor */
  get spotNumber() {
    return this.#spotNumber;
  }

  /** @returns {string} Spot size (small/medium/large) */
  get size() {
    return this.#size;
  }

  /** @returns {boolean} Whether the spot is currently occupied */
  get isOccupied() {
    return this.#isOccupied;
  }

  /** @returns {Vehicle|null} The vehicle parked here, or null */
  get vehicle() {
    return this.#vehicle;
  }

  /**
   * Check if this spot can accommodate the given vehicle.
   * A larger spot can fit a smaller vehicle, but not vice versa.
   *
   * @param {Vehicle} vehicle - The vehicle to check
   * @returns {boolean} True if the spot can fit the vehicle
   */
  canFit(vehicle) {
    if (this.#isOccupied) return false;

    const sizeOrder = { small: 1, medium: 2, large: 3 };
    return sizeOrder[this.#size] >= sizeOrder[vehicle.requiredSpotSize];
  }

  /**
   * Park a vehicle in this spot.
   *
   * @param {Vehicle} vehicle - The vehicle to park
   * @throws {Error} If the spot is already occupied
   */
  park(vehicle) {
    if (this.#isOccupied) {
      throw new Error(`Spot ${this.#id} is already occupied.`);
    }
    this.#vehicle = vehicle;
    this.#isOccupied = true;
  }

  /**
   * Remove the vehicle from this spot.
   *
   * @returns {Vehicle} The vehicle that was parked
   * @throws {Error} If the spot is already empty
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

  /**
   * Serialize spot state for display/logging.
   * @returns {object} Plain object representation
   */
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
