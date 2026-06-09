const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const {
  ParkingLot,
  Motorcycle,
  Car,
  Bus,
  ParkingSpot,
  Floor,
  Ticket,
  HourlyFeeStrategy,
  FlatPlusHourlyStrategy,
  VehicleType,
  SpotSize,
} = require('../src/index');

// Reset singleton before each test suite
beforeEach(() => {
  ParkingLot.resetInstance();
  Ticket.resetCounter();
});

describe('Vehicle', () => {
  it('should create a Motorcycle with correct properties', () => {
    const bike = new Motorcycle('KA-01-AB-1234');
    assert.strictEqual(bike.licensePlate, 'KA-01-AB-1234');
    assert.strictEqual(bike.type, VehicleType.MOTORCYCLE);
    assert.strictEqual(bike.requiredSpotSize, SpotSize.SMALL);
  });

  it('should create a Car with correct properties', () => {
    const car = new Car('KA-02-CD-5678');
    assert.strictEqual(car.type, VehicleType.CAR);
    assert.strictEqual(car.requiredSpotSize, SpotSize.MEDIUM);
  });

  it('should create a Bus with correct properties', () => {
    const bus = new Bus('KA-03-EF-9012');
    assert.strictEqual(bus.type, VehicleType.BUS);
    assert.strictEqual(bus.requiredSpotSize, SpotSize.LARGE);
  });
});

describe('ParkingSpot', () => {
  it('should start as unoccupied', () => {
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    assert.strictEqual(spot.isOccupied, false);
    assert.strictEqual(spot.vehicle, null);
  });

  it('should park and vacate a vehicle', () => {
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    const car = new Car('TEST-001');

    spot.park(car);
    assert.strictEqual(spot.isOccupied, true);
    assert.strictEqual(spot.vehicle.licensePlate, 'TEST-001');

    spot.vacate();
    assert.strictEqual(spot.isOccupied, false);
    assert.strictEqual(spot.vehicle, null);
  });

  it('should not allow parking in occupied spot', () => {
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    const car1 = new Car('TEST-001');
    const car2 = new Car('TEST-002');

    spot.park(car1);
    assert.throws(() => spot.park(car2), /already occupied/);
  });

  it('should check if spot can fit vehicle', () => {
    const smallSpot = new ParkingSpot(1, 1, SpotSize.SMALL);
    const mediumSpot = new ParkingSpot(1, 2, SpotSize.MEDIUM);
    const largeSpot = new ParkingSpot(1, 3, SpotSize.LARGE);

    const bike = new Motorcycle('BIKE-1');
    const car = new Car('CAR-1');
    const bus = new Bus('BUS-1');

    // Small spot fits only motorcycle
    assert.strictEqual(smallSpot.canFit(bike), true);
    assert.strictEqual(smallSpot.canFit(car), false);
    assert.strictEqual(smallSpot.canFit(bus), false);

    // Medium spot fits motorcycle and car
    assert.strictEqual(mediumSpot.canFit(bike), true);
    assert.strictEqual(mediumSpot.canFit(car), true);
    assert.strictEqual(mediumSpot.canFit(bus), false);

    // Large spot fits all
    assert.strictEqual(largeSpot.canFit(bike), true);
    assert.strictEqual(largeSpot.canFit(car), true);
    assert.strictEqual(largeSpot.canFit(bus), true);
  });
});

describe('Floor', () => {
  it('should create floor with correct number of spots', () => {
    const floor = new Floor(1, { small: 3, medium: 5, large: 1 });
    assert.strictEqual(floor.spots.length, 9);
  });

  it('should find available spot for vehicle', () => {
    const floor = new Floor(1, { small: 2, medium: 3, large: 1 });
    const car = new Car('CAR-1');

    const spot = floor.findAvailableSpot(car);
    assert.notStrictEqual(spot, null);
    assert.strictEqual(spot.size, SpotSize.MEDIUM);
  });

  it('should return null when no spot available', () => {
    const floor = new Floor(1, { small: 2, medium: 0, large: 0 });
    const bus = new Bus('BUS-1');

    const spot = floor.findAvailableSpot(bus);
    assert.strictEqual(spot, null);
  });

  it('should report availability correctly', () => {
    const floor = new Floor(1, { small: 2, medium: 3, large: 1 });
    const avail = floor.getAvailability();

    assert.strictEqual(avail.total.small, 2);
    assert.strictEqual(avail.total.medium, 3);
    assert.strictEqual(avail.total.large, 1);
    assert.strictEqual(avail.available.small, 2);
    assert.strictEqual(avail.occupancy, '0/6');
  });
});

describe('Ticket', () => {
  it('should create ticket with correct initial state', () => {
    const car = new Car('CAR-1');
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    spot.park(car);

    const ticket = new Ticket(car, spot);
    assert.strictEqual(ticket.vehicle.licensePlate, 'CAR-1');
    assert.strictEqual(ticket.status, 'active');
    assert.strictEqual(ticket.amount, 0);
    assert.notStrictEqual(ticket.entryTime, null);
    assert.strictEqual(ticket.exitTime, null);
  });

  it('should complete ticket with amount', () => {
    const car = new Car('CAR-1');
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    spot.park(car);

    const ticket = new Ticket(car, spot);
    ticket.complete(100);

    assert.strictEqual(ticket.status, 'paid');
    assert.strictEqual(ticket.amount, 100);
    assert.notStrictEqual(ticket.exitTime, null);
  });
});

describe('FeeCalculator', () => {
  it('HourlyFeeStrategy should calculate based on hours and vehicle type', () => {
    const strategy = new HourlyFeeStrategy({ motorcycle: 10, car: 20, bus: 50 });
    const car = new Car('CAR-1');
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    spot.park(car);

    const ticket = new Ticket(car, spot);
    // Just created, so duration is ~1 hour (ceil)
    const fee = strategy.calculate(ticket);
    assert.strictEqual(fee, 20); // 1 hour * 20
  });

  it('FlatPlusHourlyStrategy should charge flat fee for first hour', () => {
    const strategy = new FlatPlusHourlyStrategy(
      { motorcycle: 5, car: 10, bus: 20 },
      { motorcycle: 8, car: 15, bus: 40 }
    );
    const car = new Car('CAR-1');
    const spot = new ParkingSpot(1, 1, SpotSize.MEDIUM);
    spot.park(car);

    const ticket = new Ticket(car, spot);
    const fee = strategy.calculate(ticket);
    assert.strictEqual(fee, 10); // flat fee only for <= 1 hour
  });
});

describe('ParkingLot', () => {
  it('should create parking lot with correct floors', () => {
    const lot = new ParkingLot('Test Lot', [
      { small: 2, medium: 3, large: 1 },
      { small: 2, medium: 3, large: 1 },
    ]);
    assert.strictEqual(lot.name, 'Test Lot');
    assert.strictEqual(lot.totalFloors, 2);
  });

  it('should check in a vehicle and return ticket', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('CAR-001');

    const ticket = await lot.checkIn(car);
    assert.notStrictEqual(ticket, null);
    assert.strictEqual(ticket.vehicle.licensePlate, 'CAR-001');
    assert.strictEqual(ticket.status, 'active');
  });

  it('should not allow duplicate check-in', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('CAR-001');

    await lot.checkIn(car);
    await assert.rejects(() => lot.checkIn(car), /already parked/);
  });

  it('should check out and calculate fee', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('CAR-001');

    await lot.checkIn(car);
    const { ticket, amount } = await lot.checkOut('CAR-001');

    assert.strictEqual(ticket.status, 'paid');
    assert.strictEqual(amount, 20); // 1 hour * 20 (default hourly rate)
  });

  it('should throw on invalid check-out', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    await assert.rejects(() => lot.checkOut('INVALID'), /No active ticket/);
  });

  it('should throw when lot is full', async () => {
    const lot = new ParkingLot('Tiny Lot', [{ small: 0, medium: 1, large: 0 }]);
    const car1 = new Car('CAR-001');
    const car2 = new Car('CAR-002');

    await lot.checkIn(car1);
    await assert.rejects(() => lot.checkIn(car2), /No available spot/);
  });

  it('should report availability correctly', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('CAR-001');

    await lot.checkIn(car);
    const avail = lot.getAvailability();

    assert.strictEqual(avail.totalActive, 1);
    assert.strictEqual(avail.floors[0].available.medium, 2);
  });

  it('should find a parked vehicle', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('CAR-001');

    await lot.checkIn(car);
    const found = lot.findVehicle('CAR-001');

    assert.notStrictEqual(found, null);
    assert.strictEqual(found.licensePlate, 'CAR-001');
  });

  it('should handle concurrent check-ins safely', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 5, medium: 10, large: 2 }]);
    const cars = Array.from({ length: 8 }, (_, i) => new Car(`CONC-${i}`));

    const tickets = await Promise.all(cars.map((car) => lot.checkIn(car)));

    // All should get unique spots
    const spotIds = tickets.map((t) => t.spot.id);
    const uniqueSpots = new Set(spotIds);
    assert.strictEqual(uniqueSpots.size, 8);
  });

  it('should allow fee strategy to be changed at runtime', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('CAR-001');

    await lot.checkIn(car);

    // Switch to flat+hourly
    lot.setFeeStrategy(new FlatPlusHourlyStrategy(
      { car: 10 },
      { car: 15 }
    ));

    const { amount } = await lot.checkOut('CAR-001');
    assert.strictEqual(amount, 10); // flat fee only (<=1 hour)
  });

  it('should maintain history of completed tickets', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);

    await lot.checkIn(new Car('CAR-001'));
    await lot.checkIn(new Car('CAR-002'));
    await lot.checkOut('CAR-001');
    await lot.checkOut('CAR-002');

    const history = lot.getHistory();
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].status, 'paid');
  });
});


describe('Payment Integration', () => {
  it('should return payment object on checkOut', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('PAY-001');

    await lot.checkIn(car);
    const { ticket, amount, payment } = await lot.checkOut('PAY-001', 'card');

    assert.strictEqual(ticket.status, 'paid');
    assert.strictEqual(payment.method, 'card');
    assert.strictEqual(payment.status, 'completed');
    assert.strictEqual(payment.finalAmount, amount);
  });

  it('should apply membership discount during checkOut', async () => {
    const { Membership, MembershipType } = require('../src/index');

    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('MEM-001');

    // Register 50% discount membership
    const membership = new Membership('MEM-001', MembershipType.MONTHLY, 50);
    lot.paymentProcessor.addMembership(membership);

    await lot.checkIn(car);
    const { payment } = await lot.checkOut('MEM-001');

    // Hourly rate for car = 20, with 50% discount = 10
    assert.strictEqual(payment.originalAmount, 20);
    assert.strictEqual(payment.discount, 10);
    assert.strictEqual(payment.finalAmount, 10);
  });

  it('should apply discount for valid membership', async () => {
    const { Membership } = require('../src/index');

    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);
    const car = new Car('EXP-001');

    // Create a valid daily membership (50% discount)
    const membership = new Membership('EXP-001', 'daily', 50);
    lot.paymentProcessor.addMembership(membership);

    await lot.checkIn(car);
    const { payment } = await lot.checkOut('EXP-001');

    // Membership is valid (just created), so discount applies
    assert.strictEqual(payment.discount, 10);
  });

  it('should support different payment methods', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 3, large: 1 }]);

    await lot.checkIn(new Car('UPI-001'));
    const { payment } = await lot.checkOut('UPI-001', 'upi');
    assert.strictEqual(payment.method, 'upi');
  });

  it('should track revenue in paymentProcessor', async () => {
    const lot = new ParkingLot('Test Lot', [{ small: 2, medium: 5, large: 1 }]);

    await lot.checkIn(new Car('REV-001'));
    await lot.checkIn(new Car('REV-002'));
    await lot.checkOut('REV-001');
    await lot.checkOut('REV-002');

    const revenue = lot.paymentProcessor.getTotalRevenue();
    assert.strictEqual(revenue, 40); // 20 + 20
  });
});
