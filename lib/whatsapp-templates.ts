export type PaymentMethod = 'Contado' | 'Semestral' | 'Trimestral' | 'Mensual' | 'Anual' | 'Domiciliado'

// Helper para formatear fechas (v16 - Formato numérico ordenado)
const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${day}-${month}-${year}`
}

// Helper para generar el link de WhatsApp
export const generateWhatsAppLink = (phone: string, text: string) => {
    // Limpiar el teléfono para que solo tenga números
    const cleanPhone = phone.replace(/\D/g, '')
    const encodedText = encodeURIComponent(text)
    return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

/**
 * Genera el copy de WhatsApp basado en las reglas de negocio (v24 - Formato Rico Premium)
 */
export const getCollectionMessage = (
    clientName: string,
    policyType: string,
    insurerName: string,
    policyNumber: string,
    amount: number,
    paymentMethod: PaymentMethod,
    daysRemaining: number,
    startDate: string,
    targetDate: string,
    subBranch?: string,
    notes?: string,
    currentInstallment?: number,
    totalInstallments?: number,
    paymentLink?: string,
    currencySymbol: string = '$'
) => {
    const isAnual = paymentMethod === 'Contado' || paymentMethod === 'Anual'
    const isDomiciliado = paymentMethod === 'Domiciliado' || paymentMethod?.toLowerCase().includes('tarjeta')

    // Configuración de Iconos y Estados
    let statusIcon = '📅'
    let alertTitle = 'RECORDATORIO DE PAGO'
    let footerMessage = '¿Te comparto la línea de captura para pago? 😊'

    if (daysRemaining <= 0) {
        statusIcon = '🚨'
        alertTitle = 'AVISO DE COBRO URGENTE'
        footerMessage = 'Favor de confirmar su pago a la brevedad para evitar la cancelación. 🙏'
    } else if (daysRemaining <= 7) {
        statusIcon = '🕒'
        alertTitle = 'PENDIENTE DE PAGO'
    }

    if (isDomiciliado) {
        statusIcon = '💳'
        alertTitle = 'AVISO DE CARGO AUTOMÁTICO'
        footerMessage = 'Solo asegúrate de contar con los fondos disponibles en tu cuenta. ¡Saludos! 🚀'
    }

    // Cabecera Común
    const header = `${statusIcon} *${alertTitle}*\n\nHola *${clientName}*, espero que estés teniendo un excelente día. 🌟 Te envío la información de tu próximo recibo a liquidar:\n\n`

    // Cuerpo de Datos (Ficha Técnica)
    const bodyItems = [
        `👤 *Asegurado:* ${clientName}`,
        `🏢 *Aseguradora:* ${insurerName}`,
        `🛡️ *Ramo:* ${policyType}`,
        `📄 *Descripción:* ${subBranch || 'Cobertura Original'}`,
        `🔢 *Póliza:* *${policyNumber}*`
    ]

    if (totalInstallments && totalInstallments > 1) {
        bodyItems.push(`🧾 *Recibo:* ${currentInstallment || 1} de ${totalInstallments}`)
    }

    bodyItems.push(
        `📅 *Vencimiento:* *${formatDate(targetDate)}*`,
        `💳 *Método:* ${paymentMethod}`
    )

    bodyItems.push(`\n💰 *TOTAL A PAGAR: ${currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`)

    const body = bodyItems.join('\n')

    // Lógica de Semáforo / Días de Gracia
    let graceInfo = ''
    if (isAnual && !isDomiciliado) {
        const cancelDate = new Date(targetDate)
        cancelDate.setDate(cancelDate.getDate() + 30)
        graceInfo = `\n\n📌 *Días de Gracia:* 30 días naturales\n⏳ *Límite de gracia:* ${formatDate(cancelDate.toISOString())}`
    } else if (!isDomiciliado) {
        graceInfo = `\n\n⚠️ *Nota:* Los recibos fraccionados no cuentan con periodo de gracia institucional.`
    }

    const paymentInfo = paymentLink ? `\n\n🔗 *Pagar Ahora:* ${paymentLink}` : ''
    const finalSection = `\n\n${footerMessage}`

    return header + body + graceInfo + paymentInfo + finalSection
}

/**
 * Genera el copy de WhatsApp para Renovaciones (v24)
 */
export const getRenewalMessage = (
    clientName: string,
    policyType: string,
    insurerName: string,
    policyNumber: string,
    endDate: string,
    estimatedPremium?: number,
    currencySymbol: string = '$',
) => {
    return `🕒 *AVISO DE RENOVACIÓN* 🕒

Hola *${clientName}*, te saludo con gusto. 👋

Te informo que tu póliza está próxima a vencer y es momento de asegurar la continuidad de tu protección:

🏢 *Aseguradora:* ${insurerName}
🛡️ *Ramo:* ${policyType}
🔢 *Póliza:* *${policyNumber}*
📅 *Vence el:* *${formatDate(endDate)}*

${estimatedPremium ? `💰 *Prima estimada: ${currencySymbol}${estimatedPremium.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*\n` : ''}
¿Gustas que procedamos con la renovación automática o prefieres que revisemos otras opciones de costo/cobertura? 

Quedo atento para apoyarte y que sigas siempre protegido. 😊`
}

/**
 * Genera el copy de WhatsApp para Bienvenida y Entrega (v24)
 */
export const getWelcomeMessage = (
    clientName: string,
    policyNumber: string,
    insurerName: string,
    policyLink: string
) => {
    return `✨ *¡BIENVENIDO A TU PROTECCIÓN!* ✨

Hola *${clientName}*, es un gusto saludarte y entregarte tu nueva protección. 👋 📄

Te confirmo que tu póliza ya está lista y registrada:

🏢 *Aseguradora:* ${insurerName}
🔢 *Póliza:* *${policyNumber}*

📥 *Descarga tu Póliza aquí:* ${policyLink}

📌 *RECOMENDACIONES:*
1️⃣ Guarda este número para cualquier asistencia.
2️⃣ Revisa tus fechas de pago para mantener tu vigencia.
3️⃣ Ante cualquier siniestro, llámanos de inmediato. 📞

¡Gracias por tu confianza! Estamos para cuidarte. 😊`
}

/**
 * Genera el calendario de pagos para WhatsApp (v24)
 */
export const getPaymentCalendarMessage = (
    clientName: string,
    policyNumber: string,
    installments: any[],
    currencySymbol: string = '$'
) => {
    const table = installments.map(inst =>
        `🔹 *Recibo ${inst.installment_number}:* ${formatDate(inst.due_date)} - *${currencySymbol}${parseNum(inst.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`
    ).join('\n')

    return `📅 *CALENDARIO DE PAGOS* 📅

Hola *${clientName}*, te comparto el cronograma de pagos de tu póliza *${policyNumber}* para que lo tengas siempre a la mano:

${table}

⚠️ *Nota:* Favor de realizar sus pagos antes de la fecha límite para evitar recargos o cancelación de cobertura. 🚫

¿Gustas que te apoyemos con alguna línea de captura? 😊`
}

/**
 * Genera tips de seguridad para WhatsApp (v24)
 */
export const getSecurityTipsMessage = (clientName: string) => {
    return `🛡️ *TIPS PARA TU SEGURIDAD* 🛡️

Hola *${clientName}*, queremos que siempre estés protegido. Aquí unos consejos clave:

🚗 *Auto:* Revisa presión de llantas y niveles antes de salir.
🏠 *Hogar:* No compartas en redes sociales cuando salgas de vacaciones.
📄 *Póliza:* Ten siempre a la mano tu número de póliza y teléfonos de asistencia.

¡Tu tranquilidad es nuestra prioridad! ✨`
}

const parseNum = (val: any) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    return parseFloat(String(val).replace(/,/g, '')) || 0
}
