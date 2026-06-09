/**
 * Demo / Driver file for the Smart Parking Lot System
 * Shows the full flow: Entry → Park → Exit → Payment (with membership discount)
 *
 * Run: node src/demo.js
 */

const {
  ParkingLot,
  Motorcycle,
  Car,
  Bus,
  HourlyFeeStrategy,
  FlatPlusHourlyStrategy,
  NearestFirstStrategy,
  Membership,
  MembershipType,
  PaymentProcessor,
  PaymentMethod,
} = require('./index');

async function main() {
  console.log('=== Smart Parking Lot System Demo ===\n');

  // Reset singleton for clean demo
  ParkingLot.resetInstance();

  // 1. Create a parking lot with 3 floors
  const lot = new ParkingLot('City Center Parking', [
    { small: 5, medium: 10, large: 2 },
    { small: 5, medium: 10, large: 2 },
    { small: 3, medium: 8, large: 3 },
  ]);

  console.log(`Created: ${lot.name} with ${lot.totalFloors} floors`);
  console.log(`Entry Gate: ${lot.entryGate.gateId} | Exit Gate: ${lot.exitGate.gateId}\n`);

  // 2. Set up Payment Processor with Memberships
  const paymentProcessor = new PaymentProcessor();

  // Register a monthly member (50% discount)
  const membership = new Membership('KA-01-AB-1234', MembershipType.MONTHLY, 50);
  paymentProcessor.addMembership(membership);
  console.log(`--- Membership Registered ---`);
  console.log(`  ${membership.licensePlate} | ${membership.type} | ${membership.discount}% off | Valid: ${membership.isValid()}\n`);

  // 3. Show initial display
  lot.displayPanel.show();

  // 4. Vehicles enter via Entry Gate
  console.log('--- Vehicles Entering ---');
  const car1 = new Car('KA-01-AB-1234');     // Member (50% off)
  const car2 = new Car('KA-02-CD-5678');     // Non-member
  const bike1 = new Motorcycle('KA-03-EF-9012');
  const bus1 = new Bus('KA-04-GH-3456');

  const t1 = await lot.checkIn(car1);
  console.log(`✓ ${car1.licensePlate} (MEMBER) → ${t1.spot.id}`);

  const t2 = await lot.checkIn(car2);
  console.log(`✓ ${car2.licensePlate} → ${t2.spot.id}`);

  const t3 = await lot.checkIn(bike1);
  console.log(`✓ ${bike1.licensePlate} → ${t3.spot.id}`);

  const t4 = await lot.checkIn(bus1);
  console.log(`✓ ${bus1.licensePlate} → ${t4.spot.id}`);

  // 5. Display after entry
  lot.displayPanel.show();

  // 6. Vehicles exit — payment with different methods
  console.log('--- Vehicles Exiting (Payment) ---\n');

  // Car 1: Member with 50% discount, pays by Card
  const exit1 = await lot.checkOut('KA-01-AB-1234');
  const pay1 = paymentProcessor.processPayment(exit1.ticket, exit1.amount, PaymentMethod.CARD);
  console.log(`  ${exit1.ticket.vehicle.licensePlate} (MEMBER)`);
  console.log(`    Fee: ₹${pay1.originalAmount} → Discount: ₹${pay1.discount} → Final: ₹${pay1.finalAmount} (${pay1.method})\n`);

  // Car 2: Non-member, pays by UPI
  const exit2 = await lot.checkOut('KA-02-CD-5678');
  const pay2 = paymentProcessor.processPayment(exit2.ticket, exit2.amount, PaymentMethod.UPI);
  console.log(`  ${exit2.ticket.vehicle.licensePlate} (no membership)`);
  console.log(`    Fee: ₹${pay2.originalAmount} → Discount: ₹${pay2.discount} → Final: ₹${pay2.finalAmount} (${pay2.method})\n`);

  // Bike: pays by Cash
  const exit3 = await lot.checkOut('KA-03-EF-9012');
  const pay3 = paymentProcessor.processPayment(exit3.ticket, exit3.amount, PaymentMethod.CASH);
  console.log(`  ${exit3.ticket.vehicle.licensePlate}`);
  console.log(`    Fee: ₹${pay3.originalAmount} → Final: ₹${pay3.finalAmount} (${pay3.method})\n`);

  // 7. Payment summary
  console.log('--- Payment History ---');
  paymentProcessor.getPaymentHistory().forEach((p) => {
    console.log(`  ${p.id} | ₹${p.finalAmount} | ${p.method} | ${p.status}`);
  });
  console.log(`\n  Total Revenue: ₹${paymentProcessor.getTotalRevenue()}`);

  // 8. Final display
  lot.displayPanel.show();

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
