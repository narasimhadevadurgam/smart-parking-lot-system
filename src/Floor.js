const { ParkingSpot } = require('./ParkingSpot');
const { SpotSize } = require('./enums');

/**
 * Floor represents one level of the parking lot.
 * Composition: A Floor contains multiple ParkingSpots.
 * 
 * Single Responsibility: Manages spots on a single floor.
 */
class Floor {
  #floorNumber;
  #spots;

  /**
   * @param {number} floorNumber - Floor identifier
   * @param {object} config - { small: number, medium: number, large: number }
   */
  constructor(floorNumber, config = { small: 5, medium: 10, large: 2 }) {
    this.#floorNumber = floorNumber;
    this.#spots = [];

    let spotNumber = 1;

    // Create small spots (motorcycle)
    for (let i = 0; i < config.small; i++) {
      this.#spots.push(new ParkingSpot(floorNumber, spotNumber++, SpotSize.SMALL));
    }

    // Create medium spots (car)
    for (let i = 0; i < config.medium; i++) {
      this.#spots.push(new ParkingSpot(floorNumber, spotNumber++, SpotSize.MEDIUM));
    }

    // Create large spots (bus)
    for (let i = 0; i < config.large; i++) {
      this.#spots.push(new ParkingSpot(floorNumber, spotNumber++, SpotSize.LARGE));
    }
  }

  get floorNumber() {
    return this.#floorNumber;
  }

  get spots() {
    return [...this.#spots];
  }

  /**
   * Find the first available spot that can fit the vehicle.
   * Prefers exact-size match first, then larger spots.
   */
  findAvailableSpot(vehicle) {
    // First try exact match
    const exactMatch = this.#spots.find(
      (spot) => !spot.isOccupied && spot.size === vehicle.requiredSpotSize
    );
    if (exactMatch) return exactMatch;

    // Then try any spot that can fit
    return this.#spots.find((spot) => spot.canFit(vehicle)) || null;
  }

  /**
   * Find a spot by its ID
   */
  findSpotById(spotId) {
    return this.#spots.find((spot) => spot.id === spotId) || null;
  }

  /**
   * Get availability summary for this floor
   */
  getAvailability() {
    const available = { small: 0, medium: 0, large: 0 };
    const total = { small: 0, medium: 0, large: 0 };

    this.#spots.forEach((spot) => {
      total[spot.size]++;
      if (!spot.isOccupied) {
        available[spot.size]++;
      }
    });

    return {
      floor: this.#floorNumber,
      total,
      available,
      occupancy: `${this.#spots.filter((s) => s.isOccupied).length}/${this.#spots.length}`,
    };
  }
}

module.exports = { Floor };
