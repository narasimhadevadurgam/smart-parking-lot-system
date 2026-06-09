const { Floor } = require('./Floor');
const { Ticket } = require('./Ticket');
const { HourlyFeeStrategy } = require('./FeeCalculator');
const { FirstAvailableStrategy } = require('./SpotAllocationStrategy');
const { EntryGate } = require('./EntryGate');
const { ExitGate } = require('./ExitGate');
const { DisplayPanel } = require('./DisplayPanel');
const { PaymentProcessor } = require('./PaymentProcessor');

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
  #paymentProcessor;
  #lock; // Promise-based mutex for concurrency

  /**
   * @param {string} name - Parking lot name
   * @param {object[]} floorConfigs - Array of { small, medium, large } configs per floor
   * @param {FeeStrategy} feeStrategy - Fee calculation strategy
   * @param {SpotAllocationStrategy} allocationStrategy - Spot allocation strategy
   */
  constructor(name, floorConfigs, feeStrategy, allocationStrategy) {
    if (ParkingLot.#instance) {
      throw new Error('ParkingLot instance already exists. Use ParkingLot.resetInstance() before creating a new one.');
    }

    if (!floorConfigs || !Array.isArray(floorConfigs) || floorConfigs.length === 0) {
      throw new Error('floorConfigs must be a non-empty array of floor configurations.');
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

    // Create payment processor
    this.#paymentProcessor = new PaymentProcessor();

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

  get paymentProcessor() {
    return this.#paymentProcessor;
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
   * Integrates PaymentProcessor for membership discounts.
   * Uses lock for concurrency control.
   *
   * @param {string} licensePlate
   * @param {string} paymentMethod - 'cash', 'card', or 'upi' (default: 'cash')
   * @returns {Promise<{ticket, amount, payment}>}
   */
  async checkOut(licensePlate, paymentMethod = 'cash') {
    return this.#withLock(async () => {
      const { ticket, amount } = this.#exitGate.processExit(licensePlate);
      const payment = this.#paymentProcessor.processPayment(ticket, amount, paymentMethod);
      return { ticket, amount: payment.finalAmount, payment };
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
   * Ensures only one check-in/check-out executes at a time.
   * Errors are logged and re-thrown (not swallowed).
   *
   * The .catch(() => {}) on the lock chain absorbs rejections so that
   * subsequent operations can still execute — a failed check-in should
   * not block future check-ins from running.
   *
   * @param {Function} fn - Async function to execute under lock
   * @returns {Promise}
   */
  #withLock(fn) {
    const execute = this.#lock.then(fn).catch((err) => {
      console.error(`[ParkingLot Error] ${err.message}`);
      throw err;
    });
    // Absorb rejection so the chain stays alive for next operation
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
