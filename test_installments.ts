
import { calculateInstallments, InstallmentInput } from './lib/installment-engine';

const testInput: InstallmentInput = {
    premiumNet: 20925.01,
    policyFee: 550,
    surchargeAmount: 1569.38,
    vatAmount: 3687.10, // Not used directly in the math anymore if we use 1.16
    discountAmount: 0,
    extraPremium: 0,
    totalInstallments: 4,
    startDate: new Date('2026-02-25'),
    config: {
        id: 'test',
        name: 'Test',
        installmentRule: 'standard',
        paymentMethods: []
    }
};

const results = calculateInstallments(testInput);

console.log('--- TEST RESULTS (Rule: standard with dynamic VAT) ---');
results.forEach(inst => {
    console.log(`Inst # ${inst.installment_number}: Total: ${inst.total_amount}, Net: ${inst.premium_net}, Fee: ${inst.policy_fee}, Surcharge: ${inst.surcharges}, VAT: ${inst.vat_amount}`);
});
