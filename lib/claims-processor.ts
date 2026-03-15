
export interface ClaimDocument {
    name: string;
    category: string;
    required: boolean;
    description: string;
}

export interface ClaimAnalysisResult {
    score: number;
    status: 'healthy' | 'incomplete' | 'critical';
    missing: string[];
    suggestions: string[];
}

const DOCUMENT_REQUIREMENTS: Record<string, ClaimDocument[]> = {
    'Gastos Médicos Mayores': [
        { name: 'Informe Médico', category: 'Medical', required: true, description: 'Debe incluir diagnóstico y fecha de primer síntoma.' },
        { name: 'Aviso de Accidente', category: 'Administrative', required: true, description: 'Formato oficial de la aseguradora firmado.' },
        { name: 'Identificación Oficial', category: 'Identity', required: true, description: 'INE o Pasaporte vigente (legible).' },
        { name: 'Interpretación de Estudios', category: 'Medical', required: true, description: 'Resultados de laboratorio o imagenología.' },
        { name: 'Estado de Cuenta', category: 'Financial', required: true, description: 'Para depósito de reembolso (CLABE).' }
    ],
    'Autos': [
        { name: 'Licencia de Conducir', category: 'Legal', required: true, description: 'Vigente al momento del siniestro.' },
        { name: 'Tarjeta de Circulación', category: 'Legal', required: true, description: 'Documento del vehículo.' },
        { name: 'Declaración de Accidente', category: 'Legal', required: true, description: 'Relato de los hechos firmado.' },
        { name: 'Fotos del Siniestro', category: 'Evidence', required: false, description: '4 ángulos del vehículo y entorno.' }
    ]
};

export function analyzeClaimGap(claimType: string, uploadedDocs: any[]): ClaimAnalysisResult {
    const requirements = DOCUMENT_REQUIREMENTS[claimType] || DOCUMENT_REQUIREMENTS['Autos'];
    const uploadedNames = uploadedDocs.map(d => d.name.toLowerCase());
    
    const missing: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    
    requirements.forEach(req => {
        const found = uploadedNames.some(u => u.includes(req.name.toLowerCase()));
        if (found) {
            score += (100 / requirements.length);
        } else if (req.required) {
            missing.push(`${req.name} (${req.description})`);
        }
    });

    if (missing.length === 0) {
        suggestions.push("Expediente completo. Recomendamos enviar a dictamen inmediato.");
    } else {
        suggestions.push(`Faltan ${missing.length} documentos críticos para evitar el rechazo inicial.`);
    }

    return {
        score: Math.round(score),
        status: score > 80 ? 'healthy' : score > 40 ? 'incomplete' : 'critical',
        missing,
        suggestions
    };
}
