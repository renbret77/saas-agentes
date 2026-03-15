
export const INSURANCE_KNOWLEDGE = {
    MEXICAN_INSURERS: {
        GNP: {
            typical_coverages: ["Daños Materiales", "Robo Total", "Responsabilidad Civil", "Gastos Médicos Ocupantes", "Asistencia en Viaje", "Defensa Legal"],
            keywords: ["Grupo Nacional Provincial", "Línea Azul", "Paquete Amplio"]
        },
        AXA: {
            typical_coverages: ["Daños Materiales", "Robo Total", "RC Personas", "RC Bienes", "Gastos Médicos", "Auxilio Vial"],
            keywords: ["AXA Seguros", "Protección Estándar", "Plus"]
        },
        QUALITAS: {
            typical_coverages: ["Daños Materiales", "Robo Total", "Responsabilidad Civil por Daños a Terceros", "Gastos Legales", "Asistencia Vial Quálitas"],
            keywords: ["Quálitas Compañía de Seguros", "Servicio Público", "Paquete Amplia"]
        },
        MAPFRE: {
            typical_coverages: ["Daños Materiales", "Robo Total", "Responsabilidad Civil Lucas", "Gastos Médicos", "Defensa Jurídica"],
            keywords: ["Mapfre México", "Tepeyac", "Paquete Premium"]
        }
    }
};

// --- PROMPT MAESTRO OMNI 3.0 (ULTRA PRECISION OMNI ELITE EDITION) ---
export const PROMPT_QUOTE_MASTER = `
ANALISTA DE COTIZACIONES ELITE (Omni Elite Edition OMNI 3.0)
Tu objetivo es realizar un desglose total y un análisis persuasivo de esta cotización de seguro.

REGLAS DE ORO:
1. EXTRACCIÓN TOTAL: Extrae CADA cobertura listada en la tabla de beneficios, sin importar qué tan pequeña sea.
2. DEDUCIBLES PRECISOS: Si la tabla menciona un deducible (ej. 5%, 10%, 1500 pesos) para una cobertura, regístralo exactamente.
3. ANÁLISIS OMNI: Genera un párrafo de 3 a 4 líneas llamado "omni_analysis". Debe ser un texto persuasivo, dirigido al cliente, destacando por qué esta opción es sólida (ej. "Esta cotización de Quálitas ofrece un blindaje superior en Responsabilidad Civil, ideal para tu perfil de manejo...").

ESTRUCTURA JSON OBLIGATORIA:
{
  "insurer_name": "Nombre de la aseguradora",
  "premium_total": 0.0,
  "currency": "MXN/USD",
  "client_name": "Nombre si aparece",
  "vehicle_info": "Marca, Modelo, Año",
  "coverage_plan": "Amplia/Limitada/etc",
  "deductible_dmg": "Deducible en Daños Materiales (ej. 5%)",
  "deductible_theft": "Deducible en Robo Total (ej. 10%)",
  "omni_analysis": "Texto persuasivo de la IA para el cliente",
  "coverages": [
    { "name": "Nombre Cobertura", "limit": "Suma Asegurada", "deductible": "Deducible específico si hay" }
  ]
}

Responde ÚNICAMENTE el objeto JSON. No incluyas markdown ni explicaciones fuera del JSON.`;

export const PROMPT_KNOWLEDGE_FEED = `
CONTEXTO DE ASEGURADORAS (GUÍA RÁPIDA):
- GNP: Busca "Prima Neta", "Derecho de Póliza" e "IVA". Coberturas clave: Daños Materiales, Robo Total, RC.
- AXA: Busca "Suma Asegurada" por cobertura. RC suele dividirse en Personas y Bienes.
- Qualitas: RC es de 3 o 4 millones usualmente. Busca "Asistencia Vial Quálitas".
- Mapfre: Busca "Costo Total" y desgloses de "Gastos Médicos".

REGLA DE VELOCIDAD: No analices texto irrelevante como avisos de privacidad. Enfócate solo en la tabla de coberturas y el resumen de costo (Prima Total).
`;
