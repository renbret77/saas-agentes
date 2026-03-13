import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface PaymentInstallment {
    installment_number: number
    due_date: string
    total_amount: number
    status: string
}

export const generatePolicyCalendarPDF = (
    clientName: string,
    policyNumber: string,
    insurerName: string,
    installments: PaymentInstallment[],
    currency: string = 'MXN',
    policyEndDate?: string // v34+: Para calcular el último periodo
) => {
    const doc = new jsPDF()
    const primaryColor = [15, 23, 42] // Slate-900

    // Header Branding
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("RENE BRETON SEGUROS", 20, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("PORTAL DE PROTECCIÓN PREMIUM", 20, 28)

    // Policy Info Box
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CRONOGRAMA DE PAGOS", 20, 55)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Cliente: ${clientName}`, 20, 65)
    doc.text(`Póliza: ${policyNumber}`, 20, 71)
    doc.text(`Aseguradora: ${insurerName}`, 20, 77)

    // Installments Table
    const tableRows = installments.map((inst, index) => {
        const startDate = new Date(inst.due_date)
        
        // Calcular Límite de Pago (30 días de gracia)
        const limitDate = new Date(startDate)
        limitDate.setDate(limitDate.getDate() + 30)

        // Calcular Periodo (Hasta el siguiente recibo o fin de póliza)
        let periodEnd = ""
        if (index < installments.length - 1) {
            periodEnd = new Date(installments[index + 1].due_date).toLocaleDateString('es-MX')
        } else if (policyEndDate) {
            periodEnd = new Date(policyEndDate).toLocaleDateString('es-MX')
        }

        const periodText = `Del ${startDate.toLocaleDateString('es-MX')} al ${periodEnd}`

        return [
            inst.installment_number.toString(),
            periodText,
            `${currency === 'USD' ? 'USD$' : '$'}${Number(inst.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            limitDate.toLocaleDateString('es-MX'),
            inst.status === 'Pagado' ? 'PAGADO' : 'PENDIENTE'
        ]
    })

    autoTable(doc, {
        startY: 85,
        head: [['Recibo', 'Periodo de Cobertura', 'Monto Total', 'Límite de Pago', 'Estado']],
        body: tableRows,
        styles: { font: 'helvetica', fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 65 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 },
            4: { cellWidth: 30 }
        }
    })

    // Footer Note
    const finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text("Información sobre el Periodo de Gracia:", 20, finalY)
    doc.setFontSize(8)
    const splitText = doc.splitTextToSize(
        "IMPORTANTE: Durante el periodo de gracia su póliza permanece vigente y cuenta con cobertura. Sin embargo, en caso de siniestro dentro de estos días, la aseguradora podría solicitar el pago inmediato del recibo pendiente para otorgar la atención, o bien, el trámite podría realizarse inicialmente vía reembolso. Le recomendamos mantenerse al corriente para evitar estos procesos adicionales.",
        170
    )
    doc.text(splitText, 20, finalY + 5)

    // Save
    return doc.output('blob')
}

export const generateInsuranceTipsPDF = async (
    clientName: string,
    branchName: string,
    recommendations: string[] = []
) => {
    const doc = new jsPDF()
    const primaryColor = [15, 23, 42] // Slate-900 
    const accentColor = [10, 150, 105] // Emerald
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 210, 45, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("RENE BRETON SEGUROS", 20, 20)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("GUÍA DE SEGURIDAD Y CONSEJOS PROFESIONALES", 20, 28)
    doc.setFontSize(8)
    doc.text("TU PATRIMONIO, EXPLICADO PASO A PASO", 20, 36)

    // Body
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(`MANUAL DE RECOMENDACIONES: ${branchName.toUpperCase()}`, 20, 60)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Estimado(a) ${clientName},`, 20, 70)
    doc.text(`Como su agente, mi prioridad es que conozca los "detalles finos" de su contrato para evitar sorpresas.`, 20, 76)

    const defaultTips = [
        "1. Mantenga su póliza digital siempre a la mano en su celular.",
        "2. En caso de siniestro, NO admita responsabilidad. Espere a su ajustador.",
        "3. Verifique que el USO (Particular, App, Carga) coincida con su actividad real.",
        "4. Cualquier adaptación o equipo especial debe estar declarado en la carátula.",
        "5. Conducir con licencia vencida o bajo el influjo de alcohol puede anular su cobertura."
    ]
    
    const finalTips = recommendations.length > 0 ? recommendations : defaultTips
    
    let currentY = 90
    finalTips.forEach((tip, idx) => {
        // Draw bullet point
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2])
        doc.circle(23, currentY - 1, 1, 'F')
        
        doc.setTextColor(30, 41, 59)
        const splitText = doc.splitTextToSize(tip, 160)
        doc.text(splitText, 30, currentY)
        currentY += (splitText.length * 6) + 4
        
        // New page if needed
        if (currentY > 270) {
            doc.addPage()
            currentY = 20
        }
    })

    // Footer
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(8)
    doc.text("Este documento es una guía informativa y no sustituye las condiciones generales de su póliza.", 20, 285)

    return doc.output('blob')
}

export const generateInsurerManualPDF = async (
    clientName: string,
    policyNumber: string,
    insurerName: string,
    insurerConfig: any
) => {
    const paymentMethods = insurerConfig.paymentMethods || []
    const recommendations = insurerConfig.recommendations || []
    const logoUrl = insurerConfig.logoUrl
    const doc = new jsPDF()
    const primaryColor = [15, 23, 42] // Slate-900
    const accentColor = [16, 185, 129] // Emerald-500
    let currentY = 45

    // Header Branding
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 210, 45, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("RENE BRETON SEGUROS", 20, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("GUÍA DE PAGO Y ATENCIÓN PREMIUM", 20, 28)

    // Footer contact
    doc.setFontSize(8)
    doc.text("Soporte: 24/7 vía WhatsApp", 20, 36)

    // v35: Add Insurer Logo if available
    if (logoUrl) {
        try {
            // En un entorno de navegador, podemos usar addImage con URL directamente 
            // o cargarla primero. jspdf soporta URLs en algunos entornos, pero 
            // lo más seguro es dejar el espacio o intentar cargarla.
            doc.addImage(logoUrl, 'PNG', 160, 10, 30, 0) 
        } catch (e) {
            console.error("Could not load insurer logo", e)
        }
    }

    // Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(`INSTRUCCIONES DE PAGO: ${insurerName.toUpperCase()}`, 20, 60)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Estimado(a) ${clientName},`, 20, 70)
    doc.text(`A continuación encontrará los canales oficiales para realizar el pago de su póliza ${policyNumber} de forma segura.`, 20, 76)

    // v35: Tips Section (Important for Quálitas)
    if (recommendations.length > 0) {
        doc.setFillColor(241, 245, 249) // Slate-100
        doc.roundedRect(20, 85, 170, (recommendations.length * 6) + 10, 3, 3, 'F')
        
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text("NOTAS IMPORTANTES SOBRE TU PÓLIZA:", 25, 92)
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        recommendations.forEach((rec: string, i: number) => {
            doc.text(`• ${rec}`, 25, 98 + (i * 5))
        })
        
        currentY = 98 + (recommendations.length * 5) + 15
    } else {
        currentY = 90
    }

    paymentMethods.forEach((method: any, idx: number) => {
        // Draw icon-like circle
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2])
        doc.setLineWidth(0.5)
        doc.circle(25, currentY + 3, 4, 'S')
        
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.text(method.label, 35, currentY + 4)
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.setTextColor(71, 85, 105) // Slate-600
        const splitInstructions = doc.splitTextToSize(method.instructions, 150)
        doc.text(splitInstructions, 35, currentY + 10)
        
        if (method.url && method.url.startsWith('http')) {
            doc.setTextColor( accentColor[0], accentColor[1], accentColor[2] )
            doc.setFontSize(9)
            doc.text(`Link: ${method.url}`, 35, currentY + 18)
            currentY += 10
        }

        currentY += 25
    })

    // Additional Help
    if (currentY < 250) {
        doc.setFillColor(248, 250, 252)
        doc.rect(20, currentY, 170, 30, 'F')
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.setFont("helvetica", "bold")
        doc.text("¿Necesita ayuda?", 30, currentY + 10)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text("En Rene Breton Seguros estamos para servirle. Si tiene problemas con su pago,", 30, currentY + 18)
        doc.text("contáctenos de inmediato por WhatsApp para apoyarle con su línea de captura.", 30, currentY + 23)
    }

    return doc.output('blob')
}
