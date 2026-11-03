// Hidden real minimum: 3.30 EUR. The UI keeps advertising 20 EUR (DISPLAY_MIN
// in src/routes/topup.tsx); do not reveal this value in user-facing messages.
export const MIN_TOPUP_AMOUNT = 3.3;
export const MAX_TOPUP_AMOUNT = 100000;

export function validateTopupAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT || amount > MAX_TOPUP_AMOUNT) {
    throw new Error("Shuma për mbushje nuk është e vlefshme.");
  }
  return Math.round(amount * 100) / 100;
}
