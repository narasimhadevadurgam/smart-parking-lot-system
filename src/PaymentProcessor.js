/**
 * PaymentProcessor handles payment collection at the exit gate.
 *
 * Strategy Pattern: Supports multiple payment methods (Cash, Card, UPI).
 * Single Responsibility: Only handles payment processing logic.
 *
 * Also integrates with Membership for discount application.
 */

const PaymentMethod = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
});

const PaymentStatus = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

/**
 * Payment record — tracks a single payment transaction.
 */
class Payment {
  #id;
  #ticketId;
  #originalAmount;
  #discount;
  #finalAmount;
  #method;
  #status;
  #timestamp;

  constructor(ticketId, originalAmount, discount, finalAmount, method) {
    this.#id = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.#ticketId = ticketId;
    this.#originalAmount = originalAmount;
    this.#discount = discount;
    this.#finalAmount = finalAmount;
    this.#method = method;
    this.#status = PaymentStatus.COMPLETED;
    this.#timestamp = new Date();
  }

  get id() { return this.#id; }
  get ticketId() { return this.#ticketId; }
  get originalAmount() { return this.#originalAmount; }
  get discount() { return this.#discount; }
  get finalAmount() { return this.#finalAmount; }
  get method() { return this.#method; }
  get status() { return this.#status; }

  toJSON() {
    return {
      id: this.#id,
      ticketId: this.#ticketId,
      originalAmount: this.#originalAmount,
      discount: this.#discount,
      finalAmount: this.#finalAmount,
      method: this.#method,
      status: this.#status,
      timestamp: this.#timestamp.toISOString(),
    };
  }
}

/**
 * PaymentProcessor — processes payments with optional membership discount.
 */
class PaymentProcessor {
  #payments; // Array of Payment records
  #memberships; // Map<licensePlate, Membership>

  constructor() {
    this.#payments = [];
    this.#memberships = new Map();
  }

  /**
   * Register a membership for discount eligibility.
   * @param {Membership} membership
   */
  addMembership(membership) {
    this.#memberships.set(membership.licensePlate, membership);
  }

  /**
   * Get membership for a vehicle (if any).
   * @param {string} licensePlate
   * @returns {Membership|null}
   */
  getMembership(licensePlate) {
    return this.#memberships.get(licensePlate) || null;
  }

  /**
   * Process payment for a ticket.
   *
   * @param {Ticket} ticket - The completed ticket
   * @param {number} amount - The calculated fee amount
   * @param {string} method - PaymentMethod value (cash/card/upi)
   * @returns {Payment} The payment record
   */
  processPayment(ticket, amount, method = PaymentMethod.CASH) {
    if (!Object.values(PaymentMethod).includes(method)) {
      throw new Error(`Invalid payment method. Must be one of: ${Object.values(PaymentMethod).join(', ')}`);
    }

    // Check for membership discount
    let discount = 0;
    let finalAmount = amount;
    const membership = this.#memberships.get(ticket.vehicle.licensePlate);

    if (membership && membership.isValid()) {
      finalAmount = membership.applyDiscount(amount);
      discount = amount - finalAmount;
    }

    // Create payment record
    const payment = new Payment(ticket.id, amount, discount, finalAmount, method);
    this.#payments.push(payment);

    return payment;
  }

  /**
   * Get all payment records.
   * @returns {object[]}
   */
  getPaymentHistory() {
    return this.#payments.map((p) => p.toJSON());
  }

  /**
   * Get total revenue collected.
   * @returns {number}
   */
  getTotalRevenue() {
    return this.#payments.reduce((sum, p) => sum + p.finalAmount, 0);
  }
}

module.exports = { PaymentProcessor, PaymentMethod, PaymentStatus, Payment };
