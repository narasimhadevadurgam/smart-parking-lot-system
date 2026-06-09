/**
 * ExitGate handles vehicle exit from the parking lot.
 *
 * Responsibilities:
 * - Accept a Ticket
 * - Use FeeCalculator to compute the fee
 * - Mark the spot as vacated
 * - Return payment amount due
 *
 * Dependency Inversion: Depends on FeeStrategy abstraction for fee calculation.
 * Single Responsibility: Only handles the exit/payment flow.
 */
class ExitGate {
  #gateId;
  #feeStrategy;
  #activeTickets; // Map<licensePlate, Ticket>
  #completedTickets; // Array of completed tickets
  #displayPanel;

  /**
   * @param {string} gateId - Unique gate identifier
   * @param {FeeStrategy} feeStrategy - Strategy for fee calculation
   * @param {Map} activeTickets - Shared map of active tickets
   * @param {Array} completedTickets - Shared array of completed tickets
   * @param {DisplayPanel} displayPanel - Reference to display panel for updates
   */
  constructor(gateId, feeStrategy, activeTickets, completedTickets, displayPanel) {
    this.#gateId = gateId;
    this.#feeStrategy = feeStrategy;
    this.#activeTickets = activeTickets;
    this.#completedTickets = completedTickets;
    this.#displayPanel = displayPanel;
  }

  /** @returns {string} Gate ID */
  get gateId() {
    return this.#gateId;
  }

  /**
   * Set a different fee strategy at runtime.
   * @param {FeeStrategy} strategy
   */
  setFeeStrategy(strategy) {
    this.#feeStrategy = strategy;
  }

  /**
   * Process vehicle exit: calculate fee, vacate spot, complete ticket.
   *
   * @param {string} licensePlate - The license plate of the exiting vehicle
   * @returns {object} { ticket, amount } — completed ticket and fee due
   * @throws {Error} If no active ticket found for this vehicle
   */
  processExit(licensePlate) {
    const ticket = this.#activeTickets.get(licensePlate);
    if (!ticket) {
      throw new Error(`Exit denied: No active ticket found for vehicle ${licensePlate}.`);
    }

    // Calculate fee using the fee strategy
    const amount = this.#feeStrategy.calculate(ticket);

    // Vacate the spot
    ticket.spot.vacate();

    // Complete the ticket with the amount
    ticket.complete(amount);

    // Move from active to completed
    this.#activeTickets.delete(licensePlate);
    this.#completedTickets.push(ticket);

    // Update display panel
    if (this.#displayPanel) {
      this.#displayPanel.update();
    }

    return { ticket, amount };
  }
}

module.exports = { ExitGate };
