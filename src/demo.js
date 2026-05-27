/**
 * Demo / Driver file for the Smart Parking Lot System
 * Run: node src/demo.js
 */

const {
  ParkingLot,
  Motorcycle,
  Car,
  Bus,
  HourlyFeeStrategy,
  FlatPlusHourlyStrategy,
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

  console.log(`Created: ${lot.name} with ${lot.totalFloors} floors\n`);

  // 2. Check in vehicles
  console.log('--- Check-In ---');

  const car1 = new Car('KA-01-AB-1234');
  const car2 = new Car('KA-02-CD-5678');
  const bike1 = new Motorcycle('KA-03-EF-9012');
  const bus1 = new Bus('KA-04-GH-3456');

  const ticket1 = await lot.checkIn(car1);
  console.log(`Car ${car1.licensePlate} parked at ${ticket1.spot.id} | Ticket: ${ticket1.id}`);

  const ticket2 = await lot.checkIn(car2);
  console.log(`Car ${car2.licensePlate} parked at ${ticket2.spot.id} | Ticket: ${ticket2.id}`);

  const ticket3 = await lot.checkIn(bike1);
  console.log(`Motorcycle ${bike1.licensePlate} parked at ${ticket3.spot.id} | Ticket: ${ticket3.id}`);

  const ticket4 = await lot.checkIn(bus1);
  console.log(`Bus ${bus1.licensePlate} parked at ${ticket4.spot.id} | Ticket: ${ticket4.id}`);

  // 3. Show availability
  console.log('\n--- Real-Time Availability ---');
  const availability = lot.getAvailability();
  availability.floors.forEach((floor) => {
    console.log(`  Floor ${floor.floor}: ${floor.occupancy} occupied | Available: Small=${floor.available.small}, Medium=${floor.available.medium}, Large=${floor.available.large}`);
  });

  // 4. Find a vehicle
  console.log('\n--- Find Vehicle ---');
  const found = lot.findVehicle('KA-01-AB-1234');
  console.log(`  ${found.licensePlate} is at spot ${found.spotId}, parked for ${found.duration}h`);

  // 5. Check out with fee calculation
  console.log('\n--- Check-Out (Hourly Strategy) ---');
  const result1 = await lot.checkOut('KA-01-AB-1234');
  console.log(`  ${result1.ticket.vehicle.licensePlate} | Duration: ${result1.ticket.getDurationHours()}h | Fee: ₹${result1.amount}`);

  // 6. Switch fee strategy at runtime
  console.log('\n--- Switch to Flat+Hourly Strategy ---');
  lot.setFeeStrategy(new FlatPlusHourlyStrategy(
    { motorcycle: 5, car: 10, bus: 20 },
    { motorcycle: 8, car: 15, bus: 40 }
  ));

  const result2 = await lot.checkOut('KA-03-EF-9012');
  console.log(`  ${result2.ticket.vehicle.licensePlate} | Duration: ${result2.ticket.getDurationHours()}h | Fee: ₹${result2.amount}`);

  // 7. Handle duplicate check-in
  console.log('\n--- Error Handling ---');
  try {
    await lot.checkIn(car2); // Already parked
  } catch (err) {
    console.log(`  Expected error: ${err.message}`);
  }

  // 8. Handle invalid check-out
  try {
    await lot.checkOut('INVALID-PLATE');
  } catch (err) {
    console.log(`  Expected error: ${err.message}`);
  }

  // 9. Concurrent check-ins
  console.log('\n--- Concurrent Check-Ins ---');
  const cars = Array.from({ length: 5 }, (_, i) => new Car(`CONC-${i + 1}`));
  const results = await Promise.all(cars.map((car) => lot.checkIn(car)));
  results.forEach((ticket) => {
    console.log(`  ${ticket.vehicle.licensePlate} → ${ticket.spot.id}`);
  });

  // 10. Final availability
  console.log('\n--- Final Availability ---');
  const finalAvail = lot.getAvailability();
  console.log(`  Active vehicles: ${finalAvail.totalActive}`);
  finalAvail.floors.forEach((floor) => {
    console.log(`  Floor ${floor.floor}: ${floor.occupancy} occupied`);
  });

  // 11. History
  console.log('\n--- Completed Tickets ---');
  lot.getHistory().forEach((t) => {
    console.log(`  ${t.id} | ${t.vehiclePlate} (${t.vehicleType}) | ₹${t.amount} | ${t.status}`);
  });

  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);
