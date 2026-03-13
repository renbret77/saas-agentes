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

    // 1. Calculate the real Grand Total expected (Industry standard: Sum of all taxable components * 1.16)
    const subtotalTotal = (premiumNet - discountAmount + extraPremium) + policyFee + surchargeAmount;
    const grandTotal = Number((subtotalTotal * 1.16).toFixed(2));
    
    let currentAccumulated = 0;

    for (let i = 1; i <= totalInstallments; i++) {
        let net = 0, fee = 0, surch = 0, vat = 0, total = 0;

        // A. Handle forced first installment (Override from IA)
        if (i === 1 && firstInstallmentForced && firstInstallmentForced > 0) {
            total = firstInstallmentForced;
            fee = policyFee;
            surch = Number((surchargeAmount / totalInstallments).toFixed(2));
            // Estimate VAT from forced total
            vat = Math.floor(Number((total / 1.16 * 0.16).toFixed(4)) * 100) / 100;
            net = Number((total - fee - surch - vat).toFixed(2));
        } 
        else {
            // B. Standard distribution
            net = Number(((premiumNet - discountAmount + extraPremium) / totalInstallments).toFixed(2));
            surch = Number((surchargeAmount / totalInstallments).toFixed(2));
            // 3. Policy Fee Distribution
            const feeRule = config?.policyFeeRule || 'first_installment';
            fee = feeRule === 'prorated' 
                ? Number((policyFee / totalInstallments).toFixed(2))
                : (i === 1 ? policyFee : 0);

            // VAT truncation (Math.floor) corresponds to industry pattern for taxes
            vat = Math.floor(Number(((net + fee + surch) * 0.16).toFixed(4)) * 100) / 100;
            total = Number((net + fee + surch + vat).toFixed(2));
        }

        // C. Last installment balancing (Ensure grandTotal match)
        if (i === totalInstallments) {
            total = Number((grandTotal - currentAccumulated).toFixed(2));
            // Adjust net to balance the remaining cent if any
            net = Number((total - fee - surch - vat).toFixed(2));
        }

        currentAccumulated += total;

        const dueDate = new Date(startDate);
        if (i > 1) {
            const monthsToAdd = (12 / totalInstallments) * (i - 1);
            dueDate.setMonth(dueDate.getMonth() + Math.round(monthsToAdd));
        }

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
