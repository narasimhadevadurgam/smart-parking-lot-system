const { Floor } = require('./Floor');
const { Ticket } = require('./Ticket');
const { HourlyFeeStrategy } = require('./FeeCalculator');
const { FirstAvailableStrategy } = require('./SpotAllocationStrategy');
const { EntryGate } = require('./EntryGate');
const { ExitGate } = require('./ExitGate');
const { DisplayPanel } = require('./DisplayPanel');

/**
 * ParkingLot is the main facade class.
 * Composition: ParkingLot → Floor[] → ParkingSpot[]
 *
 * Singleton Pattern: Only one parking lot instance.
 * Uses EntryGate/ExitGate for vehicle flow.
 * Uses SpotAllocationStrategy for spot assignment.
 * Uses FeeStrategy for fee calculation.
 */
class ParkingLot {
  static #instance = null;

  #name;
  #floors;
  #activeTickets; // Map<licensePlate, Ticket>
  #completedTickets; // Array of completed tickets
  #feeStrategy;
  #allocationStrategy;
  #entryGate;
  #exitGate;
  #displayPanel;
  #lock; // Promise-based mutex for concurrency

  /**
   * @param {string} name - Parking lot name
   * @param {object[]} floorConfigs - Array of { small, medium, large } configs per floor
   * @param {FeeStrategy} feeStrategy - Fee calculation strategy
   * @param {SpotAllocationStrategy} allocationStrategy - Spot allocation strategy
   */
  constructor(name, floorConfigs, feeStrategy, allocationStrategy) {
    if (ParkingLot.#instance) {
      return ParkingLot.#instance;
    }

    this.#name = name;
    this.#floors = [];
    this.#activeTickets = new Map();
    this.#completedTickets = [];
    this.#feeStrategy = feeStrategy || new HourlyFeeStrategy();
    this.#allocationStrategy = allocationStrategy || new FirstAvailableStrategy();
    this.#lock = Promise.resolve();

    // Create floors based on config
    floorConfigs.forEach((config, index) => {
      this.#floors.push(new Floor(index + 1, config));
    });

    // Create display panel
    this.#displayPanel = new DisplayPanel(this.#floors);

    // Create gates
    this.#entryGate = new EntryGate(
      'ENTRY-1',
      this.#floors,
      this.#allocationStrategy,
      this.#activeTickets,
      this.#displayPanel
    );

    this.#exitGate = new ExitGate(
      'EXIT-1',
      this.#feeStrategy,
      this.#activeTickets,
      this.#completedTickets,
      this.#displayPanel
    );

    ParkingLot.#instance = this;
  }

  get name() {
    return this.#name;
  }

  get totalFloors() {
    return this.#floors.length;
  }

  get entryGate() {
    return this.#entryGate;
  }

  get exitGate() {
    return this.#exitGate;
  }

  get displayPanel() {
    return this.#displayPanel;
  }

  /**
   * Set a different fee calculation strategy (updates ExitGate too).
   * @param {FeeStrategy} strategy
   */
  setFeeStrategy(strategy) {
    this.#feeStrategy = strategy;
    this.#exitGate.setFeeStrategy(strategy);
  }

  /**
   * Set a different spot allocation strategy (updates EntryGate too).
   * @param {SpotAllocationStrategy} strategy
   */
  setAllocationStrategy(strategy) {
    this.#allocationStrategy = strategy;
    this.#entryGate.setAllocationStrategy(strategy);
  }

  /**
   * Check in a vehicle via the entry gate.
   * Uses lock for concurrency control.
   *
   * @param {Vehicle} vehicle
   * @returns {Promise<Ticket>}
   */
  async checkIn(vehicle) {
    return this.#withLock(async () => {
      return this.#entryGate.processEntry(vehicle);
    });
  }

  /**
   * Check out a vehicle via the exit gate.
   * Uses lock for concurrency control.
   *
   * @param {string} licensePlate
   * @returns {Promise<{ticket, amount}>}
   */
  async checkOut(licensePlate) {
    return this.#withLock(async () => {
      return this.#exitGate.processExit(licensePlate);
    });
  }

  /**
   * Get real-time availability across all floors.
   * @returns {object}
   */
  getAvailability() {
    this.#displayPanel.update();
    return {
      name: this.#name,
      floors: this.#displayPanel.getAvailability(),
      totalActive: this.#activeTickets.size,
    };
  }

  /**
   * Get availability for a specific floor.
   * @param {number} floorNumber
   * @returns {object}
   */
  getFloorAvailability(floorNumber) {
    const floor = this.#floors[floorNumber - 1];
    if (!floor) {
      throw new Error(`Floor ${floorNumber} does not exist.`);
    }
    return floor.getAvailability();
  }

  /**
   * Find a vehicle by license plate.
   * @param {string} licensePlate
   * @returns {object|null}
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
   * Get all active tickets.
   * @returns {object[]}
   */
  getActiveTickets() {
    return Array.from(this.#activeTickets.values()).map((t) => t.toJSON());
  }

  /**
   * Get completed tickets history.
   * @returns {object[]}
   */
  getHistory() {
    return this.#completedTickets.map((t) => t.toJSON());
  }

  /**
   * Promise-based mutex for concurrency control.
   * @param {Function} fn - Async function to execute under lock
   * @returns {Promise}
   */
  #withLock(fn) {
    const execute = this.#lock.then(fn).catch((err) => {
      console.error(`[ParkingLot Error] ${err.message}`);
      throw err;
    });
    this.#lock = execute.catch(() => {});
    return execute;
  }

  /**
   * Reset singleton (for testing).
   */
  static resetInstance() {
    ParkingLot.#instance = null;
  }
}

module.exports = { ParkingLot };
