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
 * Genera el copy de WhatsApp basado en las reglas de negocio (v26 - Formato Premium Contextual)
 */
export const getCollectionMessage = (
    clientName: string,
    policyType: string,
    insurerName: string,
    policyNumber: string,
    amount: number,
    paymentMethod: PaymentMethod,
    targetDate: string,
    installmentNumber: number = 1,
    totalInstallments: number = 1,
    graceDays: number = 0,
    subBranch?: string,
    currencySymbol: string = '$'
) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dueDate = new Date(targetDate)
    dueDate.setHours(0, 0, 0, 0)

    const limitDate = new Date(dueDate)
    limitDate.setDate(limitDate.getDate() + graceDays)

    const diffTime = dueDate.getTime() - today.getTime()
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const isGracePeriod = today > dueDate && today <= limitDate
    const isOverdue = today > limitDate
    const isImminent = daysUntilDue >= 0 && daysUntilDue <= 3

    // Configuración de Estética Premium según Contexto
    let statusHeader = '💎 *PORTAL DE PROTECCIÓN PREMIUM*'
    let mainAction = 'RECORDATORIO DE PAGO'
    let alertIcon = '✨'
    let contextMessage = `Hola *${clientName}*, nos ponemos en contacto contigo para saludarte y recordarte que tu protección requiere atención. 🤝`
    let urgencyNote = ''

    if (isOverdue) {
        alertIcon = '🚨'
        mainAction = 'PÓLIZA EN RIESGO DE CANCELACIÓN'
        contextMessage = `*¡ATENCIÓN URGENTE!* *${clientName}*, el periodo de gracia para tu recibo ha expirado.`
        urgencyNote = `\n\n⚠️ *ESTADO:* EXCEDIDO\n❌ La compañía podría rechazar cualquier siniestro a partir de este momento.`
    } else if (isGracePeriod) {
        alertIcon = '🕒'
        mainAction = 'EN PERIODO DE GRACIA'
        contextMessage = `Hola *${clientName}*, tu recibo venció el *${formatDate(targetDate)}*, pero aún te encuentras dentro del *Periodo de Gracia* institucional. 🛡️`
        urgencyNote = `\n\n📌 *Días de Gracia:* ${graceDays} días naturales.\n⏳ *Fecha Límite:* *${formatDate(limitDate.toISOString())}*`
    } else if (isImminent) {
        alertIcon = '🔔'
        mainAction = 'PRÓXIMO VENCIMIENTO'
        contextMessage = `Hola *${clientName}*, te escribimos para recordarte que tu pago está próximo a vencer. ¡Mantén tu tranquilidad siempre activa! 🚀`
    }

    const message = [
        `${alertIcon} *${mainAction}* ${alertIcon}`,
        '',
        contextMessage,
        '',
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Cliente:* ${clientName}`,
        `🏢 *Aseguradora:* ${insurerName}`,
        `🛡️ *Plan:* ${policyType}${subBranch ? ` (${subBranch})` : ''}`,
        `🔢 *Póliza:* *${policyNumber}*`,
        `🧾 *Recibo:* ${installmentNumber} de ${totalInstallments}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        '',
        `📅 *Vence el:* *${formatDate(targetDate)}*`,
        `💰 *MONTO A PAGAR: ${currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`,
        urgencyNote,
        '',
        `¿Deseas que te enviemos la línea de captura o el link de pago express? 😊`,
        '',
        `*${statusHeader}*`
    ].join('\n')

    return message
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
