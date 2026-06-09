/**
 * Strategy Pattern for spot allocation.
 *
 * Open/Closed Principle: New allocation algorithms can be added
 * without modifying existing code — just create a new subclass.
 *
 * Dependency Inversion: ParkingLot depends on the abstraction,
 * not on any specific allocation logic.
 */

/**
 * Abstract base class for spot allocation strategies.
 */
class SpotAllocationStrategy {
  /**
   * Find an available spot for the given vehicle across all floors.
   *
   * @param {Vehicle} vehicle - The vehicle needing a spot
   * @param {Floor[]} floors - Array of floors to search
   * @returns {ParkingSpot|null} The allocated spot, or null if none available
   */
  allocateSpot(vehicle, floors) {
    throw new Error('SpotAllocationStrategy.allocateSpot() must be implemented by subclass.');
  }
}

/**
 * FirstAvailableStrategy - picks the first available matching spot, floor by floor.
 * Prefers exact-size match first to minimize waste.
 */
class FirstAvailableStrategy extends SpotAllocationStrategy {
  /**
   * @param {Vehicle} vehicle
   * @param {Floor[]} floors
   * @returns {ParkingSpot|null}
   */
  allocateSpot(vehicle, floors) {
    // First pass: exact size match across all floors
    for (const floor of floors) {
      const exactMatch = floor.spots.find(
        (spot) => !spot.isOccupied && spot.size === vehicle.requiredSpotSize
      );
      if (exactMatch) return exactMatch;
    }

    // Second pass: any spot that can fit the vehicle
    for (const floor of floors) {
      const anyMatch = floor.spots.find((spot) => spot.canFit(vehicle));
      if (anyMatch) return anyMatch;
    }

    return null;
  }
}

/**
 * NearestFirstStrategy - finds the closest available spot to the gate.
 * Assumes lower floor number = closer to gate, lower spot number = closer to entrance.
 */
class NearestFirstStrategy extends SpotAllocationStrategy {
  /**
   * @param {Vehicle} vehicle
   * @param {Floor[]} floors
   * @returns {ParkingSpot|null}
   */
  allocateSpot(vehicle, floors) {
    // Search floor by floor (floor 1 = nearest to gate)
    for (const floor of floors) {
      // Within each floor, find the first (nearest) spot that fits
      const spot = floor.spots.find((spot) => spot.canFit(vehicle));
      if (spot) return spot;
    }
    return null;
  }
}

module.exports = { SpotAllocationStrategy, FirstAvailableStrategy, NearestFirstStrategy };
