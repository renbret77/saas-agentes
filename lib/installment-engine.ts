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
        discountAmount, extraPremium, totalInstallments, startDate, config
    } = input;

    const installments: Installment[] = [];
    const rule = config?.installmentRule || 'standard';

    // Base calculation
    for (let i = 1; i <= totalInstallments; i++) {
        let net = (premiumNet - discountAmount + extraPremium) / totalInstallments;
        let fee = 0;
        let surch = 0;
        let vat = vatAmount / totalInstallments;

        // Rule: Standard - Direito and Surcharges in first payment
        if (rule === 'standard') {
            fee = i === 1 ? policyFee : 0;
            surch = i === 1 ? surchargeAmount : 0;
        }
        // Rule: First Payment Heavy (Chubb) - Like standard but can be extended if needed
        else if (rule === 'first_payment_heavy') {
            fee = i === 1 ? policyFee : 0;
            surch = i === 1 ? surchargeAmount : 0;
            // Note: User mentioned Chubb increases the 1st payment even more. 
            // For now, we follow the "Derecho in 1st" which is already "heavy".
        }
        // Rule: Prorated Surcharge (Monterrey) - Surcharge divided among all
        else if (rule === 'prorated_surcharge') {
            fee = i === 1 ? policyFee : 0;
            surch = surchargeAmount / totalInstallments;
        }

        const total = net + fee + surch + vat;

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
