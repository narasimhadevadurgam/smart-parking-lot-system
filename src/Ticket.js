const { TicketStatus } = require('./enums');

/**
 * Ticket represents a single parking session.
 * Created at check-in, completed at check-out with fee.
 *
 * Single Responsibility: Tracks one parking session's lifecycle.
 * Encapsulation: All fields private, state transitions controlled via methods.
 */
class Ticket {
  static #nextId = 1;

  #id;
  #vehicle;
  #spot;
  #entryTime;
  #exitTime;
  #status;
  #amount;

  /**
   * Create a new ticket when a vehicle checks in.
   *
   * @param {Vehicle} vehicle - The vehicle being parked
   * @param {ParkingSpot} spot - The assigned parking spot
   */
  constructor(vehicle, spot) {
    this.#id = `T-${Ticket.#nextId++}`;
    this.#vehicle = vehicle;
    this.#spot = spot;
    this.#entryTime = new Date();
    this.#exitTime = null;
    this.#status = TicketStatus.ACTIVE;
    this.#amount = 0;
  }

  /** @returns {string} Ticket ID (e.g., "T-1") */
  get id() {
    return this.#id;
  }

  /** @returns {Vehicle} The parked vehicle */
  get vehicle() {
    return this.#vehicle;
  }

  /** @returns {ParkingSpot} The assigned spot */
  get spot() {
    return this.#spot;
  }

  /** @returns {Date} When the vehicle entered */
  get entryTime() {
    return this.#entryTime;
  }

  /** @returns {Date|null} When the vehicle exited (null if still parked) */
  get exitTime() {
    return this.#exitTime;
  }

  /** @returns {string} Ticket status (active/paid) */
  get status() {
    return this.#status;
  }

  /** @returns {number} Fee amount (0 until checkout) */
  get amount() {
    return this.#amount;
  }

  /**
   * Calculate parking duration in hours (rounded up, minimum 1 hour).
   * Uses current time if vehicle hasn't exited yet.
   *
   * @returns {number} Duration in hours (always >= 1)
   */
  getDurationHours() {
    const exit = this.#exitTime || new Date();
    const diffMs = exit - this.#entryTime;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return Math.max(hours, 1); // Minimum 1 hour charge
  }

  /**
   * Complete the ticket: record exit time, set fee, mark as paid.
   * Called during check-out after fee calculation.
   *
   * @param {number} amount - Calculated fee amount
   */
  complete(amount) {
    if (this.#status === TicketStatus.PAID) {
      throw new Error(`Ticket ${this.#id} is already completed.`);
    }
    this.#exitTime = new Date();
    this.#amount = amount;
    this.#status = TicketStatus.PAID;
  }

  /**
   * Serialize ticket for display/logging.
   * @returns {object} Plain object representation
   */
  toJSON() {
    return {
      id: this.#id,
      vehiclePlate: this.#vehicle.licensePlate,
      vehicleType: this.#vehicle.type,
      spotId: this.#spot.id,
      entryTime: this.#entryTime.toISOString(),
      exitTime: this.#exitTime ? this.#exitTime.toISOString() : null,
      durationHours: this.getDurationHours(),
      amount: this.#amount,
      status: this.#status,
    };
  }

  /**
   * Reset the static ID counter. Used only in tests.
   */
  static resetCounter() {
    Ticket.#nextId = 1;
  }
}

module.exports = { Ticket };
