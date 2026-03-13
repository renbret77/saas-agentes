"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Shield, User, Building2, CreditCard, FileText, CheckCircle2, ChevronRight, ChevronLeft, Upload, MessageSquare, AlertCircle, X, Mail as MailIcon, Phone, Users } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { calculateInstallments } from "@/lib/installment-engine"
import { getInsurerConfig } from "@/lib/insurers-config"
import { 
    getWelcomeMessage, 
    getPaymentCalendarMessage, 
    getSecurityTipsMessage, 
    getPreRenewalMessage, 
    generateWhatsAppLink 
} from "@/lib/whatsapp-templates"

export default function NewPolicyPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [createdPolicyId, setCreatedPolicyId] = useState<string | null>(null)
    const [syncSummary, setSyncSummary] = useState<{ rfc: boolean, phone: boolean, email: boolean }>({ rfc: false, phone: false, email: false })
    const [isParsingPolicy, setIsParsingPolicy] = useState(false)
    const [policyFileUrl, setPolicyFileUrl] = useState<string | null>(null)
    const [parsedClientName, setParsedClientName] = useState<string | null>(null)
    const [parsedClientRFC, setParsedClientRFC] = useState<string | null>(null)
    const [parsedClientPhone, setParsedClientPhone] = useState<string | null>(null)
    const [parsedClientEmail, setParsedClientEmail] = useState<string | null>(null)
    const [parsedBranchName, setParsedBranchName] = useState<string | null>(null)
    const [parsedAgentCode, setParsedAgentCode] = useState<string | null>(null)
    const [parsedAgentName, setParsedAgentName] = useState<string | null>(null)
    const [parsedFirstInstallment, setParsedFirstInstallment] = useState<number | null>(null)
    const [showAgentRegistration, setShowAgentRegistration] = useState(false)
    const [newAgentData, setNewAgentData] = useState({
        code: '',
        broker_name: '',
        type: 'direct' as 'direct' | 'broker'
    })

    // Phase 17: Smart Client Matching
    const [clientCandidates, setClientCandidates] = useState<any[]>([])
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
    const [showClientSync, setShowClientSync] = useState(false)
    const [clientSearch, setClientSearch] = useState('')
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)

    const [showContactSelector, setShowContactSelector] = useState(false)
    const [selectorConfig, setSelectorConfig] = useState<{
        type: 'whatsapp' | 'email',
        message: string,
        subject?: string,
        onSelect?: (contact: any) => void
    } | null>(null)


    // Catalogos
    const [clients, setClients] = useState<any[]>([])
    const [insurers, setInsurers] = useState<any[]>([])
    const [lines, setLines] = useState<any[]>([])
    const [agentCodes, setAgentCodes] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        client_id: '',
        insurer_id: '',
        agent_code_id: '',
        policy_number: '',
        status: 'Vigente',
        branch_id: '',
        sub_branch: '',
        start_date: '',
        end_date: '',
        issue_date: '',
        currency: 'MXN',
        premium_net: '',
        tax: '',
        premium_total: '',
        payment_method: 'Contado',
        notes: '',
        total_installments: '1',
        current_installment: '1',
        payment_link: '',
        is_domiciled: false,
        // Campos Económicos Extendidos (v18)
        policy_fee: '0',
        surcharge_percentage: '0',
        surcharge_amount: '0',
        discount_percentage: '0',
        discount_amount: '0',
        extra_premium: '0',
        tax_percentage: '16',
        vat_amount: '0',
        // Comisiones y Honorarios (v19 SICAS)
        commission_percentage: '0',
        commission_amount: '0',
        fees_percentage: '0',
        fees_amount: '0',
        adjustment_amount: '0',
        premium_subtotal: '0',
        description: '' // v19.1
    })

    const parseNum = (val: any) => {
        try {
            if (!val) return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            const strVal = String(val).replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(strVal);
            return isNaN(parsed) ? 0 : parsed;
        } catch { return 0; }
    };

    const formatInputCurrency = (val: string | number) => {
        try {
            if (val === '' || val === null || val === undefined) return '';
            const clean = String(val).replace(/[^0-9.-]/g, '');
            if (!clean) return '';
            const parts = clean.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            if (parts.length > 2) parts.pop();
            return parts.join('.');
        } catch { return String(val || ''); }
    };

    const formatCurrency = (val: any) => {
        try {
            return parseNum(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch { return "0.00"; }
    };

    const extractBirthDateFromRFC = (rfc: string, type: 'fisica' | 'moral' = 'fisica') => {
        if (!rfc) return null;
        const val = rfc.toUpperCase();
        const isFisica = type === 'fisica' || val.length === 13;
        const offset = isFisica ? 4 : 3;
        
        if (val.length >= offset + 6) {
            const datePart = val.substring(offset, offset + 6);
            if (/^\d{6}$/.test(datePart)) {
                let year = parseInt(datePart.substring(0, 2));
                const month = datePart.substring(2, 4);
                const day = datePart.substring(4, 6);
                
                const m = parseInt(month);
                const d = parseInt(day);
                
                if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                    year += (year > new Date().getFullYear() % 100 ? 1900 : 2000);
                    return `${year}-${month}-${day}`;
                }
            }
        }
        return null;
    };

    const [installments, setInstallments] = useState<any[]>([])

    useEffect(() => {
        fetchCatalogs()
    }, [])

    const fetchCatalogs = async () => {
        const [clientsRes, insurersRes, linesRes] = await Promise.all([
            supabase.from('clients').select('id, first_name, last_name, phone, whatsapp').order('first_name'),
            supabase.from('insurers').select('id, name, alias').eq('active', true).order('name'),
            supabase.from('insurance_lines').select('id, name, category').eq('active', true).order('name')
        ])

        setClients(clientsRes.data || [])
        setInsurers(insurersRes.data || [])
        setLines(linesRes.data || [])
    }

    const fetchAgentCodes = async (insurerId: string) => {
        const { data } = await supabase
            .from('agent_codes')
            .select('id, code, description')
            .eq('insurer_id', insurerId)
        setAgentCodes(data || [])
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert('Por favor, selecciona un archivo PDF válido.')
            return
        }

        setIsParsingPolicy(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        // Reset candidates
        setClientCandidates([])
        setParsedClientName(null)
        setParsedClientRFC(null)
        setParsedClientPhone(null)
        setParsedClientEmail(null)
        setParsedBranchName(null)
        setPolicyFileUrl(null)


        try {
            // 1. OCR Parsing (v75: Pass Auth Token)
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch('/api/policies/parse', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: uploadFormData
            })

            const data = await res.json()
            console.log("AI Extraction Result:", data);

            if (!res.ok) {
                throw new Error(data.error || 'Error al analizar la póliza')
            }

            // 2. Upload to Storage (v71)
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `caratulas/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('client_docs')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError)
                alert('⚠️ El PDF se procesó con IA pero falló la subida al servidor. La póliza se creará sin el archivo adjunto. Intenta subirlo manualmente después.')
                setPolicyFileUrl(null)
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('client_docs')
                    .getPublicUrl(filePath)
                setPolicyFileUrl(publicUrl)
            }

            // 173: Mapeo automático de resultados
            let updatedClientId = formData.client_id;
            let updatedInsurerId = formData.insurer_id;
            let updatedBranchId = formData.branch_id;
            let updatedAgentCodeId = formData.agent_code_id;
            const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            // 3. Smart Matching: Fuzzy search (Phase 17)
            if (data.client_name) {
                setParsedClientName(data.client_name)
                const aiNameNorm = normalize(data.client_name);

                const candidates = clients.map(c => {
                    const fullName = normalize(`${c.first_name} ${c.last_name}`);
                    // Exact match or partial match score
                    let score = 0;
                    if (fullName === aiNameNorm) score = 100;
                    else if (aiNameNorm.includes(fullName) || fullName.includes(aiNameNorm)) score = 80;
                    
                    const aiWords = aiNameNorm.split(/\s+/);
                    const clientWords = fullName.split(/\s+/);
                    const shared = aiWords.filter(w => clientWords.includes(w));
                    if (shared.length > 0) {
                        const wordScore = (shared.length / Math.max(aiWords.length, clientWords.length)) * 100;
                        score = Math.max(score, wordScore);
                    }

                    return { ...c, matchScore: score };
                }).filter(c => c.matchScore > 30).sort((a, b) => b.matchScore - a.matchScore);

                setClientCandidates(candidates);

                if (candidates.length > 0 && candidates[0].matchScore >= 95) {
                    updatedClientId = candidates[0].id;
                }
            }

            // 4. Smart Matching: Insurer (Fuzzy & Normalization)
            if (data.insurer_name && insurers.length > 0) {
                const aiInsurerNorm = normalize(data.insurer_name);
                
                const insurerCandidates = insurers.map(i => {
                    const iName = normalize(i.name);
                    const iAlias = i.alias ? normalize(i.alias) : "";
                    
                    let score = 0;
                    if (iName === aiInsurerNorm || iAlias === aiInsurerNorm) score = 100;
                    else if (iName.includes(aiInsurerNorm) || aiInsurerNorm.includes(iName) || 
                             (iAlias && (iAlias.includes(aiInsurerNorm) || aiInsurerNorm.includes(iAlias)))) {
                        score = 90;
                    } else {
                        // Word-based scoring for insurers
                        const aiWords = aiInsurerNorm.split(/\s+/).filter(w => w.length > 2);
                        const iWords = iName.split(/\s+/).concat(iAlias.split(/\s+/)).filter(w => w.length > 2);
                        const shared = aiWords.filter(w => iWords.includes(w));
                        if (shared.length > 0) {
                            score = (shared.length / Math.max(aiWords.length, iWords.length)) * 85;
                        }
                    }
                    return { ...i, score };
                }).filter(i => i.score > 40).sort((a, b) => b.score - a.score);

                if (insurerCandidates.length > 0) {
                    const bestInsurer = insurerCandidates[0];
                    updatedInsurerId = bestInsurer.id;

                    // Load codes for the matched insurer
                    const { data: codes } = await supabase
                        .from('agent_codes')
                        .select('id, code, description')
                        .eq('insurer_id', bestInsurer.id) as { data: any[] | null }

                    if (codes) {
                        setAgentCodes(codes)
                        // 5. Try to match agent code
                        if (data.agent_code) {
                            setParsedAgentCode(data.agent_code)
                            setParsedAgentName(data.agent_name || null)
                            const foundCode = codes.find(c =>
                                normalize(c.code).includes(normalize(data.agent_code)) ||
                                normalize(data.agent_code).includes(normalize(c.code))
                            )
                            if (foundCode) {
                                updatedAgentCodeId = foundCode.id
                            } else {
                                setNewAgentData({
                                    code: data.agent_code,
                                    broker_name: '',
                                    type: 'direct'
                                })
                                setShowAgentRegistration(true)
                            }
                        }
                    }
                }
            }

            // 5. Smart Matching: Branch (Phase 18)
            if (data.ramo && lines.length > 0) {
                setParsedBranchName(data.ramo);
                const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const aiRamo = normalize(data.ramo);

                // v19.3: Improved matching for "Autos" / "Vida" etc.
                const foundLine = lines.find(l => {
                    const lName = normalize(l.name);
                    if (lName.includes(aiRamo) || aiRamo.includes(lName)) return true;
                    // Keywords manuales (Fuzzy)
                    if (aiRamo.includes('auto') && lName.includes('automovil')) return true;
                    if (aiRamo.includes('medic') && lName.includes('gastos medicos')) return true;
                    if (aiRamo.includes('dañ') && lName.includes('daños')) return true;
                    return false;
                });
                if (foundLine) {
                    updatedBranchId = foundLine.id;
                }
            }

            setFormData(prev => ({
                ...prev,
                policy_number: data.policy_number || prev.policy_number,
                start_date: data.start_date || prev.start_date,
                end_date: data.end_date || prev.end_date,
                currency: data.currency || prev.currency,
                payment_method: data.payment_method || prev.payment_method,
                premium_net: data.premium_net ? formatInputCurrency(data.premium_net.toString()) : prev.premium_net,
                policy_fee: data.policy_fee ? formatInputCurrency(data.policy_fee.toString()) : prev.policy_fee,
                surcharge_amount: (parseNum(data.surcharge_amount) >= 0 && data.surcharge_amount) 
                    ? formatInputCurrency(data.surcharge_amount.toString()) 
                    : prev.surcharge_amount,
                discount_amount: (parseNum(data.surcharge_amount) < 0) 
                    ? formatInputCurrency(Math.abs(parseNum(data.surcharge_amount)).toString()) 
                    : (data.discount_amount ? formatInputCurrency(data.discount_amount.toString()) : prev.discount_amount),
                vat_amount: data.vat_amount ? formatInputCurrency(data.vat_amount.toString()) : prev.vat_amount,
                premium_total: data.premium_total ? formatInputCurrency(data.premium_total.toString()) : prev.premium_total,
                sub_branch: data.sub_ramo || prev.sub_branch,
                description: data.asset_description || prev.description,
                client_id: updatedClientId,
                insurer_id: updatedInsurerId,
                branch_id: updatedBranchId,
                agent_code_id: updatedAgentCodeId
            }))

            if (data.rfc) setParsedClientRFC(data.rfc)
            if (data.client_phone) setParsedClientPhone(data.client_phone)
            if (data.client_email) setParsedClientEmail(data.client_email)
            if (data.first_installment_extract) setParsedFirstInstallment(parseNum(data.first_installment_extract))

            // v27: Mejorar extracción de INE si el tipo detectado es Identificación
            if (data.document_type === 'Identificación' || data.document_type === 'INE') {
                if (data.id_number) {
                    setFormData(prev => ({ ...prev, notes: (prev.notes || '') + `\nID: ${data.id_number}` }))
                }
                if (data.expiration_date) {
                    setFormData(prev => ({ ...prev, notes: (prev.notes || '') + `\nVence ID: ${data.expiration_date}` }))
                }
            }


            // Notificamos al usuario del éxito (v19.4)
            if (data.client_name && !updatedClientId) {
                alert(`🔍 IA detectó al cliente: "${data.client_name}"\n\n⚠️ No encontramos un ID exacto. Por favor búscalo en la lista o usa el botón "Registrar como Nuevo" en el Paso 1.`)
            } else if (updatedClientId && updatedInsurerId && updatedBranchId) {
                alert('✨ EXCELENTE: IA vinculó todos los datos (Cliente, Aseguradora y Ramo). ¡Revisa y continúa!')
            } else {
                alert('✅ Póliza cargada. Algunos datos requieren selección manual (revisa los indicadores rojos).')
            }

            // v24: Ya NO saltamos al paso 2 automáticamente para permitir revisión en el paso 1
            // setStep(2)

        } catch (error: any) {
            console.error('OCR Error:', error)
            alert(error.message || 'Ocurrió un error leyendo el PDF con IA')
        } finally {
            setIsParsingPolicy(false)
            // Reset input
            e.target.value = ''
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        // Formato de miles en vivo para campos monetarios (v24)
        const currencyFields = [
            'premium_net', 'policy_fee', 'surcharge_amount', 'discount_amount',
            'extra_premium', 'vat_amount', 'commission_amount', 'fees_amount', 'adjustment_amount'
        ]

        if (currencyFields.includes(name)) {
            // Limpiar solo lo necesario para permitir el punto decimal y números
            const formatted = formatInputCurrency(value)
            setFormData(prev => ({ ...prev, [name]: formatted }))
            return
        }

        setFormData(prev => ({ ...prev, [name]: value }))

        // Auto-regenerar recibos al cambiar forma de pago (v24)
        if (name === 'payment_method') {
            const installmentsMap: any = {
                'Contado': 1,
                'Semestral': 2,
                'Trimestral': 4,
                'Mensual': 12
            }
            const count = installmentsMap[value] || 1
            setTimeout(() => generateInstallments(count), 100)
        }
    }

    const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!value) return;
        const num = parseNum(value);
        setFormData(prev => ({ ...prev, [name]: formatInputCurrency(num.toFixed(2)) }));
    }

    const handlePercentageBlur = (pctField: string, amountField: string) => {
        const pct = parseNum(formData[pctField as keyof typeof formData]);
        const net = parseNum(formData.premium_net);
        const calcAmt = net * (pct / 100);
        setFormData(prev => ({ ...prev, [amountField]: formatInputCurrency(calcAmt.toFixed(2)) }));
    }

    const handleVatPercentageBlur = () => {
        const pct = parseNum(formData.tax_percentage);
        const net = parseNum(formData.premium_net);
        const fee = parseNum(formData.policy_fee);
        const surch = parseNum(formData.surcharge_amount);
        const disc = parseNum(formData.discount_amount);
        const extra = parseNum(formData.extra_premium);
        const base = net + fee + surch - disc + extra;
        const vat = base * (pct / 100);
        setFormData(prev => ({ ...prev, vat_amount: formatInputCurrency(vat.toFixed(2)), tax: vat.toFixed(2) }));
    }

    // Lógica de Cálculos Automáticos (v24: IVA Reactivo y Totales)
    useEffect(() => {
        try {
            const net = parseNum(formData.premium_net);
            const fee = parseNum(formData.policy_fee);
            const surch = parseNum(formData.surcharge_amount);
            const disc = parseNum(formData.discount_amount);
            const extra = parseNum(formData.extra_premium);
            const taxPct = parseNum(formData.tax_percentage);

            // Calcular IVA primero (v24)
            const baseForVat = net + fee + surch - disc + extra;
            const calculatedVat = baseForVat * (taxPct / 100);
            const formattedVat = calculatedVat.toFixed(2);

            const total = baseForVat + calculatedVat;
            const formattedTotal = formatInputCurrency(total.toFixed(2));
            const nextVat = formatInputCurrency(formattedVat);

            setFormData(prev => {
                if (prev.premium_total === formattedTotal && prev.vat_amount === nextVat && prev.tax === formattedVat) return prev;

                return {
                    ...prev,
                    vat_amount: nextVat,
                    tax: formattedVat,
                    premium_total: formattedTotal
                }
            })
        } catch (e) {
            console.error("Calculation effect error safe catch", e)
        }
    }, [formData.premium_net, formData.policy_fee, formData.surcharge_amount, formData.discount_amount, formData.extra_premium, formData.tax_percentage])

    // Lógica de Vigencia Automática (v19.1)
    useEffect(() => {
        if (formData.start_date) {
            const start = new Date(formData.start_date)
            const end = new Date(start)
            end.setFullYear(start.getFullYear() + 1)

            // Formatear como YYYY-MM-DD para el input date
            const endStr = end.toISOString().split('T')[0]
            setFormData(prev => ({ ...prev, end_date: endStr }))
        }
    }, [formData.start_date])

    // Lógica de Reglas por Aseguradora / Forma Pago + Generación de Recibos (v19)
    useEffect(() => {
        const isQualitas = formData.insurer_id === '801ef4de-0485-4eba-977b-7b8f121e4f53'

        // Ajustar Cuotas Automáticas
        let count = 1
        let surcharge = '0'

        switch (formData.payment_method) {
            case 'Semestral': count = 2; if (isQualitas) surcharge = '5'; break;
            case 'Trimestral': count = 4; if (isQualitas) surcharge = '7'; break;
            case 'Mensual': count = 12; if (isQualitas) surcharge = '9'; break;
            default: count = 1; surcharge = '0';
        }

        setFormData(prev => ({
            ...prev,
            total_installments: count.toString(),
            surcharge_percentage: surcharge,
            policy_fee: isQualitas ? '650' : prev.policy_fee
        }))

        // Generar estructura base de recibos (v19)
        generateInstallments(count)
    }, [formData.payment_method, formData.insurer_id])

    const generateInstallments = (count: number) => {
        const input = {
            premiumNet: parseNum(formData.premium_net),
            policyFee: parseNum(formData.policy_fee),
            surchargeAmount: parseNum(formData.surcharge_amount),
            vatAmount: parseNum(formData.vat_amount),
            discountAmount: parseNum(formData.discount_amount),
            extraPremium: parseNum(formData.extra_premium),
            totalInstallments: count,
            startDate: new Date(formData.start_date || new Date()),
            config: getInsurerConfig(formData.insurer_id),
            firstInstallmentForced: parsedFirstInstallment || undefined
        }

        const newInstallments = calculateInstallments(input).map(inst => ({
            ...inst,
            premium_net: formatInputCurrency(inst.premium_net),
            policy_fee: formatInputCurrency(inst.policy_fee),
            surcharges: formatInputCurrency(inst.surcharges),
            vat_amount: formatInputCurrency(inst.vat_amount),
            total_amount: inst.total_amount // total_amount is handled by formatCurrency in display
        }))
        setInstallments(newInstallments)
    }

    const handleInstallmentChange = (index: number, field: string, value: string) => {
        const updated = [...installments]
        updated[index][field] = value

        // Si cambia algún monto parcial, recalcular total de esa fila
        if (['premium_net', 'policy_fee', 'surcharges', 'vat_amount'].includes(field)) {
            const net = parseFloat(updated[index].premium_net) || 0
            const fee = parseFloat(updated[index].policy_fee) || 0
            const surch = parseFloat(updated[index].surcharges) || 0
            const vat = parseFloat(updated[index].vat_amount) || 0
            updated[index].total_amount = (net + fee + surch + vat).toFixed(2)
        }

        setInstallments(updated)
    }

    const handleInsurerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        setFormData({ ...formData, insurer_id: id, agent_code_id: '' })
        if (id) fetchAgentCodes(id)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // --- VALIDACIÓN DE CAMPOS OBLIGATORIOS (v19.2) ---
        const missingFields = []
        if (!formData.client_id || formData.client_id.trim() === '') missingFields.push('Cliente')
        if (!formData.insurer_id || formData.insurer_id.trim() === '') missingFields.push('Aseguradora')
        if (!formData.policy_number || formData.policy_number.trim() === '') missingFields.push('Número de Póliza')
        if (!formData.branch_id || formData.branch_id.trim() === '') missingFields.push('Ramo')

        if (missingFields.length > 0) {
            alert(`⚠️ No se puede guardar: Faltan campos obligatorios: ${missingFields.join(', ')}. Por favor revisa el Paso 1 y 2.`)
            setStep(1) // Regresar al inicio para corregir
            return
        }

        setLoading(true)
        try {
            // --- DETECCIÓN DE DUPLICADOS (v27.1) ---
            const { data: existingPolicy } = await supabase
                .from('policies')
                .select('id, policy_number, insurers(name)')
                .eq('policy_number', formData.policy_number)
                .eq('insurer_id', formData.insurer_id)
                .maybeSingle()

            if (existingPolicy) {
                const insurerName = (existingPolicy as any).insurers?.name || 'la aseguradora seleccionada'
                if (!confirm(`⚠️ ATENCIÓN: Ya existe la póliza "${formData.policy_number}" para "${insurerName}". \n\n¿Estás seguro de que quieres crear un duplicado?`)) {
                    setLoading(false)
                    return
                }
            }

            // Clean empty strings to null for UUID foreign keys (Phase 18 Fix)
            const payload = {
                policy_number: formData.policy_number,
                status: formData.status,
                sub_branch: formData.sub_branch || null,
                start_date: formData.start_date,
                end_date: formData.end_date,
                issue_date: formData.issue_date || null,
                currency: formData.currency,
                payment_method: formData.payment_method,
                notes: formData.notes || null,
                client_id: (formData.client_id && formData.client_id.trim() !== '') ? formData.client_id : null,
                insurer_id: (formData.insurer_id && formData.insurer_id.trim() !== '') ? formData.insurer_id : null,
                agent_code_id: (formData.agent_code_id && formData.agent_code_id.trim() !== '') ? formData.agent_code_id : null,
                branch_id: (formData.branch_id && formData.branch_id.trim() !== '') ? formData.branch_id : null,
                premium_net: parseNum(formData.premium_net),
                tax: parseNum(formData.tax),
                premium_total: parseNum(formData.premium_total),
                // caratula_url: policyFileUrl || null, // v27: Removido por falta de columna en DB. Se usa policy_documents.
                total_installments: parseInt(formData.total_installments) || 1,
                current_installment: parseInt(formData.current_installment) || 1,
                payment_link: formData.payment_link || null,
                is_domiciled: formData.is_domiciled,
                // Nuevos campos financieros (v18)
                policy_fee: parseNum(formData.policy_fee),
                surcharge_percentage: parseNum(formData.surcharge_percentage),
                surcharge_amount: parseNum(formData.surcharge_amount),
                discount_percentage: parseNum(formData.discount_percentage),
                discount_amount: parseNum(formData.discount_amount),
                extra_premium: parseNum(formData.extra_premium),
                tax_percentage: parseFloat(formData.tax_percentage) || 16,
                vat_amount: parseFloat(formData.vat_amount) || 0,
                // v19 SICAS fields
                commission_percentage: parseFloat(formData.commission_percentage) || 0,
                fees_percentage: parseFloat(formData.fees_percentage) || 0,
                adjustment_amount: parseFloat(formData.adjustment_amount) || 0,
                description: formData.description || null
            }

            console.log("PAYLOAD a insertar:", payload)
            const { error, data: policyData } = await (supabase.from('policies') as any).insert([payload]).select().single()

            if (error) {
                console.error("Supabase returned error", error)
                throw error
            }

            // INSERTAR RECIBOS (INSTALLMENTS) v19
            if (policyData && installments.length > 0) {
                const installmentsPayload = installments.map(inst => ({
                    policy_id: policyData.id,
                    installment_number: inst.installment_number,
                    due_date: inst.due_date,
                    premium_net: parseFloat(inst.premium_net),
                    policy_fee: parseFloat(inst.policy_fee),
                    surcharges: parseFloat(inst.surcharges),
                    vat_amount: parseFloat(inst.vat_amount),
                    total_amount: parseFloat(inst.total_amount),
                    status: 'Pendiente'
                }))

                const { error: instError } = await (supabase.from('policy_installments') as any)
                    .insert(installmentsPayload)

                if (instError) console.error("Error guardando recibos:", instError)
            }

            // VINCULAR CARÁTULA (v25) - Persistencia robusta
            if (policyData?.id && policyFileUrl) {
                console.log("Vinculando carátula PDF...", policyFileUrl)
                const { error: docError } = await (supabase.from('policy_documents') as any)
                    .insert({
                        policy_id: policyData.id,
                        name: 'Carátula_Original.pdf',
                        document_type: 'Carátula',
                        file_url: policyFileUrl,
                        notes: 'Cargado automáticamente mediante IA'
                    })
                if (docError) {
                    console.error("Error vinculando carátula:", docError)
                    alert("⚠️ La póliza se guardó pero hubo un error al vincular el PDF. Por favor, cárguelo manualmente en detalles.")
                } else {
                    console.log("Carátula vinculada con éxito.");
                }
            } else if (policyFileUrl && !policyData?.id) {
                console.error("No se pudo vincular carátula: policyData.id es nulo", policyData);
            }

            setCreatedPolicyId(policyData.id)
            setShowSuccess(true)
            // router.push('/dashboard/policies') // Quitamos el redirect inmediato
        } catch (error: any) {
            console.error('Error saving policy complete:', error)
            alert('Error detallado de Base de Datos:\n' + JSON.stringify(error, null, 2))
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        { id: 1, name: 'Asignación', icon: User },
        { id: 2, name: 'Detalles', icon: Shield },
        { id: 3, name: 'Vigencia', icon: CreditCard },
        { id: 4, name: 'Económicos', icon: FileText },
    ]

    const handleSendWelcome = () => {
        const client = clients.find(c => c.id === formData.client_id)
        const insurer = insurers.find(i => i.id === formData.insurer_id)
        const msg = getWelcomeMessage(
            `${client?.first_name} ${client?.last_name}`,
            formData.policy_number,
            insurer?.name || 'Aseguradora',
            lines.find(l => l.id === formData.branch_id)?.name || 'Seguro',
            formData.payment_method,
            formData.start_date,
            formData.end_date,
            parseNum(formData.premium_total),
            installments[0] ? parseNum(installments[0].total_amount) : 0,
            installments[1] ? parseNum(installments[1].total_amount) : 0,
            formData.start_date, // Límite 1er pago
            policyFileUrl || 'Link no disponible',
            formData.currency === 'USD' ? 'USD$' : '$',
            formData.description || 'Amplia'
        )
        window.open(generateWhatsAppLink(client?.whatsapp || client?.phone || '', msg), '_blank')
    }

    if (showSuccess) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Póliza Guardada!</h2>
                    <p className="text-slate-500 font-medium">La póliza y sus recibos se han generado correctamente.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-6">
                    <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Póliza Registrada Para</p>
                            <p className="font-bold text-slate-900">
                                {clients.find(c => c.id === formData.client_id)?.first_name || 'Cliente'} {clients.find(c => c.id === formData.client_id)?.last_name || ''}
                            </p>
                        </div>
                    </div>
                    
                    <div className={`flex items-center justify-center gap-3 p-3 rounded-2xl border transition-all ${policyFileUrl ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                        {policyFileUrl ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <p className="text-[10px] font-black uppercase tracking-widest text-center">
                            {policyFileUrl ? 'PDF de Carátula Vinculado ✅' : '⚠️ PDF de Carátula NO disponible'}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className={`p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${syncSummary.rfc ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>RFC</div>
                        <div className={`p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${syncSummary.phone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>Teléfono</div>
                        <div className={`p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${syncSummary.email ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>Email</div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <button
                            onClick={() => {
                                const client = clients.find(c => c.id === formData.client_id)
                                const insurer = insurers.find(i => i.id === formData.insurer_id)
                                const line = lines.find(l => l.id === formData.branch_id)
                                const msg = getWelcomeMessage(
                                    `${client?.first_name} ${client?.last_name}`,
                                    formData.policy_number,
                                    insurer?.name || 'Aseguradora',
                                    line?.name || 'Seguro',
                                    formData.payment_method,
                                    formData.start_date,
                                    formData.end_date,
                                    parseNum(formData.premium_total),
                                    installments[0] ? parseNum(installments[0].total_amount) : 0,
                                    installments[1] ? parseNum(installments[1].total_amount) : 0,
                                    formData.start_date,
                                    policyFileUrl || 'Link no disponible',
                                    formData.currency === 'USD' ? 'USD$' : '$',
                                    formData.description || 'Amplia'
                                )
                                setSelectorConfig({
                                    type: 'whatsapp',
                                    message: msg
                                })
                                setShowContactSelector(true)
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]"
                        >
                            <MessageSquare className="w-5 h-5" />
                            MANDAR WHATSAPP DE BIENVENIDA ✨
                        </button>

                        <button
                            onClick={() => {
                                const client = clients.find(c => c.id === formData.client_id)
                                const insurer = insurers.find(i => i.id === formData.insurer_id)
                                const line = lines.find(l => l.id === formData.branch_id)
                                const msg = getWelcomeMessage(
                                    `${client?.first_name} ${client?.last_name}`,
                                    formData.policy_number,
                                    insurer?.name || insurer?.alias || 'Aseguradora',
                                    line?.name || 'Seguro',
                                    formData.payment_method,
                                    formData.start_date,
                                    formData.end_date,
                                    parseNum(formData.premium_total),
                                    installments[0] ? parseNum(installments[0].total_amount) : 0,
                                    installments[1] ? parseNum(installments[1].total_amount) : 0,
                                    formData.start_date,
                                    policyFileUrl || 'Link no disponible',
                                    formData.currency === 'USD' ? 'USD$' : '$',
                                    formData.description || 'Amplia'
                                )
                                setSelectorConfig({
                                    type: 'email',
                                    message: msg,
                                    subject: `Bienvenida: Póliza ${formData.policy_number} - ${insurer?.alias || insurer?.name}`
                                })
                                setShowContactSelector(true)
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-4 rounded-2xl font-bold transition-all"
                        >
                            <MailIcon className="w-5 h-5" />
                            MANDAR BIENVENIDA POR CORREO 📧
                        </button>

                        <Link
                            href={`/dashboard/clients/${formData.client_id}?tab=comunicaciones`}
                            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold transition-all"
                        >
                            ⚙️ CONFIGURAR ALERTAS AUTOMÁTICAS
                        </Link>

                        <button
                            onClick={() => router.push('/dashboard/policies')}
                            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold transition-all"
                        >
                            VER LISTADO DE PÓLIZAS
                        </button>
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Portal de Seguros v2.5 • Intelligence Core</p>
            </div>
        )
    }

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard/policies" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Pólizas
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">v.11-03-2026 07:40 PM</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">Nueva Póliza</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
            </div>

            {/* Stepper */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((s) => {
                        const Icon = s.icon
                        const isActive = step >= s.id
                        const isCurrent = step === s.id
                        return (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={() => setStep(s.id)}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 border-2 border-emerald-400' :
                                    isActive ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-200' : 'bg-white text-slate-300 border-2 border-slate-100'
                                    }`}>
                                    {isActive && !isCurrent && step > s.id ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                    {s.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8">
                    {/* Step 1: Client & Insurer */}
                    <div className={`space-y-6 ${step === 1 ? 'block' : 'hidden'}`}>
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Asignación de Póliza</h3>
                            <p className="text-slate-500 text-sm italic">Vincule la póliza con un cliente y su respectiva aseguradora.</p>
                        </div>

                        {/* Zona de Lectura Inteligente IA */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/30 border-2 border-dashed border-indigo-200 rounded-3xl p-8 relative overflow-hidden group transition-all hover:border-indigo-400">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl -ml-12 -mb-12 pointer-events-none"></div>

                            <input
                                type="file"
                                accept=".pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileUpload}
                                disabled={isParsingPolicy}
                            />

                            <div className="relative z-0 flex flex-col items-center justify-center text-center space-y-4">
                                {isParsingPolicy ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <h4 className="font-bold text-indigo-900">IA Analizando la Póliza...</h4>
                                        <p className="text-sm text-indigo-600/80 max-w-sm">Extrayendo números, fechas, primas e impuestos. Esto tardará unos segundos.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-bold text-indigo-900">Auto-llenado Mágico con IA 🪄</h4>
                                            <p className="text-sm text-indigo-600/80">Arrastra aquí el <b className="font-black">PDF</b> de la carátula o haz clic para subirlo.</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>Cliente Asegurado</span>
                                        {formData.client_id && parsedClientName && (
                                            <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in zoom-in duration-500">
                                                <CheckCircle2 className="w-3 h-3" /> IA EMPATADO
                                            </span>
                                        )}
                                    </div>
                                    {!formData.client_id && <span className="text-[10px] text-rose-500 font-black animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> REQUERIDO</span>}
                                </label>
                                <div className="relative">
                                    <div
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all"
                                        onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {formData.client_id ? (
                                                <span className="font-bold text-slate-900 truncate">
                                                    {clients.find(c => c.id === formData.client_id)?.first_name} {clients.find(c => c.id === formData.client_id)?.last_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Seleccionar Cliente...</span>
                                            )}
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isClientDropdownOpen ? 'rotate-90' : ''}`} />
                                    </div>

                                    {isClientDropdownOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-3 border-b border-slate-100">
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Buscar por nombre..."
                                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                        value={clientSearch}
                                                        onChange={(e) => setClientSearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                {clients
                                                    .filter(c =>
                                                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())
                                                    )
                                                    .map(c => (
                                                        <div
                                                            key={c.id}
                                                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${formData.client_id === c.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50'}`}
                                                            onClick={() => {
                                                                setFormData({ ...formData, client_id: c.id });
                                                                setIsClientDropdownOpen(false);
                                                                setClientSearch('');
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">{c.first_name} {c.last_name}</span>
                                                            </div>
                                                            {formData.client_id === c.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                                        </div>
                                                    ))}
                                                {clients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                                                    <div className="p-8 text-center">
                                                        <User className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                        <p className="text-xs text-slate-400 font-medium">No se encontraron clientes</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Fase 17: Sugerencias de Clientes Inteligent */}
                                {parsedClientName && clientCandidates.length > 0 && !formData.client_id && (
                                    <div className="mt-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-indigo-900 uppercase">Candidatos Detectados ({clientCandidates.length})</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {clientCandidates.slice(0, 3).map(candidate => (
                                                <button
                                                    key={candidate.id}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, client_id: candidate.id }))}
                                                    className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left"
                                                >
                                                    <div>
                                                        <p className="font-bold text-slate-900">{candidate.first_name} {candidate.last_name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">COINCIDENCIA: {Math.round(candidate.matchScore)}%</p>
                                                    </div>
                                                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-lg font-bold">SELECCIONAR</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {parsedClientName && clientCandidates.length === 0 && !formData.client_id && (
                                    <div className="mt-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-700 uppercase">Nuevo Cliente</p>
                                                <p className="font-bold text-slate-900">{parsedClientName}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="text-[10px] bg-amber-600 text-white px-3 py-2 rounded-xl font-bold hover:bg-amber-700 transition-all uppercase tracking-widest shadow-sm"
                                            onClick={async () => {
                                                // Quick Create Logic
                                                const [first, ...rest] = (parsedClientName || '').split(' ');

                                                // v24: Normalizar WhatsApp (+52)
                                                let finalPhone = parsedClientPhone || '';
                                                if (finalPhone && finalPhone.replace(/\D/g, '').length === 10) {
                                                    finalPhone = `+52${finalPhone.replace(/\D/g, '')}`;
                                                }

                                                const { data: newClient, error } = await (supabase.from('clients') as any).insert({
                                                    user_id: (await supabase.auth.getUser()).data.user?.id,
                                                    first_name: first,
                                                    last_name: rest.join(' '),
                                                    status: 'active',
                                                    rfc: parsedClientRFC,
                                                    birth_date: parsedClientRFC ? extractBirthDateFromRFC(parsedClientRFC) : null,
                                                    phone: finalPhone,
                                                    mobile_phone: finalPhone, // v27: Sync Mobile Phone
                                                    whatsapp: finalPhone, // v19.5: Sync WhatsApp
                                                    email: parsedClientEmail
                                                }).select().single();

                                                if (newClient) {
                                                    setClients(prev => [...prev, newClient]);
                                                    setFormData(prev => ({ ...prev, client_id: newClient.id }));
                                                    alert(`✅ Cliente "${newClient.first_name}" registrado y vinculado.`);
                                                }
                                            }}
                                        >
                                            Registrar como Nuevo
                                        </button>
                                    </div>
                                )}

                                {formData.client_id && (parsedClientRFC || parsedClientPhone || parsedClientEmail) && (
                                    <div className="mt-2 text-right space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Sincronización Inteligente</p>
                                        <button
                                            type="button"
                                            className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center justify-end gap-1 ml-auto"
                                            onClick={async () => {
                                                const updates: any = {};
                                                if (parsedClientRFC) {
                                                    updates.rfc = parsedClientRFC;
                                                    updates.birth_date = extractBirthDateFromRFC(parsedClientRFC);
                                                }
                                                if (parsedClientPhone) {
                                                    // v24: Normalizar WhatsApp (+52)
                                                    let finalPhone = parsedClientPhone;
                                                    if (finalPhone && finalPhone.replace(/\D/g, '').length === 10) {
                                                        finalPhone = `+52${finalPhone.replace(/\D/g, '')}`;
                                                    }
                                                    updates.phone = finalPhone;
                                                    updates.mobile_phone = finalPhone; // v27: Sync Mobile Phone
                                                    updates.whatsapp = finalPhone; // v19.5: Sync WhatsApp
                                                }
                                                if (parsedClientEmail) updates.email = parsedClientEmail;

                                                const { error } = await (supabase.from('clients') as any).update(updates).eq('id', formData.client_id);
                                                if (!error) {
                                                    setSyncSummary({
                                                        rfc: !!parsedClientRFC,
                                                        phone: !!parsedClientPhone,
                                                        email: !!parsedClientEmail
                                                    })
                                                    alert('Datos sincronizados con éxito al cliente seleccionado.');
                                                }
                                            }}
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            SINCRONIZAR DATOS DEL PDF AL CLIENTE
                                        </button>
                                    </div>
                                )}

                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>Compañía Aseguradora</span>
                                        {formData.insurer_id && formData.insurer_id !== '' && (
                                            <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in zoom-in duration-500">
                                                <CheckCircle2 className="w-3 h-3" /> IA EMPATADO
                                            </span>
                                        )}
                                    </div>
                                    {!formData.insurer_id && <span className="text-[10px] text-rose-500 font-black animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> REQUERIDO</span>}
                                </label>
                                <select
                                    required
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.insurer_id}
                                    onChange={handleInsurerChange}
                                >
                                    <option value="">Seleccionar Aseguradora...</option>
                                    {insurers.map(i => (
                                        <option key={i.id} value={i.id}>{i.alias || i.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Clave de Agente / Conducto</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.agent_code_id}
                                    onChange={(e) => setFormData({ ...formData, agent_code_id: e.target.value })}
                                    disabled={!formData.insurer_id}
                                >
                                    <option value="">Seleccionar Clave...</option>
                                    {agentCodes.map(a => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.description}</option>
                                    ))}
                                </select>
                                {parsedAgentCode && !formData.agent_code_id && (
                                    <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Nueva Clave Detectada: "{parsedAgentCode}"</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                className="text-[10px] p-1.5 rounded-lg border border-indigo-100 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={newAgentData.broker_name}
                                                onChange={(e) => setNewAgentData({ ...newAgentData, broker_name: e.target.value })}
                                            >
                                                <option value="">Despacho / Directo</option>
                                                <option value="ClickSeguros">ClickSeguros</option>
                                                <option value="Aarco">Aarco</option>
                                                <option value="Grupo Inglaterra">Grupo Inglaterra</option>
                                                <option value="Particular">Particular / Otro</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const { data, error } = await (supabase.from('agent_codes') as any).insert({
                                                        user_id: (await supabase.auth.getUser()).data.user?.id,
                                                        insurer_id: formData.insurer_id,
                                                        code: newAgentData.code,
                                                        broker_name: newAgentData.broker_name || null,
                                                        type: newAgentData.broker_name ? 'broker' : 'direct',
                                                        description: `Auto-capturado: ${parsedAgentName || 'Agente'}`
                                                    }).select().single()

                                                    if (data) {
                                                        setAgentCodes(prev => [...prev, data])
                                                        setFormData(prev => ({ ...prev, agent_code_id: data.id }))
                                                        alert('✅ Clave de agente guardada y vinculada con éxito.')
                                                    }
                                                }}
                                                className="bg-indigo-600 text-white text-[10px] px-2 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-all uppercase tracking-widest"
                                            >
                                                Registrar Clave
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {parsedAgentCode && formData.agent_code_id && (
                                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Clave reconocida: "{parsedAgentCode}"</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Policy Details */}
                    <div className={`space-y-6 ${step === 2 ? 'block' : 'hidden'}`}>
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Especificaciones Técnicas</h3>
                            <p className="text-slate-500 text-sm italic">Defina el ramo y número de identificación oficial.</p>
                        </div>

                        {parsedClientName && (
                            <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Borrador IA Detectado</p>
                                        <p className="font-bold">{parsedClientName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Póliza</p>
                                    <p className="font-mono text-sm">{formData.policy_number || '---'}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Número de Póliza</label>
                                <input
                                    type="text"
                                    required
                                    name="policy_number"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold uppercase"
                                    placeholder="EJ. POL-123456"
                                    value={formData.policy_number}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1 flex justify-between items-center">
                                    <span>Ramo del Seguro</span>
                                    {!formData.branch_id && <span className="text-[10px] text-rose-500 font-black animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> REQUERIDO</span>}
                                </label>
                                <select
                                    required
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                >
                                    <option value="">Seleccionar Ramo...</option>
                                    {lines.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                {parsedBranchName && !formData.branch_id && (
                                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-amber-700 uppercase">IA Detectó Ramo: "{parsedBranchName}" (No hay coincidencia exacta)</span>
                                    </div>
                                )}
                                {parsedBranchName && formData.branch_id && (
                                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Ramo Empatado: "{parsedBranchName}"</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Sub-Ramo / Plan</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Cobertura Amplia / GMM Premium"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.sub_branch}
                                    onChange={(e) => setFormData({ ...formData, sub_branch: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Descripción del Bien (Auto, Inmueble, etc.)</label>
                                <input
                                    type="text"
                                    name="description"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all capitalize"
                                    placeholder="Ej. Jetta 2024 GL"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Estado Operativo</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Vigente">Vigente</option>
                                    <option value="Pendiente">Pendiente de Emisión</option>
                                    <option value="Vencida">Vencida</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Link de Pago / Línea de Captura</label>
                                <input
                                    type="text"
                                    name="payment_link"
                                    value={formData.payment_link}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-xs"
                                    placeholder="https://pagos.aseguradora.com/..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="is_domiciled"
                                name="is_domiciled"
                                checked={formData.is_domiciled}
                                onChange={handleChange}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor="is_domiciled" className="text-sm font-bold text-slate-700">
                                Esta póliza está domiciliada (Cargo automático)
                            </label>
                        </div>
                    </div>

                    {/* Step 3: Dates */}
                    <div className={`space-y-6 ${step === 3 ? 'block' : 'hidden'}`}>
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Vigencia y Control</h3>
                            <p className="text-slate-500 text-sm italic">Establezca los periodos de protección legal.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Inicio de Vigencia</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Fin de Vigencia</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block ml-1">Fecha Emisión (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.issue_date}
                                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="text-sm">
                                <p className="font-bold text-emerald-800 uppercase tracking-tight">Recordatorio de Renovación</p>
                                <p className="text-emerald-700/80 leading-snug">El sistema generará una alerta automática 30 días antes del vencimiento para asegurar la continuidad de la protección.</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Economics */}
                    {
                        step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
                                <div className="border-b border-slate-100 pb-4 mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">Configuración Financiera</h3>
                                    <p className="text-slate-500 text-sm italic">Defina la moneda, forma de pago y los montos exactos de su carátula.</p>
                                </div>

                                {/* v24: Pago y Moneda arriba para mejor flujo */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50 shadow-sm">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-emerald-900 block ml-1">Moneda de la Póliza</label>
                                        <select
                                            name="currency"
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                                            value={formData.currency}
                                            onChange={handleChange}
                                        >
                                            <option value="MXN">Pesos (MXN)</option>
                                            <option value="USD">Dólares (USD)</option>
                                            <option value="UDI">UDIS</option>
                                            <option value="EUR">Euros (EUR)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-emerald-900 block ml-1">Forma de Pago</label>
                                        <select
                                            name="payment_method"
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-700"
                                            value={formData.payment_method}
                                            onChange={handleChange}
                                        >
                                            <option value="Contado">Anual / Contado</option>
                                            <option value="Semestral">Semestral</option>
                                            <option value="Trimestral">Trimestral</option>
                                            <option value="Mensual">Mensual</option>
                                        </select>
                                    </div>
                                </div>



                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between group">
                                                <span className="text-sm text-slate-500 font-medium">Prima Neta</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-300 font-bold">$</span>
                                                    <input
                                                        type="text"
                                                        name="premium_net"
                                                        className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                        placeholder="0.00"
                                                        value={formData.premium_net}
                                                        onChange={handleChange}
                                                        onBlur={handleAmountBlur}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <span className="text-sm text-slate-500 font-medium">Derecho de Póliza</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-300 font-bold">$</span>
                                                    <input
                                                        type="text"
                                                        name="policy_fee"
                                                        className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                        value={formData.policy_fee}
                                                        onChange={handleChange}
                                                        onBlur={handleAmountBlur}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <span className="text-sm text-slate-500 font-medium">Extraprima / Cob. Adicionales</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-300 font-bold">$</span>
                                                    <input
                                                        type="text"
                                                        name="extra_premium"
                                                        className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                        placeholder="0.00"
                                                        value={formData.extra_premium}
                                                        onChange={handleChange}
                                                        onBlur={handleAmountBlur}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-500 font-medium">Recargo Financiero</span>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            name="surcharge_percentage"
                                                            value={formData.surcharge_percentage}
                                                            onChange={handleChange}
                                                            onBlur={() => handlePercentageBlur('surcharge_percentage', 'surcharge_amount')}
                                                            className="w-12 text-xs p-1 border-b border-slate-200 outline-none focus:border-emerald-500"
                                                        />
                                                        <span className="text-[10px] text-slate-400 font-bold">%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-emerald-600 font-bold text-sm">+ $</span>
                                                    <input
                                                        type="text"
                                                        name="surcharge_amount"
                                                        value={formData.surcharge_amount}
                                                        onChange={handleChange}
                                                        onBlur={handleAmountBlur}
                                                        className="w-24 font-bold text-emerald-600 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 outline-none text-right"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-500 font-medium">Descuento</span>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            name="discount_percentage"
                                                            value={formData.discount_percentage}
                                                            onChange={handleChange}
                                                            onBlur={() => handlePercentageBlur('discount_percentage', 'discount_amount')}
                                                            className="w-12 text-xs p-1 border-b border-slate-200 outline-none focus:border-rose-500"
                                                        />
                                                        <span className="text-[10px] text-slate-400 font-bold">%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-rose-500 font-bold text-sm">- $</span>
                                                    <input
                                                        type="text"
                                                        name="discount_amount"
                                                        value={formData.discount_amount}
                                                        onChange={handleChange}
                                                        onBlur={handleAmountBlur}
                                                        className="w-24 font-bold text-rose-500 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-rose-500 outline-none text-right"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16"></div>

                                            <div className="space-y-3 relative z-10">
                                                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    <span>Subtotal antes de IVA</span>
                                                    <span className="text-sm text-slate-300">
                                                        {formData.currency} ${formatCurrency((parseNum(formData.premium_net) + parseNum(formData.policy_fee) + parseNum(formData.surcharge_amount) + parseNum(formData.extra_premium) - parseNum(formData.discount_amount)).toFixed(2))}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-baseline group">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-400">Total Impuestos (IVA)</span>
                                                        <input
                                                            type="number"
                                                            name="tax_percentage"
                                                            value={formData.tax_percentage}
                                                            onChange={handleChange}
                                                            onBlur={handleVatPercentageBlur}
                                                            className="w-12 bg-transparent border-b border-slate-600 outline-none focus:border-emerald-400 text-center text-lg font-black text-white"
                                                        /> <span className="text-lg font-black text-white">%</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-emerald-400 font-bold">+ $</span>
                                                        <input
                                                            type="text"
                                                            name="vat_amount"
                                                            value={formData.vat_amount}
                                                            onChange={handleChange}
                                                            onBlur={handleAmountBlur}
                                                            className="w-24 bg-transparent border-b border-transparent hover:border-slate-600 outline-none focus:border-emerald-400 text-right font-bold text-emerald-400 text-lg"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-500 font-bold uppercase">Prima Total a Cobrar</span>
                                                        <span className="text-3xl font-black text-white">
                                                            ${formatCurrency(formData.premium_total)}
                                                        </span>
                                                    </div>
                                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                        <CreditCard className="w-6 h-6 text-emerald-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                                        <label className="text-sm font-bold text-slate-700 block ml-1">Generación de Recibos</label>
                                        <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-emerald-800">{formData.total_installments} recibos</p>
                                                <p className="text-[10px] text-slate-500">Calculados auto.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => generateInstallments(parseInt(formData.total_installments || '1'))}
                                                className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                            >
                                                Regenerar Grid
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* TABLA DE RECIBOS EDITABLES (v19) */}
                                {installments.length > 0 && (
                                    <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gestión de Recibos</span>
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Editable</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-100 text-slate-500 font-bold">
                                                    <tr>
                                                        <th className="p-3">#</th>
                                                        <th className="p-3">Vencimiento</th>
                                                        <th className="p-3">Prima Neta</th>
                                                        <th className="p-3">Derecho</th>
                                                        <th className="p-3">Recargo</th>
                                                        <th className="p-3">IVA</th>
                                                        <th className="p-3 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 italic">
                                                    {installments.map((inst, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="p-3 font-bold text-slate-400">{inst.installment_number}</td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="date"
                                                                    value={inst.due_date}
                                                                    onChange={(e) => handleInstallmentChange(idx, 'due_date', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-1 font-medium w-full"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    value={inst.premium_net}
                                                                    onBlur={(e) => handleInstallmentChange(idx, 'premium_net', formatInputCurrency(String(e.target.value || '').replace(/,/g, '')))}
                                                                    onChange={(e) => handleInstallmentChange(idx, 'premium_net', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-1 w-24 text-right font-medium"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    value={inst.policy_fee}
                                                                    onBlur={(e) => handleInstallmentChange(idx, 'policy_fee', formatInputCurrency(String(e.target.value || '').replace(/,/g, '')))}
                                                                    onChange={(e) => handleInstallmentChange(idx, 'policy_fee', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-1 w-24 text-right font-medium"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    value={inst.surcharges}
                                                                    onBlur={(e) => handleInstallmentChange(idx, 'surcharges', formatInputCurrency(String(e.target.value || '').replace(/,/g, '')))}
                                                                    onChange={(e) => handleInstallmentChange(idx, 'surcharges', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-1 w-24 text-right font-medium"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    value={inst.vat_amount}
                                                                    onBlur={(e) => handleInstallmentChange(idx, 'vat_amount', formatInputCurrency(String(e.target.value || '').replace(/,/g, '')))}
                                                                    onChange={(e) => handleInstallmentChange(idx, 'vat_amount', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-1 w-24 text-right font-medium"
                                                                />
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-slate-900 bg-slate-50/30 border-l border-slate-100">
                                                                ${formatCurrency(inst.total_amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <hr className="border-slate-100 my-8" />

                                <div className="space-y-2 pb-6">
                                    <label className="text-sm font-bold text-slate-700 block ml-1">Observaciones Internas</label>
                                    <textarea
                                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all h-24"
                                        placeholder="Detalles adicionales, número de serie de autos, asegurados adicionales, etc..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        )
                    }
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Anterior
                    </button>

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={() => {
                                // v19.4: Validación por pasos
                                if (step === 1) {
                                    if (!formData.client_id || !formData.insurer_id) {
                                        alert('⚠️ Antes de avanzar, asegúrate de haber seleccionado o registrado al Cliente y la Aseguradora.');
                                        return;
                                    }
                                }
                                if (step === 2) {
                                    if (!formData.policy_number || !formData.branch_id) {
                                        alert('⚠️ Es obligatorio contar con el Número de Póliza y el Ramo del seguro para continuar.');
                                        return;
                                    }
                                }
                                setStep(step + 1);
                            }}
                            className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 translate-x-1"
                        >
                            Siguiente
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Finalizar Registro
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Hint Box */}
            <div className="flex justify-center mt-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-xs text-slate-400 font-medium italic">
                    <Upload className="w-3.5 h-3.5" />
                    {policyFileUrl ? 'Carátula vinculada correctamente ✅' : 'Consejo: Podrá cargar el PDF de la carátula una vez guardada la base de la póliza.'}
                </div>
            </div>
        </div>

        {/* Modal Selección de Contacto */}
        {showContactSelector && selectorConfig && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectorConfig.type === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                {selectorConfig.type === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : <MailIcon className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Seleccionar {selectorConfig.type === 'whatsapp' ? 'WhatsApp' : 'Email'}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">¿A quién enviamos el mensaje?</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowContactSelector(false)}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2 bg-white">
                        {(() => {
                            const client = clients.find(c => c.id === formData.client_id)
                            const options: any[] = []

                            if (client) {
                                if (selectorConfig.type === 'whatsapp') {
                                    if (client.whatsapp) options.push({ label: 'WhatsApp Principal', value: client.whatsapp, icon: <Phone className="w-3 h-3" />, name: `${client.first_name} ${client.last_name}` })
                                    if (client.phone && client.phone !== client.whatsapp) options.push({ label: 'Teléfono Secundario', value: client.phone, icon: <Phone className="w-3 h-3" />, name: `${client.first_name} ${client.last_name}` })
                                } else {
                                    if (client.email) options.push({ label: 'Email Principal', value: client.email, icon: <MailIcon className="w-3 h-3" />, name: `${client.first_name} ${client.last_name}` })
                                    if (client.secondary_email) options.push({ label: 'Email Secundario', value: client.secondary_email, icon: <MailIcon className="w-3 h-3" />, name: `${client.first_name} ${client.last_name}` })
                                }

                                // Relaciones (Familia/Socios)
                                if (client.related_contacts && Array.isArray(client.related_contacts)) {
                                    client.related_contacts.forEach((rel: any) => {
                                        if (selectorConfig.type === 'whatsapp' && rel.phone) {
                                            options.push({ label: rel.relation || 'Relacionado', value: rel.phone, icon: <Users className="w-3 h-3" />, name: rel.name })
                                        } else if (selectorConfig.type === 'email' && rel.email) {
                                            options.push({ label: rel.relation || 'Relacionado', value: rel.email, icon: <Users className="w-3 h-3" />, name: rel.name })
                                        }
                                    })
                                }
                            }

                            return options.length > 0 ? options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (selectorConfig.type === 'whatsapp') {
                                            window.open(generateWhatsAppLink(opt.value, selectorConfig.message), '_blank')
                                        } else {
                                            const subject = encodeURIComponent(selectorConfig.subject || 'Notificación de Seguro')
                                            const mailto = `mailto:${opt.value}?subject=${subject}&body=${encodeURIComponent(selectorConfig.message)}`
                                            window.open(mailto, '_blank')
                                        }
                                        setShowContactSelector(false)
                                        if (selectorConfig.onSelect) selectorConfig.onSelect(opt)
                                    }}
                                    className="w-full p-4 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 transition-all hover:border-emerald-200 text-left group"
                                >
                                    <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${selectorConfig.type === 'whatsapp' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 truncate">{opt.name}</p>
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-full">{opt.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium truncate">{opt.value}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                    </div>
                                </button>
                            )) : (
                                <div className="p-8 text-center space-y-2">
                                    <p className="text-slate-400 font-medium italic">No se encontraron contactos para este medio.</p>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            </div>
        )}
    </>
    )
}
