import { InsurerConfig } from "./insurers-config";

export interface InstallmentInput {
    premiumNet: number;
    policyFee: number;
    surchargeAmount: number;
    vatAmount: number;
    discountAmount: number;
    extraPremium: number;
    totalInstallments: number;
    startDate: Date;
    config?: InsurerConfig;
    firstInstallmentForced?: number; // New: To match exactly what the IA extracted from carátula
}

export interface Installment {
    installment_number: number;
    due_date: string;
    premium_net: string;
    policy_fee: string;
    surcharges: string;
    vat_amount: string;
    total_amount: string;
    status: string;
}

export function calculateInstallments(input: InstallmentInput): Installment[] {
    const {
        premiumNet, policyFee, surchargeAmount, vatAmount,
        discountAmount, extraPremium, totalInstallments, startDate, config,
        firstInstallmentForced
    } = input;

    const installments: Installment[] = [];
    const rule = config?.installmentRule || 'standard';

    // Total Amount to be distributed
    const totalPremiumToPay = (premiumNet - discountAmount + extraPremium) + policyFee + surchargeAmount + vatAmount;

    for (let i = 1; i <= totalInstallments; i++) {
        let net = 0;
        let fee = 0;
        let surch = 0;
        let vat = 0;
        let total = 0;

        // If we have a forced first installment (from IA EXTRACTION)
        if (i === 1 && firstInstallmentForced && firstInstallmentForced > 0) {
            total = firstInstallmentForced;
            // For the first one, we just set the total and estimate components 
            // In a real SICAS killer, we'd extract every row, but for now this fixes the "overlap" UX
            fee = policyFee;
            surch = rule === 'prorated_surcharge' ? (surchargeAmount / totalInstallments) : surchargeAmount;
            vat = vatAmount / totalInstallments; // Simple estimate
            net = total - fee - surch - vat;
        }
        else if (i > 1 && firstInstallmentForced && firstInstallmentForced > 0) {
            // Distribute the REMAINING balance among the rest
            const remaining = totalPremiumToPay - firstInstallmentForced;
            total = remaining / (totalInstallments - 1);
            vat = vatAmount / totalInstallments;
            fee = 0;
            surch = rule === 'prorated_surcharge' ? (surchargeAmount / totalInstallments) : 0;
            net = total - fee - surch - vat;
        }
        else {
            // Standard dynamic logic
            net = (premiumNet - discountAmount + extraPremium) / totalInstallments;
            vat = vatAmount / totalInstallments;

            if (rule === 'standard' || rule === 'first_payment_heavy') {
                fee = i === 1 ? policyFee : 0;
                surch = i === 1 ? surchargeAmount : 0;
            } else if (rule === 'prorated_surcharge') {
                fee = i === 1 ? policyFee : 0;
                surch = surchargeAmount / totalInstallments;
            }
            total = net + fee + surch + vat;
        }

        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + (i - 1) * (12 / totalInstallments));

        installments.push({
            installment_number: i,
            due_date: dueDate.toISOString().split('T')[0],
            premium_net: net.toFixed(2),
            policy_fee: fee.toFixed(2),
            surcharges: surch.toFixed(2),
            vat_amount: vat.toFixed(2),
            total_amount: total.toFixed(2),
            status: 'Pendiente'
        });
    }

    return installments;
}
