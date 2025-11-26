import { calculateFare } from '../lib/pricing-service';

// Mock pricing data
const mockPricing = {
  routePricing: {
    'Machakos-Masii': { price: 3000 }
  },
  specialZones: {
    'Airport': { type: 'airport', surchargePercent: 20 },
    'Estate': { type: 'estate', flatSurcharge: 200 }
  },
  modifiers: {
    nightShift: { enabled: true, startTime: '20:00', endTime: '06:00', multiplier: 1.5 },
    holiday: { enabled: false, multiplier: 2.0 }
  }
};

describe('Pricing Service', () => {
  test('calculates base fare correctly', () => {
    const fare = calculateFare(mockPricing, 'Machakos-Masii');
    expect(fare).toBe(3000);
  });

  test('returns 0 for unknown route', () => {
    const fare = calculateFare(mockPricing, 'Unknown-Route');
    expect(fare).toBe(0);
  });

  // Note: Modifiers depend on current time which is hard to test without mocking Date.
  // In a real test we would mock Date or pass it as an argument.
});
