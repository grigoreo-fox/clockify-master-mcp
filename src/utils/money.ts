/** Clockify stores monetary values in minor units (cents/kopecks) — multiply by this for API wire format. */
export const MONEY_DIVISOR = 100;

const MONEY_PAIR_PARENT_KEYS = new Set(['hourlyRate', 'costRate']);

const MONEY_SCALAR_KEYS = new Set([
  'amount',
  'rate',
  'earnedRate',
  'costRate',
  'earnedAmount',
  'costAmount',
  'totalAmount',
]);

/** Report amount item types where `value` is a monetary scalar in minor units. */
const MONEY_AMOUNT_ITEM_TYPES = new Set(['EARNED', 'COST', 'PROFIT']);

/** Keys whose numeric values are never currency amounts. */
const SKIP_DESCENDANT_KEYS = new Set([
  'duration',
  'totalTime',
  'totalBillableTime',
  'entriesCount',
  'page',
  'pageSize',
  'numOfCurrencies',
  'groupOneTotalCount',
  'groupTwoTotalCount',
]);

/**
 * Returns true when value is a Clockify money object `{ amount, currency }`.
 */
export function isMoneyPair(value: unknown): value is { amount: number; currency: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return (
    keys.length <= 2 &&
    keys.every(key => key === 'amount' || key === 'currency') &&
    typeof record.amount === 'number' &&
    typeof record.currency === 'string'
  );
}

function toMajorUnits(minorAmount: number): number {
  return Number((minorAmount / MONEY_DIVISOR).toFixed(2));
}

function toMinorUnits(majorAmount: number): number {
  return Math.round(majorAmount * MONEY_DIVISOR);
}

function transformMoneyScalar(value: number, direction: 'normalize' | 'denormalize'): number {
  if (direction === 'normalize') {
    return toMajorUnits(value);
  }
  return toMinorUnits(value);
}

function transformValue(value: unknown, direction: 'normalize' | 'denormalize'): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => transformValue(item, direction));
  }

  if (typeof value === 'object') {
    if (isMoneyPair(value)) {
      return {
        ...value,
        amount:
          direction === 'normalize'
            ? toMajorUnits(value.amount)
            : toMinorUnits(value.amount),
      };
    }

    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [childKey, childValue] of Object.entries(record)) {
      if (SKIP_DESCENDANT_KEYS.has(childKey)) {
        result[childKey] = childValue;
        continue;
      }

      if (childKey === 'budgetEstimate') {
        result[childKey] = childValue;
        continue;
      }

      if (MONEY_PAIR_PARENT_KEYS.has(childKey) && isMoneyPair(childValue)) {
        result[childKey] = transformValue(childValue, direction);
        continue;
      }

      if (MONEY_SCALAR_KEYS.has(childKey) && typeof childValue === 'number') {
        result[childKey] = transformMoneyScalar(childValue, direction);
        continue;
      }

      if (
        childKey === 'value' &&
        typeof childValue === 'number' &&
        typeof record.type === 'string' &&
        MONEY_AMOUNT_ITEM_TYPES.has(record.type)
      ) {
        result[childKey] = transformMoneyScalar(childValue, direction);
        continue;
      }

      result[childKey] = transformValue(childValue, direction);
    }

    return result;
  }

  return value;
}

/**
 * Convert Clockify API money fields from minor to major currency units (÷100).
 */
export function normalizeMoneyFromApi<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  return transformValue(data, 'normalize') as T;
}

/**
 * Convert MCP tool input money fields from major to minor currency units (×100) for API requests.
 */
export function denormalizeMoneyForApi<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  return transformValue(data, 'denormalize') as T;
}

/** Tool names that accept money fields in request arguments. */
export const MONEY_WRITE_TOOLS = new Set([
  'create_time_entry',
  'update_time_entry',
  'create_project',
  'update_project',
  'add_user_to_project',
]);

/**
 * Apply money normalization to a tool handler result when it contains `data`.
 */
export function normalizeToolResult<T extends { data?: unknown }>(result: T): T {
  if (result && typeof result === 'object' && 'data' in result && result.data != null) {
    return {
      ...result,
      data: normalizeMoneyFromApi(result.data),
    };
  }
  return result;
}

type ToolHandler = {
  name: string;
  handler: (args: Record<string, unknown>) => Promise<{ data?: unknown; success?: boolean }>;
};

/**
 * Mirror index.ts money transforms for tests and resource handlers.
 */
export async function executeToolWithMoneyNormalization(
  tool: ToolHandler,
  args: Record<string, unknown>,
  normalizeEnabled: boolean
): Promise<{ data?: unknown; success?: boolean }> {
  let processedArgs = args;

  if (normalizeEnabled && MONEY_WRITE_TOOLS.has(tool.name)) {
    processedArgs = denormalizeMoneyForApi(processedArgs) as Record<string, unknown>;
  }

  let result = await tool.handler(processedArgs);

  if (normalizeEnabled) {
    result = normalizeToolResult(result);
  }

  return result;
}
