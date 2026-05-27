# Smart Parking Lot System

A Low-Level Design (LLD) implementation of a Smart Parking Lot System using Object-Oriented Programming principles in Node.js/JavaScript.

## Features

- Multi-floor parking lot with configurable spot sizes (Small, Medium, Large)
- Automatic spot allocation based on vehicle size (exact-fit-first algorithm)
- Check-in and check-out with entry/exit time tracking
- Fee calculation using Strategy Pattern (swappable at runtime)
- Real-time availability updates per floor
- Concurrency handling via Promise-based mutex (multiple vehicles entering/exiting simultaneously)
- Vehicle search by license plate
- Ticket history and audit trail

## Getting Started

```bash
# No external dependencies needed — uses only Node.js built-in modules

# Run the demo (shows full system in action)
npm run demo

# Run tests (26 unit tests)
npm test
```

Requires Node.js >= 18.

## Sample Output (npm run demo)

```
=== Smart Parking Lot System Demo ===

Created: City Center Parking with 3 floors

--- Check-In ---
Car KA-01-AB-1234 parked at F1-S6 | Ticket: T-1
Car KA-02-CD-5678 parked at F1-S7 | Ticket: T-2
Motorcycle KA-03-EF-9012 parked at F1-S1 | Ticket: T-3
Bus KA-04-GH-3456 parked at F1-S16 | Ticket: T-4

--- Real-Time Availability ---
  Floor 1: 4/17 occupied | Available: Small=4, Medium=8, Large=1
  Floor 2: 0/17 occupied | Available: Small=5, Medium=10, Large=2
  Floor 3: 0/14 occupied | Available: Small=3, Medium=8, Large=3

--- Check-Out (Hourly Strategy) ---
  KA-01-AB-1234 | Duration: 1h | Fee: ₹20

--- Switch to Flat+Hourly Strategy ---
  KA-03-EF-9012 | Duration: 1h | Fee: ₹5

--- Concurrent Check-Ins ---
  CONC-1 → F1-S6
  CONC-2 → F1-S8
  CONC-3 → F1-S9
  CONC-4 → F1-S10
  CONC-5 → F1-S11

--- Completed Tickets ---
  T-1 | KA-01-AB-1234 (car) | ₹20 | paid
  T-3 | KA-03-EF-9012 (motorcycle) | ₹5 | paid
```

## Usage Example

```javascript
const { ParkingLot, Car, Motorcycle, Bus, FlatPlusHourlyStrategy } = require('./src');

// Create a 2-floor parking lot
ParkingLot.resetInstance();
const lot = new ParkingLot('My Lot', [
  { small: 5, medium: 10, large: 2 },  // Floor 1
  { small: 3, medium: 8, large: 3 },   // Floor 2
]);

// Check in a car
const ticket = await lot.checkIn(new Car('KA-01-AB-1234'));
console.log(ticket.spot.id); // "F1-S6"

// Check real-time availability
const avail = lot.getAvailability();
console.log(avail.floors[0].available); // { small: 5, medium: 9, large: 2 }

// Find a parked vehicle
const found = lot.findVehicle('KA-01-AB-1234');
console.log(found.spotId); // "F1-S6"

// Switch fee strategy at runtime (Strategy Pattern)
lot.setFeeStrategy(new FlatPlusHourlyStrategy());

// Check out — fee calculated automatically
const { ticket: completed, amount } = await lot.checkOut('KA-01-AB-1234');
console.log(`Fee: ₹${amount}`); // "Fee: ₹10" (flat fee for ≤1 hour)
```

## Design Principles

### SOLID Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Single Responsibility** | Each class has one job: `ParkingSpot` manages occupancy, `Floor` manages spots, `Ticket` tracks sessions, `ParkingLot` orchestrates |
| **Open/Closed** | New fee strategies can be added without modifying `ParkingLot` — just create a new `FeeStrategy` subclass |
| **Liskov Substitution** | `Motorcycle`, `Car`, `Bus` all substitute for `Vehicle` transparently |
| **Interface Segregation** | `FeeStrategy` defines only `calculate()` — no bloated interfaces |
| **Dependency Inversion** | `ParkingLot` depends on `FeeStrategy` abstraction, not concrete classes |

### Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| **Strategy** | `FeeCalculator.js` | Swap fee algorithms at runtime without changing client code |
| **Singleton** | `ParkingLot` | Only one parking lot instance should exist |
| **Composition** | `ParkingLot → Floor[] → ParkingSpot[]` | Strong ownership — floors don't exist without the lot |
| **Template Method** | `Vehicle` (abstract base) | Subclasses define type-specific behavior |

### Concurrency Handling

The `ParkingLot` uses a Promise-based mutex (`#withLock`) to serialize check-in and check-out operations. This prevents race conditions where two vehicles could be assigned the same spot simultaneously.

```javascript
// Internal implementation
#withLock(fn) {
  const execute = this.#lock.then(fn);
  this.#lock = execute.catch(() => {});
  return execute;
}
```

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ParkingLot                                │
│  (Singleton)                                                     │
├─────────────────────────────────────────────────────────────────┤
│  - name: string                                                  │
│  - floors: Floor[]                                               │
│  - activeTickets: Map<string, Ticket>                            │
│  - completedTickets: Ticket[]                                    │
│  - feeStrategy: FeeStrategy                                      │
│  - lock: Promise                                                 │
├─────────────────────────────────────────────────────────────────┤
│  + checkIn(vehicle): Promise<Ticket>                             │
│  + checkOut(licensePlate): Promise<{ticket, amount}>             │
│  + getAvailability(): object                                     │
│  + getFloorAvailability(floor): object                           │
│  + findVehicle(plate): object|null                               │
│  + setFeeStrategy(strategy): void                                │
│  + getActiveTickets(): object[]                                  │
│  + getHistory(): object[]                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ has many (composition)
                       ▼
┌─────────────────────────────────┐
│             Floor               │
├─────────────────────────────────┤
│  - floorNumber: number          │
│  - spots: ParkingSpot[]         │
├─────────────────────────────────┤
│  + findAvailableSpot(vehicle)   │
│  + findSpotById(id)             │
│  + getAvailability()            │
└──────────────┬──────────────────┘
               │ has many (composition)
               ▼
┌─────────────────────────────────┐
│          ParkingSpot            │
├─────────────────────────────────┤
│  - id: string                   │
│  - size: SpotSize               │
│  - isOccupied: boolean          │
│  - vehicle: Vehicle|null        │
├─────────────────────────────────┤
│  + canFit(vehicle): boolean     │
│  + park(vehicle): void          │
│  + vacate(): Vehicle            │
│  + toJSON(): object             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│       Vehicle (abstract)        │
├─────────────────────────────────┤
│  - licensePlate: string         │
│  - type: VehicleType            │
│  - requiredSpotSize: SpotSize   │
└──────────┬──────────────────────┘
           │ extends
     ┌─────┼─────┐
     ▼     ▼     ▼
 Motorcycle Car  Bus

┌─────────────────────────────────┐
│            Ticket               │
├─────────────────────────────────┤
│  - id: string (auto-increment)  │
│  - vehicle: Vehicle             │
│  - spot: ParkingSpot            │
│  - entryTime: Date              │
│  - exitTime: Date|null          │
│  - status: TicketStatus         │
│  - amount: number               │
├─────────────────────────────────┤
│  + getDurationHours(): number   │
│  + complete(amount): void       │
│  + toJSON(): object             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  FeeStrategy (abstract)         │
├─────────────────────────────────┤
│  + calculate(ticket): number    │
└──────────┬──────────────────────┘
           │ implements
     ┌─────┴─────────────┐
     ▼                   ▼
HourlyFeeStrategy  FlatPlusHourlyStrategy
```

## Fee Strategies

### Hourly Rate (default)
| Vehicle    | Rate/Hour |
|------------|-----------|
| Motorcycle | ₹10       |
| Car        | ₹20       |
| Bus        | ₹50       |

### Flat + Hourly
| Vehicle    | Flat Fee (1st hour) | Rate/Hour (after) |
|------------|---------------------|-------------------|
| Motorcycle | ₹5                  | ₹8                |
| Car        | ₹10                 | ₹15               |
| Bus        | ₹20                 | ₹40               |

## Project Structure

```
smart-parking-lot-system/
├── src/
│   ├── index.js            ← Public API / barrel exports
│   ├── demo.js             ← Driver file showing system in action
│   ├── enums.js            ← VehicleType, SpotSize, TicketStatus constants
│   ├── Vehicle.js          ← Abstract Vehicle + Motorcycle, Car, Bus
│   ├── ParkingSpot.js      ← Single parking space (occupancy management)
│   ├── Floor.js            ← Floor with spot allocation algorithm
│   ├── Ticket.js           ← Parking session lifecycle
│   ├── FeeCalculator.js    ← Strategy pattern: HourlyFee, FlatPlusHourly
│   └── ParkingLot.js       ← Main facade (Singleton, concurrency, orchestration)
├── test/
│   └── parking.test.js     ← 26 unit tests (Node.js built-in test runner)
├── package.json
├── .gitignore
└── README.md
```

## Testing

Uses Node.js built-in test runner (no external test dependencies).

```bash
npm test
```

```
✔ Vehicle (3 tests)
✔ ParkingSpot (4 tests)
✔ Floor (4 tests)
✔ Ticket (2 tests)
✔ FeeCalculator (2 tests)
✔ ParkingLot (11 tests)

26 pass, 0 fail
```

## Notes

- **No external dependencies** — the entire system uses only Node.js built-in modules. No npm install needed.
- **Email simulation** — not applicable to this project (it's a design system, not an API).
- **In-memory only** — all state lives in the ParkingLot singleton. Restarting clears everything.
- **ID generation** — Ticket IDs use a static class-level counter (`Ticket.#nextId`), consistent across the system.
