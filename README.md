# Smart Parking Lot System

A Low-Level Design (LLD) implementation of a Smart Parking Lot System using Object-Oriented Programming principles in Node.js/JavaScript.

## Features

- Multi-floor parking lot with configurable spot sizes (Small, Medium, Large)
- Entry/Exit gates with number plate scanning
- Automatic spot allocation using Strategy Pattern (FirstAvailable, NearestFirst)
- Fee calculation using Strategy Pattern (Hourly, FlatPlusHourly) — swappable at runtime
- Membership support (Daily, Weekly, Monthly) with percentage discounts
- Multiple payment methods (Cash, Card, UPI)
- Real-time display panel showing availability per floor per spot type
- Check-in and check-out with entry/exit time tracking
- Concurrency handling via Promise-based mutex
- Vehicle search by license plate
- Payment history and revenue tracking

## Getting Started

```bash
# No external dependencies needed — uses only Node.js built-in modules

# Run the demo (shows full entry-to-exit flow)
npm run demo

# Run tests (26 unit tests)
npm test
```

Requires Node.js >= 18.

## Sample Output (npm run demo)

```
=== Smart Parking Lot System Demo ===

Created: City Center Parking with 3 floors
Entry Gate: ENTRY-1 | Exit Gate: EXIT-1

--- Membership Registered ---
  KA-01-AB-1234 | monthly | 50% off

--- Vehicles Entering ---
✓ KA-01-AB-1234 (MEMBER) → F1-S6
✓ KA-02-CD-5678 → F1-S7
✓ KA-03-EF-9012 → F1-S1
✓ KA-04-GH-3456 → F1-S16

--- Vehicles Exiting (Payment Integrated) ---
  KA-01-AB-1234 (MEMBER)
    Original: ₹20 → Discount: ₹10 → Paid: ₹10 (card)

  KA-02-CD-5678 (no membership)
    Paid: ₹20 (upi)

--- Revenue Report ---
  Total Revenue: ₹50
  Transactions: 4
```

## System Flow

```
Vehicle arrives
    │
    ▼
EntryGate.processEntry(vehicle)
    ├── Scans license plate (checks for duplicates)
    ├── SpotAllocationStrategy.allocateSpot(vehicle, floors)
    ├── ParkingSpot.park(vehicle)
    ├── Creates Ticket (records entry time)
    ├── DisplayPanel.update()
    └── Returns Ticket
    
Vehicle leaves
    │
    ▼
ExitGate.processExit(licensePlate)
    ├── Finds active Ticket
    ├── FeeStrategy.calculate(ticket) → amount
    ├── ParkingSpot.vacate()
    ├── Ticket.complete(amount)
    ├── DisplayPanel.update()
    └── Returns { ticket, amount }
    │
    ▼
PaymentProcessor.processPayment(ticket, amount, method)
    ├── Checks Membership for discount
    ├── Applies discount if valid
    └── Returns Payment record
```

## Classes (17 total)

| Class | Responsibility |
|-------|---------------|
| **ParkingLot** | Singleton facade — orchestrates gates, strategies, payment, concurrency |
| **Floor** | Manages a collection of ParkingSpots (composition) |
| **ParkingSpot** | Single space — manages occupancy (park/vacate/canFit) |
| **Vehicle** (abstract) | Base class with licensePlate, type, requiredSpotSize |
| **Motorcycle / Car / Bus** | Concrete vehicles — define required spot size |
| **Ticket** | Tracks one parking session (entry/exit time, duration, status) |
| **EntryGate** | Scans plate → allocates spot → issues ticket → updates display |
| **ExitGate** | Scans ticket → calculates fee → vacates spot → returns amount |
| **DisplayPanel** | Shows real-time availability per floor per spot type |
| **HourlyFeeStrategy** | Fee = hours × rate per vehicle type |
| **FlatPlusHourlyStrategy** | Fee = flat entry fee + hourly after first hour |
| **FirstAvailableStrategy** | Allocation: exact-size-first, then any fit, floor by floor |
| **NearestFirstStrategy** | Allocation: closest to gate, exact-size preferred |
| **Membership** | Daily/Weekly/Monthly plans with percentage discount |
| **PaymentProcessor** | Processes payments (Cash/Card/UPI), applies membership discounts |
| **Payment** | Single transaction record (amount, method, discount, status) |

## Design Principles

### SOLID Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Single Responsibility** | Each class has one job (Spot manages occupancy, Gate manages flow, Strategy calculates) |
| **Open/Closed** | New fee/allocation strategies added without modifying existing code |
| **Liskov Substitution** | Motorcycle, Car, Bus all substitute for Vehicle; any Strategy substitutes for its base |
| **Interface Segregation** | Strategies define only `calculate()` or `allocateSpot()` — minimal interfaces |
| **Dependency Inversion** | ParkingLot depends on Strategy abstractions, not concrete classes |

### Design Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **Strategy** | FeeCalculator, SpotAllocation | Swap algorithms at runtime |
| **Singleton** | ParkingLot | One lot exists; throws on duplicate creation |
| **Composition** | Lot → Floor → Spot | Strong ownership |
| **Facade** | ParkingLot | Simple public API hides orchestration complexity |
| **Encapsulation** | All classes (#private fields) | Prevents invalid state |

### Concurrency Handling

Promise-based mutex (`#withLock`) serializes check-in/check-out operations. The `.catch(() => {})` on the lock chain absorbs rejections so subsequent operations still execute — a failed check-in does not block future operations.

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ParkingLot (Singleton)                    │
├─────────────────────────────────────────────────────────────────┤
│  + checkIn(vehicle): Ticket                                      │
│  + checkOut(plate, method): {ticket, amount, payment}            │
│  + getAvailability(): object                                     │
│  + setFeeStrategy(s) / setAllocationStrategy(s)                  │
└───────┬──────────────┬──────────────┬───────────────────────────┘
        │              │              │
   EntryGate      ExitGate     DisplayPanel
        │              │
        ▼              ▼
  SpotAllocation   FeeStrategy        PaymentProcessor
  Strategy            │                     │
    △                 △                     │ uses
    │                 │                     ▼
  ┌─┴──┐        ┌────┴────┐          Membership
  │    │        │         │
First  Nearest  Hourly  Flat+Hourly

ParkingLot ──has many──▶ Floor ──has many──▶ ParkingSpot ──holds──▶ Vehicle
                                                                       △
                                                                  ┌────┼────┐
                                                              Motorcycle Car Bus
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

## Membership Plans

| Type    | Duration | Discount Applied |
|---------|----------|-----------------|
| Daily   | 24 hours | Configurable %  |
| Weekly  | 7 days   | Configurable %  |
| Monthly | 30 days  | Configurable %  |

Expired memberships automatically stop applying discounts.

## Payment Methods

- **Cash** — default
- **Card** — credit/debit
- **UPI** — digital payment

## Project Structure

```
smart-parking-lot-system/
├── src/
│   ├── index.js                  ← Public API / barrel exports
│   ├── demo.js                   ← Driver file showing full entry-to-exit flow
│   ├── enums.js                  ← VehicleType, SpotSize, TicketStatus constants
│   ├── Vehicle.js                ← Abstract Vehicle + Motorcycle, Car, Bus
│   ├── ParkingSpot.js            ← Single parking space (occupancy management)
│   ├── Floor.js                  ← Floor with spots (composition)
│   ├── Ticket.js                 ← Parking session lifecycle
│   ├── FeeCalculator.js          ← Strategy: HourlyFee, FlatPlusHourly
│   ├── SpotAllocationStrategy.js ← Strategy: FirstAvailable, NearestFirst
│   ├── EntryGate.js              ← Scan plate, allocate spot, issue ticket
│   ├── ExitGate.js               ← Calculate fee, vacate spot, collect payment
│   ├── DisplayPanel.js           ← Real-time availability per floor/spot type
│   ├── Membership.js             ← Daily/Weekly/Monthly plans with discounts
│   ├── PaymentProcessor.js       ← Multi-method payment (Cash/Card/UPI)
│   └── ParkingLot.js             ← Main facade (Singleton, gates, concurrency)
├── test/
│   └── parking.test.js           ← 26 unit tests (Node.js built-in test runner)
├── package.json
├── .gitignore
└── README.md
```

## Testing

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

- **No external dependencies** — uses only Node.js built-in modules (test runner, assert)
- **Singleton safety** — ParkingLot throws if instantiated twice without `resetInstance()`
- **In-memory only** — all state lives in the Singleton; restarting clears everything
- **Email simulation** — not applicable (this is a design system, not an API)
- **ID generation** — Ticket uses a static class-level counter (`Ticket.#nextId`)
