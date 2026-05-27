const { Floor } = require('./Floor');
const { Ticket } = require('./Ticket');
const { HourlyFeeStrategy } = require('./FeeCalculator');

/**
 * ParkingLot is the main facade class.
 * Composition: ParkingLot → Floor[] → ParkingSpot[]
 * 
 * Singleton Pattern: Only one parking lot instance.
 * Dependency Inversion: Depends on FeeStrategy abstraction, not concrete implementation.
 * 
 * Handles concurrency via a simple lock mechanism for check-in/check-out.
 */
class ParkingLot {
  static #instance = null;

  #name;
  #floors;
  #activeTickets; // Map<licensePlate, Ticket>
  #completedTickets; // Array of completed tickets
  #feeStrategy;
  #lock; // Simple mutex for concurrency

  constructor(name, floorConfigs, feeStrategy) {
    if (ParkingLot.#instance) {
      return ParkingLot.#instance;
    }

    this.#name = name;
    this.#floors = [];
    this.#activeTickets = new Map();
    this.#completedTickets = [];
    this.#feeStrategy = feeStrategy || new HourlyFeeStrategy();
    this.#lock = Promise.resolve();

    // Create floors based on config
    floorConfigs.forEach((config, index) => {
      this.#floors.push(new Floor(index + 1, config));
    });

    ParkingLot.#instance = this;
  }

  get name() {
    return this.#name;
  }

  get totalFloors() {
    return this.#floors.length;
  }

  /**
   * Set a different fee calculation strategy
   * (Strategy Pattern - swap at runtime)
   */
  setFeeStrategy(strategy) {
    this.#feeStrategy = strategy;
  }

  /**
   * Check in a vehicle - find a spot and issue a ticket.
   * Uses lock to handle concurrent access.
   */
  async checkIn(vehicle) {
    return this.#withLock(async () => {
      // Check if vehicle is already parked
      if (this.#activeTickets.has(vehicle.licensePlate)) {
        throw new Error(`Vehicle ${vehicle.licensePlate} is already parked.`);
      }

      // Find available spot across all floors
      let spot = null;
      for (const floor of this.#floors) {
        spot = floor.findAvailableSpot(vehicle);
        if (spot) break;
      }

      if (!spot) {
        throw new Error(`No available spot for ${vehicle.type} (${vehicle.licensePlate}).`);
      }

      // Park the vehicle and create ticket
      spot.park(vehicle);
      const ticket = new Ticket(vehicle, spot);
      this.#activeTickets.set(vehicle.licensePlate, ticket);

      return ticket;
    });
  }

  /**
   * Check out a vehicle - calculate fee, vacate spot, complete ticket.
   * Uses lock to handle concurrent access.
   */
  async checkOut(licensePlate) {
    return this.#withLock(async () => {
      const ticket = this.#activeTickets.get(licensePlate);
      if (!ticket) {
        throw new Error(`No active ticket found for vehicle ${licensePlate}.`);
      }

      // Calculate fee
      const amount = this.#feeStrategy.calculate(ticket);

      // Vacate the spot
      ticket.spot.vacate();

      // Complete the ticket
      ticket.complete(amount);

      // Move from active to completed
      this.#activeTickets.delete(licensePlate);
      this.#completedTickets.push(ticket);

      return { ticket, amount };
    });
  }

  /**
   * Get real-time availability across all floors
   */
  getAvailability() {
    return {
      name: this.#name,
      floors: this.#floors.map((floor) => floor.getAvailability()),
      totalActive: this.#activeTickets.size,
    };
  }

  /**
   * Get availability for a specific floor
   */
  getFloorAvailability(floorNumber) {
    const floor = this.#floors[floorNumber - 1];
    if (!floor) {
      throw new Error(`Floor ${floorNumber} does not exist.`);
    }
    return floor.getAvailability();
  }

  /**
   * Find a vehicle by license plate
   */
  findVehicle(licensePlate) {
    const ticket = this.#activeTickets.get(licensePlate);
    if (!ticket) return null;
    return {
      licensePlate,
      spotId: ticket.spot.id,
      entryTime: ticket.entryTime,
      duration: ticket.getDurationHours(),
    };
  }

  /**
   * Get all active tickets
   */
  getActiveTickets() {
    return Array.from(this.#activeTickets.values()).map((t) => t.toJSON());
  }

  /**
   * Get completed tickets history
   */
  getHistory() {
    return this.#completedTickets.map((t) => t.toJSON());
  }

  /**
   * Simple lock mechanism for concurrency control.
   * Ensures only one check-in/check-out happens at a time.
   */
  #withLock(fn) {
    const execute = this.#lock.then(fn);
    this.#lock = execute.catch(() => {}); // prevent lock from breaking on error
    return execute;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance() {
    ParkingLot.#instance = null;
  }
}

module.exports = { ParkingLot };
