import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Extender tipos para jspdf-autotable
declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

interface PaymentInstallment {
    installment_number: number
    due_date: string
    total_amount: number
    status: string
}

export const generatePaymentSchedulePDF = (
    clientName: string,
    policyNumber: string,
    insurerName: string,
    installments: PaymentInstallment[],
    currency: string = 'MXN'
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
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-MX')}`, 20, 83)

    // Installments Table
    const tableRows = installments.map(inst => [
        inst.installment_number.toString(),
        new Date(inst.due_date).toLocaleDateString('es-MX'),
        `${currency === 'USD' ? 'USD$' : '$'}${Number(inst.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        inst.status === 'Pagado' ? 'PAGADO' : 'PENDIENTE'
    ])

    doc.autoTable({
        startY: 95,
        head: [['Recibo', 'Fecha Vencimiento', 'Monto', 'Estado']],
        body: tableRows,
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 }
    })

    // Footer Note
    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text("Nota Importante:", 20, finalY)
    doc.setFontSize(8)
    const splitText = doc.splitTextToSize(
        "Para mantener la vigencia de su protección, le sugerimos realizar sus pagos al menos 3 días antes de la fecha límite mostrada en este documento. Los pagos pueden tardar hasta 48 horas en verse reflejados en los sistemas de la aseguradora.",
        170
    )
    doc.text(splitText, 20, finalY + 5)

    // Save
    return doc.output('blob')
}

export const generateRecommendationsPDF = (
    clientName: string,
    branchName: string
) => {
    const doc = new jsPDF()
    const primaryColor = [5, 150, 105] // Emerald-600

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("GUÍA DE SEGURIDAD PREMIUM", 20, 20)
    doc.setFontSize(10)
    doc.text("SU TRANQUILIDAD ES NUESTRA PRIORIDAD", 20, 28)

    // Content
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(14)
    doc.text(`Recomendaciones para su Seguro de ${branchName}`, 20, 60)
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    const tips = [
        "1. Mantenga su póliza digital siempre a la mano en su celular.",
        "2. En caso de siniestro, repórtelo de inmediato a los números de asistencia.",
        "3. No realice arreglos con terceros sin la presencia del ajustador.",
        "4. Verifique periódicamente que sus datos de contacto estén actualizados.",
        "5. Revise las coberturas contratadas antes de realizar viajes largos."
    ]
    
    let currentY = 75
    tips.forEach(tip => {
        doc.text(tip, 20, currentY)
        currentY += 10
    })

    return doc.output('blob')
}
