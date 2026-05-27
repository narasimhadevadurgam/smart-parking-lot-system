const { TicketStatus } = require('./enums');

/**
 * Ticket represents a parking session.
 * Created at check-in, completed at check-out.
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

  constructor(vehicle, spot) {
    this.#id = `T-${Ticket.#nextId++}`;
    this.#vehicle = vehicle;
    this.#spot = spot;
    this.#entryTime = new Date();
    this.#exitTime = null;
    this.#status = TicketStatus.ACTIVE;
    this.#amount = 0;
  }

  get id() {
    return this.#id;
  }

  get vehicle() {
    return this.#vehicle;
  }

  get spot() {
    return this.#spot;
  }

  get entryTime() {
    return this.#entryTime;
  }

  get exitTime() {
    return this.#exitTime;
  }

  get status() {
    return this.#status;
  }

  get amount() {
    return this.#amount;
  }

  /**
   * Get duration in hours (rounded up)
   */
  getDurationHours() {
    const exit = this.#exitTime || new Date();
    const diffMs = exit - this.#entryTime;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return Math.max(hours, 1); // Minimum 1 hour charge
  }

  /**
   * Mark ticket as paid and record exit time
   */
  complete(amount) {
    this.#exitTime = new Date();
    this.#amount = amount;
    this.#status = TicketStatus.PAID;
  }

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
   * Reset the static counter (useful for testing)
   */
  static resetCounter() {
    Ticket.#nextId = 1;
  }
}

module.exports = { Ticket };
