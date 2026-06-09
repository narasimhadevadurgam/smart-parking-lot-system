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
  FlatPlusHourlyStrategy,
  NearestFirstStrategy,
  Membership,
  MembershipType,
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

  // 2. Register a membership (50% discount for monthly member)
  const membership = new Membership('KA-01-AB-1234', MembershipType.MONTHLY, 50);
  lot.paymentProcessor.addMembership(membership);
  console.log(`--- Membership Registered ---`);
  console.log(`  ${membership.licensePlate} | ${membership.type} | ${membership.discount}% off\n`);

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

  lot.displayPanel.show();

  // 5. Try duplicate entry
  console.log('--- Error: Duplicate Entry ---');
  try {
    await lot.checkIn(car1);
  } catch (err) {
    console.log(`✗ ${err.message}`);
  }

  // 6. Vehicles exit — payment integrated into checkOut
  console.log('\n--- Vehicles Exiting (Payment Integrated) ---\n');

  // Car 1: Member with 50% discount, pays by Card
  const exit1 = await lot.checkOut('KA-01-AB-1234', PaymentMethod.CARD);
  console.log(`  ${exit1.ticket.vehicle.licensePlate} (MEMBER)`);
  console.log(`    Original: ₹${exit1.payment.originalAmount} → Discount: ₹${exit1.payment.discount} → Paid: ₹${exit1.amount} (${exit1.payment.method})\n`);

  // Car 2: Non-member, pays by UPI
  const exit2 = await lot.checkOut('KA-02-CD-5678', PaymentMethod.UPI);
  console.log(`  ${exit2.ticket.vehicle.licensePlate} (no membership)`);
  console.log(`    Paid: ₹${exit2.amount} (${exit2.payment.method})\n`);

  // Bike: pays by Cash
  const exit3 = await lot.checkOut('KA-03-EF-9012', PaymentMethod.CASH);
  console.log(`  ${exit3.ticket.vehicle.licensePlate}`);
  console.log(`    Paid: ₹${exit3.amount} (${exit3.payment.method})\n`);

  // 7. Switch fee strategy and allocation strategy
  console.log('--- Switch Strategies ---');
  lot.setFeeStrategy(new FlatPlusHourlyStrategy());
  lot.setAllocationStrategy(new NearestFirstStrategy());
  console.log('  Fee: FlatPlusHourly | Allocation: NearestFirst\n');

  const car3 = new Car('KA-05-IJ-7890');
  const t5 = await lot.checkIn(car3);
  console.log(`  ✓ ${car3.licensePlate} (NearestFirst) → ${t5.spot.id}`);

  const exit4 = await lot.checkOut('KA-05-IJ-7890');
  console.log(`  ✓ Exit: ₹${exit4.amount} (FlatPlusHourly)\n`);

  // 8. Revenue report
  console.log('--- Revenue Report ---');
  console.log(`  Total Revenue: ₹${lot.paymentProcessor.getTotalRevenue()}`);
  console.log(`  Transactions: ${lot.paymentProcessor.getPaymentHistory().length}\n`);

  // 9. Final display
  lot.displayPanel.show();

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
