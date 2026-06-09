/**
 * Membership represents a parking subscription plan.
 *
 * Types: DAILY, WEEKLY, MONTHLY
 * Members get discounted or free parking based on their plan.
 *
 * Single Responsibility: Manages membership validity and discount calculation.
 */

const MembershipType = Object.freeze({
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
});

class Membership {
  #id;
  #licensePlate;
  #type;
  #startDate;
  #expiryDate;
  #discount; // percentage (0-100)

  /**
   * @param {string} licensePlate - Vehicle this membership belongs to
   * @param {string} type - MembershipType value
   * @param {number} discount - Discount percentage (e.g., 50 = 50% off)
   */
  constructor(licensePlate, type, discount = 0) {
    if (!licensePlate || typeof licensePlate !== 'string') {
      throw new Error('License plate is required for membership.');
    }
    if (!Object.values(MembershipType).includes(type)) {
      throw new Error(`Invalid membership type. Must be one of: ${Object.values(MembershipType).join(', ')}`);
    }
    if (discount < 0 || discount > 100) {
      throw new Error('Discount must be between 0 and 100.');
    }

    this.#id = `MEM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.#licensePlate = licensePlate;
    this.#type = type;
    this.#startDate = new Date();
    this.#expiryDate = this.#calculateExpiry(type);
    this.#discount = discount;
  }

  /** @returns {string} Membership ID */
  get id() { return this.#id; }

  /** @returns {string} Associated vehicle plate */
  get licensePlate() { return this.#licensePlate; }

  /** @returns {string} Membership type (daily/weekly/monthly) */
  get type() { return this.#type; }

  /** @returns {Date} Start date */
  get startDate() { return this.#startDate; }

  /** @returns {Date} Expiry date */
  get expiryDate() { return this.#expiryDate; }

  /** @returns {number} Discount percentage */
  get discount() { return this.#discount; }

  /**
   * Check if the membership is currently valid (not expired).
   * @returns {boolean}
   */
  isValid() {
    return new Date() <= this.#expiryDate;
  }

  /**
   * Calculate the discounted amount.
   * @param {number} originalAmount - The original fee
   * @returns {number} Discounted fee
   */
  applyDiscount(originalAmount) {
    if (!this.isValid()) return originalAmount; // No discount if expired
    const discountAmount = originalAmount * (this.#discount / 100);
    return Math.round(originalAmount - discountAmount);
  }

  /**
   * Calculate expiry date based on membership type.
   * @param {string} type
   * @returns {Date}
   */
  #calculateExpiry(type) {
    const now = new Date();
    switch (type) {
      case MembershipType.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case MembershipType.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case MembershipType.MONTHLY:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return now;
    }
  }

  /**
   * Serialize for display.
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.#id,
      licensePlate: this.#licensePlate,
      type: this.#type,
      startDate: this.#startDate.toISOString(),
      expiryDate: this.#expiryDate.toISOString(),
      discount: this.#discount,
      isValid: this.isValid(),
    };
  }
}

module.exports = { Membership, MembershipType };
