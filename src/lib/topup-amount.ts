export const MIN_TOPUP_AMOUNT = 8;
export const MAX_TOPUP_AMOUNT = 100000;

export function validateTopupAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT || amount > MAX_TOPUP_AMOUNT) {
    throw new Error("Shuma për mbushje duhet të jetë nga 8 € deri në 100 000 €.");
  }
  return Math.round(amount * 100) / 100;
}
