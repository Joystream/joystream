export const UNITS = {
  'B': 1,
  'KB': 1_000,
  'MB': 1_000_000,
  'GB': 1_000_000_000,
  'TB': 1_000_000_000_000,
  'PB': 1_000_000_000_000_000, // MAX_SAFE_INTEGER / 9.007
} as const

export type UnitType = keyof typeof UNITS

/**
 * Converts storage size in bytes (BigInt) to a most approperiate unit (MB / GB / TB etc.),
 * such that the size expressed in this unit is < 1_000 and can be converted to a Number.
 * Optionally the target unit can also be forced.
 *
 * @param bytes Number of bytes (BigInt)
 * @param forcedUnit Optional: Target unit to force
 * @param decimals Number of digits past the decimal point to include in the result.
 * @returns [Number, Unit] tuple
 */
export function asStorageSize(bytes: bigint, forcedUnit?: UnitType, decimals = 2): [number, UnitType] {
  const unitEntires = Object.entries(UNITS)
  let targetUnit = unitEntires.find(([unit]) => unit === forcedUnit)
  if (!targetUnit) {
    let i = 0
    while (bytes / BigInt(unitEntires[i][1]) >= 1_000 && i < unitEntires.length - 1) {
      i += 1
    }
    targetUnit = unitEntires[i]
  }
  const decimalScaler = Math.min(targetUnit[1], Math.pow(10, decimals))
  return [Number(bytes / BigInt(targetUnit[1] / decimalScaler)) / decimalScaler, targetUnit[0] as UnitType]
}
