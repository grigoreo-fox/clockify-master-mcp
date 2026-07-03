import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  MONEY_DIVISOR,
  denormalizeMoneyForApi,
  isMoneyPair,
  normalizeMoneyFromApi,
  normalizeToolResult,
} from '../../../src/utils/money.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportFixture = JSON.parse(
  readFileSync(join(__dirname, '../../fixtures/report-detailed.json'), 'utf-8')
);

describe('money utils', () => {
  it('identifies money pairs', () => {
    expect(isMoneyPair({ amount: 250000, currency: 'RUB' })).toBe(true);
    expect(isMoneyPair({ amount: 2500, currency: 'RUB' })).toBe(true);
    expect(isMoneyPair({ amount: 250000 })).toBe(false);
    expect(isMoneyPair(null)).toBe(false);
    expect(
      isMoneyPair({
        amount: 58611,
        currency: 'RUB',
        rate: 250000,
        description: 'Work',
      })
    ).toBe(false);
  });

  it('normalizes rate pairs from minor to major units', () => {
    expect(normalizeMoneyFromApi({ amount: 250000, currency: 'RUB' })).toEqual({
      amount: 2500,
      currency: 'RUB',
    });
    expect(normalizeMoneyFromApi({ amount: 200000, currency: 'RUB' })).toEqual({
      amount: 2000,
      currency: 'RUB',
    });
  });

  it('round-trips major units through denormalize and normalize', () => {
    const major = { hourlyRate: { amount: 2000, currency: 'RUB' } };
    const minor = denormalizeMoneyForApi(major);
    expect(minor).toEqual({ hourlyRate: { amount: 200000, currency: 'RUB' } });
    expect(normalizeMoneyFromApi(minor)).toEqual(major);
  });

  it('skips non-money duration fields while normalizing amounts', () => {
    expect(
      normalizeMoneyFromApi({
        duration: 8985,
        amount: 623958,
        totalTime: 8985,
        entriesCount: 3,
      })
    ).toEqual({
      duration: 8985,
      amount: 6239.58,
      totalTime: 8985,
      entriesCount: 3,
    });
  });

  it('normalizes nested time entry rates', () => {
    const input = [
      {
        description: 'Work',
        hourlyRate: { amount: 250000, currency: 'RUB' },
        costRate: { amount: 200000, currency: 'RUB' },
      },
    ];

    expect(normalizeMoneyFromApi(input)).toEqual([
      {
        description: 'Work',
        hourlyRate: { amount: 2500, currency: 'RUB' },
        costRate: { amount: 2000, currency: 'RUB' },
      },
    ]);
  });

  it('normalizes detailed report fixture amounts', () => {
    const normalized = normalizeMoneyFromApi(reportFixture);

    expect(normalized.totals[0].amounts[0].value).toBe(6239.58);
    expect(normalized.totals[0].totalAmount).toBe(6239.58);
    expect(normalized.totals[0].totalAmountByCurrency[0].amount).toBe(6239.58);
    expect(normalized.timeentries[0].rate).toBe(2500);
    expect(normalized.timeentries[0].costRate).toBe(2000);
    expect(normalized.timeentries[0].earnedAmount).toBe(586.11);
    expect(normalized.timeentries[0].costAmount).toBe(468.89);
    expect(normalized.timeentries[0].timeInterval.duration).toBe(844);
  });

  it('does not normalize budget estimate numbers outside money pairs', () => {
    expect(
      normalizeMoneyFromApi({
        budgetEstimate: { estimate: 50000, type: 'AUTO' },
      })
    ).toEqual({
      budgetEstimate: { estimate: 50000, type: 'AUTO' },
    });
  });

  it('normalizes tool results with data wrapper', () => {
    const result = normalizeToolResult({
      success: true,
      data: { hourlyRate: { amount: 10000, currency: 'USD' } },
    });

    expect(result.data).toEqual({ hourlyRate: { amount: 100, currency: 'USD' } });
  });

  it('exports divisor constant', () => {
    expect(MONEY_DIVISOR).toBe(100);
  });
});
