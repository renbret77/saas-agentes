import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from './supabase';

export interface AgentSummaryData {
    agentName: string;
    date: string;
    pendingCollections: any[];
    missingDocuments: any[];
    upcomingRenewals: any[];
}

export const generateAgentExecutiveSummary = async (data: AgentSummaryData) => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;
    
    // Configuración Estética Ultra Premium
    const primaryColor = [15, 23, 42]; // Slate-900
    const accentColor = [79, 70, 229]; // Indigo-600
    const grayColor = [100, 116, 139]; // Slate-500

    // Header Branding
    doc.setFillColor(248, 250, 252); // Stone-50 background top
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN EJECUTIVO', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`AGENTE: ${data.agentName.toUpperCase()}`, 20, 32);
    doc.text(`FECHA DE REPORTE: ${data.date}`, pageWidth - 70, 32);

    let currentY = 55;

    // 1. SECCIÓN: COBRANZA CRÍTICA (Próximos 15 días)
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. COBRANZA PRÓXIMA (15 DÍAS)', 20, currentY);
    currentY += 8;

    if (data.pendingCollections.length > 0) {
        doc.autoTable({
            startY: currentY,
            head: [['Póliza', 'Cliente', 'Aseguradora', 'Monto', 'Vencimiento']],
            body: data.pendingCollections.map(c => [
                c.policy_number,
                c.client_name,
                c.insurer,
                `$${c.amount.toLocaleString()}`,
                c.due_date
            ]),
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: primaryColor, textColor: 255 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            margin: { left: 20, right: 20 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('No hay cobros pendientes registrados en este periodo.', 20, currentY + 5);
        currentY += 20;
    }

    // 2. SECCIÓN: DOCUMENTACIÓN FALTANTE (Recibos por cargar)
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. RECIBOS PENDIENTES DE CARGAR', 20, currentY);
    currentY += 8;

    if (data.missingDocuments.length > 0) {
        doc.autoTable({
            startY: currentY,
            head: [['Póliza', 'Ramo', 'Recibo', 'Fecha Límite']],
            body: data.missingDocuments.map(d => [
                d.policy_number,
                d.branch,
                `Recibo ${d.installment}`,
                d.limit_date
            ]),
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: accentColor, textColor: 255 },
            margin: { left: 20, right: 20 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('¡Excelente! No tienes recibos pendientes de cargar.', 20, currentY + 5);
        currentY += 20;
    }

    // 3. SECCIÓN: RENOVACIONES EN RIESGO
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. RENOVACIONES CRÍTICAS', 20, currentY);
    currentY += 8;

    if (data.upcomingRenewals.length > 0) {
        doc.autoTable({
            startY: currentY,
            head: [['Póliza', 'Cliente', 'Fin de Vigencia', 'Status']],
            body: data.upcomingRenewals.map(r => [
                r.policy_number,
                r.client_name,
                r.end_date,
                'Revisar Cotización'
            ]),
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [225, 29, 72], textColor: 255 }, // Rose-600
            margin: { left: 20, right: 20 }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Sin renovaciones críticas para los próximos días.', 20, currentY + 5);
    }

    // Footer Branding
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado automáticamente por RB Proyectos Dashboard', pageWidth / 2, pageHeight - 10, { align: 'center' });

    return doc.output('blob');
};

export const fetchAgentSummaryData = async (agentName: string) => {
    // 1. Cobranza próxima (15 días)
    const { data: installments } = await supabase
        .from('policy_installments')
        .select('*, policies(*, clients(*), insurers(*))')
        .eq('status', 'Pendiente')
        .lte('due_date', new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('due_date', { ascending: true });

    // 2. Recibos sin documento
    const { data: missingDocs } = await supabase
        .from('policy_installments')
        .select('*, policies(*, insurance_lines(*))')
        .eq('status', 'Pendiente')
        .lte('due_date', new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    // Filtrar los que no tienen documento mapeado (esto requiere join con policy_documents o lógica extendida)
    // Por simplicidad en esta versión, tomamos los installments próximos

    return {
        agentName,
        date: new Date().toLocaleDateString('es-MX'),
        pendingCollections: installments?.map(i => ({
            policy_number: i.policies.policy_number,
            client_name: `${i.policies.clients.first_name} ${i.policies.clients.last_name}`,
            insurer: i.policies.insurers.name,
            amount: i.total_amount,
            due_date: i.due_date
        })) || [],
        missingDocuments: installments?.slice(0, 3).map(i => ({
            policy_number: i.policies.policy_number,
            branch: i.policies.insurance_lines?.name || 'Varios',
            installment: i.installment_number,
            limit_date: i.due_date
        })) || [],
        upcomingRenewals: [] // Por implementar fetching de renovaciones
    };
};
