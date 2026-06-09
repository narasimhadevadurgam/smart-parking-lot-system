const { Ticket } = require('./Ticket');

/**
 * EntryGate handles vehicle entry into the parking lot.
 *
 * Responsibilities:
 * - Scan vehicle number plate (accepts vehicle object)
 * - Use SpotAllocationStrategy to find a spot
 * - Generate and return a Ticket
 * - Deny entry if no spot available
 *
 * Dependency Inversion: Depends on SpotAllocationStrategy abstraction.
 * Single Responsibility: Only handles the entry flow.
 */
class EntryGate {
  #gateId;
  #floors;
  #allocationStrategy;
  #activeTickets; // Map<licensePlate, Ticket>
  #displayPanel;

  /**
   * @param {string} gateId - Unique gate identifier
   * @param {Floor[]} floors - Reference to parking lot floors
   * @param {SpotAllocationStrategy} allocationStrategy - Strategy for finding spots
   * @param {Map} activeTickets - Shared map of active tickets
   * @param {DisplayPanel} displayPanel - Reference to display panel for updates
   */
  constructor(gateId, floors, allocationStrategy, activeTickets, displayPanel) {
    this.#gateId = gateId;
    this.#floors = floors;
    this.#allocationStrategy = allocationStrategy;
    this.#activeTickets = activeTickets;
    this.#displayPanel = displayPanel;
  }

  /** @returns {string} Gate ID */
  get gateId() {
    return this.#gateId;
  }

  /**
   * Set a different allocation strategy at runtime.
   * @param {SpotAllocationStrategy} strategy
   */
  setAllocationStrategy(strategy) {
    this.#allocationStrategy = strategy;
  }

  /**
   * Process vehicle entry: scan plate, find spot, issue ticket.
   *
   * @param {Vehicle} vehicle - The vehicle entering (number plate scanned)
   * @returns {Ticket} The issued parking ticket
   * @throws {Error} If vehicle already parked or no spot available
   */
  processEntry(vehicle) {
    // Scan number plate — check if already inside
    if (this.#activeTickets.has(vehicle.licensePlate)) {
      throw new Error(`Entry denied: Vehicle ${vehicle.licensePlate} is already parked.`);
    }

    // Use allocation strategy to find a spot
    const spot = this.#allocationStrategy.allocateSpot(vehicle, this.#floors);

    if (!spot) {
      throw new Error(`Entry denied: No available spot for ${vehicle.type} (${vehicle.licensePlate}).`);
    }

    // Park the vehicle
    spot.park(vehicle);

    // Generate ticket
    const ticket = new Ticket(vehicle, spot);
    this.#activeTickets.set(vehicle.licensePlate, ticket);

    // Update display panel
    if (this.#displayPanel) {
      this.#displayPanel.update();
    }

    return ticket;
  }
}

module.exports = { EntryGate };
