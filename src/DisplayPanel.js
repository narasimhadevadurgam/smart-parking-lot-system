/**
 * DisplayPanel shows real-time availability of parking spots.
 *
 * Observer-like behavior: Gets called whenever a vehicle parks or leaves
 * to recalculate and display availability per floor per spot type.
 *
 * Single Responsibility: Only handles display/reporting of availability.
 */
class DisplayPanel {
  #floors;
  #availability;

  /**
   * @param {Floor[]} floors - Reference to the parking lot floors
   */
  constructor(floors) {
    this.#floors = floors;
    this.#availability = [];
    this.update();
  }

  /**
   * Recalculate availability across all floors.
   * Should be called after every park/vacate operation.
   */
  update() {
    this.#availability = this.#floors.map((floor) => floor.getAvailability());
  }

  /**
   * Get current availability data.
   * @returns {object[]} Availability per floor
   */
  getAvailability() {
    return this.#availability;
  }

  /**
   * Display availability to console (simulates a physical display board).
   */
  show() {
    console.log('\n=== PARKING AVAILABILITY ===');
    this.#availability.forEach((floor) => {
      console.log(
        `  Floor ${floor.floor}: ${floor.occupancy} | ` +
        `Free: S=${floor.available.small} M=${floor.available.medium} L=${floor.available.large}`
      );
    });
    console.log('============================\n');
  }

  /**
   * Check if the entire lot is full.
   * @returns {boolean}
   */
  isFull() {
    return this.#availability.every(
      (floor) => floor.available.small === 0 && floor.available.medium === 0 && floor.available.large === 0
    );
  }
}

module.exports = { DisplayPanel };
