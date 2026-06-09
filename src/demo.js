/**
 * Demo / Driver file for the Smart Parking Lot System
 * Shows the full flow: Entry Gate → Park → Exit Gate → Payment
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
} = require('./index');

async function main() {
  console.log('=== Smart Parking Lot System Demo ===\n');

  // Reset singleton for clean demo
  ParkingLot.resetInstance();

  // 1. Create a parking lot with 3 floors
  const lot = new ParkingLot('City Center Parking', [
    { small: 5, medium: 10, large: 2 },  // Floor 1
    { small: 5, medium: 10, large: 2 },  // Floor 2
    { small: 3, medium: 8, large: 3 },   // Floor 3
  ]);

  console.log(`Created: ${lot.name} with ${lot.totalFloors} floors`);
  console.log(`Entry Gate: ${lot.entryGate.gateId}`);
  console.log(`Exit Gate: ${lot.exitGate.gateId}\n`);

  // 2. Show initial display panel
  lot.displayPanel.show();

  // 3. Vehicles arrive at Entry Gate
  console.log('--- Vehicles Entering via Entry Gate ---');

  const car1 = new Car('KA-01-AB-1234');
  const car2 = new Car('KA-02-CD-5678');
  const bike1 = new Motorcycle('KA-03-EF-9012');
  const bus1 = new Bus('KA-04-GH-3456');

  const ticket1 = await lot.checkIn(car1);
  console.log(`✓ ${car1.licensePlate} (car) → Spot ${ticket1.spot.id} | Ticket: ${ticket1.id}`);

  const ticket2 = await lot.checkIn(car2);
  console.log(`✓ ${car2.licensePlate} (car) → Spot ${ticket2.spot.id} | Ticket: ${ticket2.id}`);

  const ticket3 = await lot.checkIn(bike1);
  console.log(`✓ ${bike1.licensePlate} (motorcycle) → Spot ${ticket3.spot.id} | Ticket: ${ticket3.id}`);

  const ticket4 = await lot.checkIn(bus1);
  console.log(`✓ ${bus1.licensePlate} (bus) → Spot ${ticket4.spot.id} | Ticket: ${ticket4.id}`);

  // 4. Display panel updates automatically
  lot.displayPanel.show();

  // 5. Try duplicate entry — should be denied
  console.log('--- Error: Duplicate Entry ---');
  try {
    await lot.checkIn(car1);
  } catch (err) {
    console.log(`✗ ${err.message}`);
  }

  // 6. Find a vehicle
  console.log('\n--- Find Vehicle ---');
  const found = lot.findVehicle('KA-01-AB-1234');
  console.log(`  ${found.licensePlate} is at spot ${found.spotId}`);

  // 7. Vehicles exit via Exit Gate (Hourly Fee Strategy)
  console.log('\n--- Vehicles Exiting via Exit Gate (Hourly ₹20/hr) ---');
  const exit1 = await lot.checkOut('KA-01-AB-1234');
  console.log(`✓ ${exit1.ticket.vehicle.licensePlate} | Duration: ${exit1.ticket.getDurationHours()}h | Fee: ₹${exit1.amount}`);

  // 8. Switch fee strategy at runtime
  console.log('\n--- Switch to Flat+Hourly Strategy ---');
  lot.setFeeStrategy(new FlatPlusHourlyStrategy(
    { motorcycle: 5, car: 10, bus: 20 },
    { motorcycle: 8, car: 15, bus: 40 }
  ));

  const exit2 = await lot.checkOut('KA-03-EF-9012');
  console.log(`✓ ${exit2.ticket.vehicle.licensePlate} | Duration: ${exit2.ticket.getDurationHours()}h | Fee: ₹${exit2.amount} (flat fee)`);

  // 9. Switch allocation strategy
  console.log('\n--- Switch to NearestFirst Allocation ---');
  lot.setAllocationStrategy(new NearestFirstStrategy());

  const car3 = new Car('KA-05-IJ-7890');
  const ticket5 = await lot.checkIn(car3);
  console.log(`✓ ${car3.licensePlate} (NearestFirst) → Spot ${ticket5.spot.id}`);

  // 10. Concurrent check-ins
  console.log('\n--- Concurrent Check-Ins (5 cars) ---');
  const cars = Array.from({ length: 5 }, (_, i) => new Car(`CONC-${i + 1}`));
  const results = await Promise.all(cars.map((car) => lot.checkIn(car)));
  results.forEach((ticket) => {
    console.log(`  ${ticket.vehicle.licensePlate} → ${ticket.spot.id}`);
  });

  // 11. Final display
  lot.displayPanel.show();

  // 12. Completed tickets history
  console.log('--- Completed Tickets ---');
  lot.getHistory().forEach((t) => {
    console.log(`  ${t.id} | ${t.vehiclePlate} (${t.vehicleType}) | ₹${t.amount} | ${t.status}`);
  });

  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);
