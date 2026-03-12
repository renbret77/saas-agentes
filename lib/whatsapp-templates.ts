export type PaymentMethod = 'Contado' | 'Semestral' | 'Trimestral' | 'Mensual' | 'Anual' | 'Domiciliado'

// Definimos emojis usando String.fromCodePoint para garantizar compatibilidad universal de encoding
const eStar = String.fromCodePoint(0x2B50)
const eDiamond = String.fromCodePoint(0x1F48E)
const eBuilding = String.fromCodePoint(0x1F3E2)
const eShield = String.fromCodePoint(0x1F6E1, 0xFE0F)
const ePin = String.fromCodePoint(0x1F4CD)
const eCard = String.fromCodePoint(0x1F4B3)
const eCalendar = String.fromCodePoint(0x1F4C5)
const eDollar = String.fromCodePoint(0x1F4B5)
const eReceipt = String.fromCodePoint(0x1F9FE)
const eSync = String.fromCodePoint(0x1F504)
const eCheck = String.fromCodePoint(0x2705)
const eHourglass = String.fromCodePoint(0x23F3)
const eMemo = String.fromCodePoint(0x1F4DC)
const eSmile = String.fromCodePoint(0x1F60A)
const eWave = String.fromCodePoint(0x1F44B)
const eClock = String.fromCodePoint(0x1F552)
const eAlert = String.fromCodePoint(0x1F6A8)
const eZap = String.fromCodePoint(0x26A1)
const eRobot = String.fromCodePoint(0x1F916)
const eBell = String.fromCodePoint(0x1F514)
const eRocket = String.fromCodePoint(0x1F680)
const eSpark = String.fromCodePoint(0x2728)
const eHandshake = String.fromCodePoint(0x1F91D)
const ePushpin = String.fromCodePoint(0x1F4CC)
const eNoEntry = String.fromCodePoint(0x1F6AB)

// Helper para formatear fechas (v16 - Formato numérico ordenado)
const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${day}-${month}-${year}`
}

// Helper para generar el link de WhatsApp
export const generateWhatsAppLink = (phone: any, text: string) => {
    // Asegurar que phone no sea un string "undefined" literal
    const phoneStr = String(phone || '').trim()
    
    // Limpiar el teléfono para que solo tenga números
    let cleanPhone = phoneStr.replace(/\D/g, '')
    
    // Si no hay número válido o es el string literal "undefined"
    if (!cleanPhone || phoneStr === 'undefined') {
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    }
    
    // v28: Normalización para México (Si son 10 dígitos, agregar 52)
    if (cleanPhone.length === 10) {
        cleanPhone = '52' + cleanPhone
    }
    
    const encodedText = encodeURIComponent(text)
    // api.whatsapp.com/send es más robusto que wa.me para ciertos navegadores
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
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
    let statusHeader = `${eDiamond} *PORTAL DE PROTECCIÓN PREMIUM*`
    let mainAction = 'RECORDATORIO DE PAGO'
    let alertIcon = eSpark
    let contextMessage = `Hola *${clientName}*, nos ponemos en contacto contigo para saludarte y recordarte que tu protección requiere atención. ${eHandshake}`
    let urgencyNote = ''

    if (isOverdue) {
        alertIcon = eAlert
        mainAction = 'PÓLIZA EN RIESGO DE CANCELACIÓN'
        contextMessage = `*¡ATENCIÓN URGENTE!* *${clientName}*, el periodo de gracia para tu recibo ha expirado.`
        urgencyNote = `\n\n${eAlert} *ESTADO:* EXCEDIDO\n${eNoEntry} La compañía podría rechazar cualquier siniestro a partir de este momento.`
    } else if (isGracePeriod) {
        alertIcon = eClock
        mainAction = 'EN PERIODO DE GRACIA'
        contextMessage = `Hola *${clientName}*, tu recibo venció el *${formatDate(targetDate)}*, pero aún te encuentras dentro del *Periodo de Gracia* institucional. ${eShield}`
        urgencyNote = `\n\n${ePushpin} *Días de Gracia:* ${graceDays} días naturales.\n${eHourglass} *Fecha Límite:* *${formatDate(limitDate.toISOString())}*`
    } else if (isImminent) {
        alertIcon = eBell
        mainAction = 'PRÓXIMO VENCIMIENTO'
        contextMessage = `Hola *${clientName}*, te escribimos para recordarte que tu pago está próximo a vencer. ¡Mantén tu tranquilidad siempre activa! ${eRocket}`
    }

    const message = [
        `${alertIcon} *${mainAction}* ${alertIcon}`,
        '',
        contextMessage,
        '',
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Cliente:* ${clientName}`,
        `${eBuilding} *Aseguradora:* ${insurerName}`,
        `${eShield} *Plan:* ${policyType}${subBranch ? ` (${subBranch})` : ''}`,
        `🔢 *Póliza:* *${policyNumber}*`,
        `${eReceipt} *Recibo:* ${installmentNumber} de ${totalInstallments}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        '',
        `${eCalendar} *Vencimiento:* *${formatDate(targetDate)}*`,
        `${eDollar} *MONTO A PAGAR: ${currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`,
        urgencyNote,
        '',
        `¿Deseas que te enviemos la línea de captura o el link de pago express? ${eSmile}`,
        '',
        `*${statusHeader}*`
    ].join('\n')

    return message
}

/**
 * Genera el copy de WhatsApp para Recordatorios de Pre-Renovación (v30)
 * Orientado a avisar que la póliza VENCE PRONTO.
 */
export const getPreRenewalMessage = (
    clientName: string,
    policyType: string,
    insurerName: string,
    policyNumber: string,
    endDate: string,
    estimatedPremium?: number,
    currencySymbol: string = '$',
) => {
    return `${eClock} *RECORDATORIO DE RENOVACIÓN* ${eClock}
 
Hola *${clientName}*, te saludo con gusto. ${eWave}
 
Te informo que tu póliza está próxima a vencer y es el momento ideal para revisar las condiciones de tu renovación:
 
${eBuilding} *Aseguradora:* ${insurerName}
${eShield} *Ramo:* ${policyType}
🔢 *Póliza:* *${policyNumber}*
${eCalendar} *Vencimiento Actual:* *${formatDate(endDate)}*
 
¿Gustas que revisemos la propuesta para este nuevo periodo? Quedo a tus órdenes ante cualquier duda o comentario para que sigas siempre protegido. ${eSmile}`
}

/**
 * Genera el copy de WhatsApp para Pólizas YA RENOVADAS (v30)
 * Orientado a entregar la nueva póliza confirmando que ya se renovó.
 */
export const getRenewedMessage = (
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
    return [
        `${eSync} *¡TU RENOVACIÓN HA SIDO EXITOSA!* ${eSync}`,
        '',
        `Hola *${clientName}*, ¡un gusto saludarte! Te confirmo que tu protección ha sido renovada con éxito por un nuevo periodo.`,
        '',
        `${eDiamond} *DETALLES DE TU NUEVA PÓLIZA*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `${eBuilding} *Aseguradora:* ${insurerName}`,
        `🔢 *Póliza:* *${policyNumber}*`,
        `${eShield} *Ramo:* ${policyType}`,
        `${ePin} *Cobertura:* ${coverage}`,
        `${eCard} *Forma de Pago:* ${paymentMethod}`,
        `${eCalendar} *Vigencia:* del *${formatDate(startDate)}* al *${formatDate(endDate)}*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        '',
        `${eDollar} *PRIMAS Y RECIBOS*`,
        `${eDollar} *Prima Total:* *${currencySymbol}${premiumTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`,
        `${eReceipt} *1er Recibo:* ${currencySymbol}${firstInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        subsequentInstallment > 0 ? `${eSync} *Subsecuentes:* ${currencySymbol}${subsequentInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : `${eCheck} *Pago Único / Contado*`,
        `${eHourglass} *Límite 1er Pago:* *${formatDate(limitDateFirst)}*`,
        '',
        `${eMemo} *TU DOCUMENTACIÓN DIGITAL*`,
        `Puedes visualizar tu nueva carátula directamente aquí:`,
        policyLink,
        '',
        `Gracias por seguir confiando en nosotros. ¡Quedo a tus órdenes! ${eSmile}`,
        '',
        `*PORTAL DE PROTECCIÓN PREMIUM*`
    ].join('\n')
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
    return [
        `${eStar} *¡BIENVENIDO A TU PROTECCIÓN PREMIUM!* ${eStar}`,
        '',
        `Hola *${clientName}*, ¡gracias por tu preferencia! Es un gusto saludarte y confirmarte el alta exitosa de tu protección.`,
        '',
        `${eDiamond} *DETALLES DE TU PÓLIZA*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `${eBuilding} *Aseguradora:* ${insurerName}`,
        `🔢 *Póliza:* *${policyNumber}*`,
        `${eShield} *Ramo:* ${policyType}`,
        `${ePin} *Cobertura:* ${coverage}`,
        `${eCard} *Forma de Pago:* ${paymentMethod}`,
        `${eCalendar} *Vigencia:* del *${formatDate(startDate)}* al *${formatDate(endDate)}*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        '',
        `${eDollar} *PRIMAS Y RECIBOS*`,
        `${eDollar} *Prima Total:* *${currencySymbol}${premiumTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*`,
        `${eReceipt} *1er Recibo:* ${currencySymbol}${firstInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        subsequentInstallment > 0 ? `${eSync} *Subsecuentes:* ${currencySymbol}${subsequentInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : `${eCheck} *Pago Único / Contado*`,
        `${eHourglass} *Límite 1er Pago:* *${formatDate(limitDateFirst)}*`,
        '',
        `${eMemo} *TU DOCUMENTACIÓN DIGITAL*`,
        `Puedes descargar tu póliza completa aquí:`,
        policyLink,
        '',
        `Cualquier duda que tengas, no dudes en hacérmelo saber por este medio. ¡Que tengas un excelente día! ${eSmile}`,
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

    return `${eCalendar} *CALENDARIO DE PAGOS* ${eCalendar}
 
Hola *${clientName}*, te comparto el cronograma de pagos de tu póliza *${policyNumber}* para que lo tengas siempre a la mano:
 
${table}
 
${eAlert} *Nota:* Favor de realizar sus pagos antes de la fecha límite para evitar recargos o cancelación de cobertura. ${eNoEntry}
 
¿Gustas que te apoyemos con alguna línea de captura? ${eSmile}`
}

/**
 * Genera tips de seguridad para WhatsApp (v24)
 */
export const getSecurityTipsMessage = (clientName: string) => {
    return `${eShield} *TIPS PARA TU SEGURIDAD* ${eShield}
 
Hola *${clientName}*, queremos que siempre estés protegido. Aquí unos consejos clave:
 
${eRocket} *Auto:* Revisa presión de llantas y niveles antes de salir.
${eBuilding} *Hogar:* No compartas en redes sociales cuando salgas de vacaciones.
${eMemo} *Póliza:* Ten siempre a la mano tu número de póliza y teléfonos de asistencia.
 
¡Tu tranquilidad es nuestra prioridad! ${eSpark}`
}

const parseNum = (val: any) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    return parseFloat(String(val).replace(/,/g, '')) || 0
}

/**
 * Genera un mensaje corto y directo exclusivamente con el link de la póliza (v31)
 */
export const getDirectLinkMessage = (clientName: string, policyLink: string) => {
    return [
        `*${clientName}*, ¡pica este link! ${String.fromCodePoint(0x1F449)}`,
        '',
        `${eShield} Aquí se encuentra tu carátula digital:`,
        policyLink,
        '',
        `Guárdala bien para cualquier emergencia. ${eSmile}`
    ].join('\n')
}

