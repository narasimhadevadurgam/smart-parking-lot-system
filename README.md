# Smart Parking Lot System

A Low-Level Design (LLD) implementation of a Smart Parking Lot System using Object-Oriented Programming principles in Node.js/JavaScript.

## Features

- Multi-floor parking lot with configurable spot sizes (Small, Medium, Large)
- Automatic spot allocation based on vehicle size and availability
- Check-in and check-out with entry/exit time tracking
- Fee calculation using Strategy Pattern (swappable at runtime)
- Real-time availability updates per floor
- Concurrency handling for simultaneous check-in/check-out
- Vehicle search by license plate
- Ticket history and tracking

## Design Principles

### SOLID Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Single Responsibility** | Each class has one job: `ParkingSpot` manages occupancy, `Floor` manages spots, `Ticket` tracks sessions |
| **Open/Closed** | New fee strategies can be added without modifying `ParkingLot` |
| **Liskov Substitution** | `Motorcycle`, `Car`, `Bus` all substitute for `Vehicle` |
| **Interface Segregation** | `FeeStrategy` defines only `calculate()` — no bloated interfaces |
| **Dependency Inversion** | `ParkingLot` depends on `FeeStrategy` abstraction, not concrete classes |

### Design Patterns Used

- **Strategy Pattern** — Fee calculation (`HourlyFeeStrategy`, `FlatPlusHourlyStrategy`)
- **Singleton Pattern** — Only one `ParkingLot` instance exists
- **Composition** — `ParkingLot` → `Floor[]` → `ParkingSpot[]`
- **Encapsulation** — Private fields (`#field`) throughout all classes

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
├─────────────────────────────────────────────────────────────────┤
│  + checkIn(vehicle): Ticket                                      │
│  + checkOut(licensePlate): { ticket, amount }                    │
│  + getAvailability(): object                                     │
│  + findVehicle(plate): object                                    │
│  + setFeeStrategy(strategy): void                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ has many
                       ▼
┌─────────────────────────────────┐
│             Floor               │
├─────────────────────────────────┤
│  - floorNumber: number          │
│  - spots: ParkingSpot[]         │
├─────────────────────────────────┤
│  + findAvailableSpot(vehicle)   │
│  + getAvailability()            │
└──────────────┬──────────────────┘
               │ has many
               ▼
┌─────────────────────────────────┐
│          ParkingSpot            │
├─────────────────────────────────┤
│  - id: string                   │
│  - size: SpotSize               │
│  - isOccupied: boolean          │
│  - vehicle: Vehicle | null      │
├─────────────────────────────────┤
│  + canFit(vehicle): boolean     │
│  + park(vehicle): void          │
│  + vacate(): Vehicle            │
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
│  - id: string                   │
│  - vehicle: Vehicle             │
│  - spot: ParkingSpot            │
│  - entryTime: Date              │
│  - exitTime: Date | null        │
│  - status: TicketStatus         │
│  - amount: number               │
├─────────────────────────────────┤
│  + getDurationHours(): number   │
│  + complete(amount): void       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    FeeStrategy (abstract)       │
├─────────────────────────────────┤
│  + calculate(ticket): number    │
└──────────┬──────────────────────┘
           │ implements
     ┌─────┴─────────────┐
     ▼                   ▼
HourlyFeeStrategy  FlatPlusHourlyStrategy
```

## Project Structure

```
smart-parking-lot-system/
├── src/
│   ├── index.js            ← Entry point / exports
│   ├── demo.js             ← Driver file showing system in action
│   ├── enums.js            ← VehicleType, SpotSize, TicketStatus
│   ├── Vehicle.js          ← Vehicle, Motorcycle, Car, Bus
│   ├── ParkingSpot.js      ← Single parking space
│   ├── Floor.js            ← Floor with multiple spots
│   ├── Ticket.js           ← Parking session ticket
│   ├── FeeCalculator.js    ← Strategy pattern for fees
│   └── ParkingLot.js       ← Main facade (Singleton)
├── test/
│   └── parking.test.js     ← Unit tests
├── package.json
├── .gitignore
└── README.md
```

## Getting Started

```bash
# Run the demo
npm run demo

# Run tests
npm test
```

## Usage Example

```javascript
const { ParkingLot, Car, Motorcycle, Bus } = require('./src');

// Create a 2-floor parking lot
const lot = new ParkingLot('My Lot', [
  { small: 5, medium: 10, large: 2 },
  { small: 3, medium: 8, large: 3 },
]);

// Check in
const ticket = await lot.checkIn(new Car('KA-01-AB-1234'));
console.log(ticket.spot.id); // "F1-S6"

// Check availability
console.log(lot.getAvailability());

// Check out (fee calculated automatically)
const { amount } = await lot.checkOut('KA-01-AB-1234');
console.log(`Fee: ₹${amount}`);
```

## Fee Strategies

### Hourly Rate (default)
| Vehicle    | Rate/Hour |
|------------|-----------|
| Motorcycle | ₹10       |
| Car        | ₹20       |
| Bus        | ₹50       |

### Flat + Hourly
| Vehicle    | Flat Fee | Rate/Hour (after 1st) |
|------------|----------|----------------------|
| Motorcycle | ₹5       | ₹8                   |
| Car        | ₹10      | ₹15                  |
| Bus        | ₹20      | ₹40                  |

Strategies can be swapped at runtime:
```javascript
lot.setFeeStrategy(new FlatPlusHourlyStrategy());
```
