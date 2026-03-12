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
    let cleanPhone = phone.replace(/\D/g, '')
    
    // v28: Normalización para México (Si son 10 dígitos, agregar 52)
    if (cleanPhone.length === 10) {
        cleanPhone = '52' + cleanPhone
    }
    
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
 * Genera el copy de WhatsApp para Bienvenida y Entrega Premium (v27 - Unicode Emojis)
 */
export const getWelcomeMessage = (
    clientName: string,
    policyNumber: string,
    insurerName: string,
    policyType: string,
    paymentMethod: string,
    startDate: string,
    endDate: string,
    premiumTotal: number,
    firstInstallment: number,
    subsequentInstallment: number,
    limitDateFirst: string,
    policyLink: string,
    currencySymbol: string = '$',
    coverage: string = 'Amplia / Según Carátula'
) => {
    // Definimos emojis usando Unicode para evitar problemas de encoding en el navegador
    const star = '\u2B50'
    const diamond = '\uD83D\uDC8E'
    const building = '\uD83C\uDFE2'
    const shield = '\uD83D\uDEE1\uFE0F'
    const pin = '\uD83D\uDCCD'
    const card = '\uD83D\uDCB3'
    const calendar = '\uD83D\uDCC5'
    const dollar = '\uD83D\uDCB5'
    const receipt = '\uD83E\uDDFE'
    const sync = '\uD83D\uDD04'
    const check = '\u2705'
    const hourglass = '\u23F3'
    const memo = '\uD83D\uDCC4'
    const smile = '\uD83D\uDE0A'

    return [
        `${star} *¡BIENVENIDO A TU PROTECCIÓN PREMIUM!* ${star}`,
        '',
        `Hola *${clientName}*, ¡gracias por tu preferencia! Es un gusto saludarte y confirmarte el alta exitosa de tu protección.`,
        '',
        `${diamond} *DETALLES DE TU PÓLIZA*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `${building} *Aseguradora:* ${insurerName}`,
        `🔢 *Póliza:* *${policyNumber}*`,
        `${shield} *Ramo:* ${policyType}`,
        `${pin} *Cobertura:* ${coverage}`,
        `${card} *Forma de Pago:* ${paymentMethod}`,
        `${calendar} *Vigencia:* del *${formatDate(startDate)}* al *${formatDate(endDate)}*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        '',
        `💰 *PRIMAS Y RECIBOS*`,
        `${dollar} *Prima Total:* *${currencySymbol}${premiumTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`,
        `${receipt} *1er Recibo:* ${currencySymbol}${firstInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        subsequentInstallment > 0 ? `${sync} *Subsecuentes:* ${currencySymbol}${subsequentInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : `${check} *Pago Único / Contado*`,
        `${hourglass} *Límite 1er Pago:* *${formatDate(limitDateFirst)}*`,
        '',
        `${memo} *TU DOCUMENTACIÓN DIGITAL*`,
        `Puedes descargar tu póliza completa aquí:`,
        policyLink,
        '',
        `Cualquier duda que tengas, no dudes en hacérmelo saber por este medio. ¡Que tengas un excelente día! ${smile}`,
        '',
        `*PORTAL DE PROTECCIÓN PREMIUM*`
    ].join('\n')
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
