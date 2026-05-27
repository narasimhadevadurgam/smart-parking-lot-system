const { ParkingSpot } = require('./ParkingSpot');
const { SpotSize } = require('./enums');

/**
 * Floor represents one level of the parking lot.
 *
 * Composition: A Floor owns and manages multiple ParkingSpots.
 * Single Responsibility: Manages spot allocation within a single floor.
 */
class Floor {
  #floorNumber;
  #spots;

  /**
   * Create a floor with the specified spot configuration.
   *
   * @param {number} floorNumber - Floor identifier (1-indexed)
   * @param {object} config - Spot counts: { small: number, medium: number, large: number }
   */
  constructor(floorNumber, config = { small: 5, medium: 10, large: 2 }) {
    this.#floorNumber = floorNumber;
    this.#spots = [];

    let spotNumber = 1;

    for (let i = 0; i < (config.small || 0); i++) {
      this.#spots.push(new ParkingSpot(floorNumber, spotNumber++, SpotSize.SMALL));
    }

    for (let i = 0; i < (config.medium || 0); i++) {
      this.#spots.push(new ParkingSpot(floorNumber, spotNumber++, SpotSize.MEDIUM));
    }

    for (let i = 0; i < (config.large || 0); i++) {
      this.#spots.push(new ParkingSpot(floorNumber, spotNumber++, SpotSize.LARGE));
    }
  }

  /** @returns {number} Floor number */
  get floorNumber() {
    return this.#floorNumber;
  }

  /** @returns {ParkingSpot[]} Copy of spots array (prevents external mutation) */
  get spots() {
    return [...this.#spots];
  }

  /**
   * Find the first available spot that can fit the vehicle.
   * Algorithm: Prefers exact-size match first to minimize waste,
   * then falls back to any larger spot.
   *
   * @param {Vehicle} vehicle - The vehicle needing a spot
   * @returns {ParkingSpot|null} Available spot, or null if none found
   */
  findAvailableSpot(vehicle) {
    // First try exact size match (optimal allocation)
    const exactMatch = this.#spots.find(
      (spot) => !spot.isOccupied && spot.size === vehicle.requiredSpotSize
    );
    if (exactMatch) return exactMatch;

    // Fallback: any spot that can physically fit the vehicle
    return this.#spots.find((spot) => spot.canFit(vehicle)) || null;
  }

  /**
   * Find a specific spot by its ID.
   *
   * @param {string} spotId - Spot identifier (e.g., "F1-S3")
   * @returns {ParkingSpot|null} The spot, or null if not found
   */
  findSpotById(spotId) {
    return this.#spots.find((spot) => spot.id === spotId) || null;
  }

  /**
   * Get availability summary for this floor.
   *
   * @returns {object} { floor, total, available, occupancy }
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

    const occupied = this.#spots.filter((s) => s.isOccupied).length;

    return {
      floor: this.#floorNumber,
      total,
      available,
      occupied,
      totalSpots: this.#spots.length,
      occupancy: `${occupied}/${this.#spots.length}`,
    };
  }
}

module.exports = { Floor };
