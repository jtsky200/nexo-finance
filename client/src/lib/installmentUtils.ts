/**
 * Utility functions for handling installment payment unit conversions
 * These functions intelligently detect whether amounts are stored in CHF or Rappen (cents)
 * to prevent display errors caused by inconsistent data storage formats.
 */

/**
 * Intelligently converts paidAmount to CHF
 * Automatically detects whether paidAmount is stored in CHF or Rappen
 * @param paidAmount - The paid amount (can be in CHF or Rappen)
 * @param installmentAmount - The installment amount (reference for detection)
 * @param installmentsAreInChf - Whether installment amounts are stored in CHF
 * @returns The paid amount in CHF
 */
export function convertPaidAmountToChf(
  paidAmount: number,
  installmentAmount: number,
  installmentsAreInChf: boolean
): number {
  if (paidAmount === 0 || installmentAmount === 0) return 0;

  // If paidAmount ≈ amount (0.5-2.0), then both are in the same unit
  if (paidAmount >= installmentAmount * 0.5 && paidAmount <= installmentAmount * 2.0) {
    return installmentsAreInChf
      ? paidAmount  // Already CHF
      : paidAmount / 100;  // Rappen to CHF
  }
  // If paidAmount is significantly larger (> 10x), check if it's a multiple of 100
  // This suggests paidAmount is in Rappen (e.g., 5000 Rappen = 50 CHF)
  // But only if paidAmount/100 ≈ amount, otherwise it could be a legitimate large payment
  else if (paidAmount > installmentAmount * 10) {
    const paidAmountInChf = paidAmount / 100;
    // If paidAmount/100 ≈ amount, then paidAmount was in Rappen
    if (Math.abs(paidAmountInChf - installmentAmount) < installmentAmount * 0.1) {
      return paidAmountInChf; // Rappen to CHF
    }
    // Otherwise it's probably a legitimate large payment in CHF
    // Use installmentsAreInChf as fallback
    return installmentsAreInChf
      ? paidAmount  // Already CHF
      : paidAmount / 100;  // Rappen to CHF
  }
  // Fallback: Use installmentsAreInChf
  else {
    return installmentsAreInChf
      ? paidAmount  // Already CHF
      : paidAmount / 100;  // Rappen to CHF
  }
}

/**
 * Calculates totalPaidChf from installments with intelligent unit detection
 * @param installments - Array of installments
 * @param invoiceAmountChf - Total invoice amount in CHF
 * @returns Total paid amount in CHF
 */
export function calculateTotalPaidChf(installments: any[], invoiceAmountChf: number): number {
  if (!installments || !Array.isArray(installments) || installments.length === 0) return 0;

  const totalInstallmentAmountAsChf = installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const installmentsAreInChf = Math.abs(totalInstallmentAmountAsChf - invoiceAmountChf) < invoiceAmountChf * 0.1;

  return installments.reduce((sum: number, inst: any) => {
    const installmentAmount = inst.amount || 0;
    const paidAmount = inst.paidAmount || 0;
    const paidAmountChf = convertPaidAmountToChf(paidAmount, installmentAmount, installmentsAreInChf);
    return sum + paidAmountChf;
  }, 0);
}

/**
 * Determines if installment amounts are stored in CHF based on total comparison
 * @param installments - Array of installments
 * @param invoiceAmountChf - Total invoice amount in CHF
 * @returns true if installments are stored in CHF, false if in Rappen
 */
export function areInstallmentsInChf(installments: any[], invoiceAmountChf: number): boolean {
  if (!installments || !Array.isArray(installments) || installments.length === 0) return true;
  
  const totalInstallmentAmountAsChf = installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  return Math.abs(totalInstallmentAmountAsChf - invoiceAmountChf) < invoiceAmountChf * 0.1;
}

