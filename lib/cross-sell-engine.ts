import { supabase } from "./supabase";

export interface SalesOpportunity {
    client_id: string;
    client_name: string;
    missing_line: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    potential_premium?: number;
}

export type ClientArchetype = 'parent' | 'entrepreneur' | 'ceo' | 'professional' | 'generic';

const PROTECTION_BUNDLE = [
    { name: 'Autos', priority: 'high', icon: '🚗' },
    { name: 'Gastos Médicos Mayores', priority: 'high', icon: '🏥' },
    { name: 'Vida', priority: 'medium', icon: '🛡️' },
    { name: 'Hogar', priority: 'low', icon: '🏠' }
];

export async function analyzePortfolioCrossSell(): Promise<SalesOpportunity[]> {
    try {
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select(`
                id, 
                first_name, 
                last_name,
                policies(
                    id, 
                    status, 
                    insurance_lines(name, category)
                )
            `);

        if (clientError) throw clientError;

        const opportunities: SalesOpportunity[] = [];

        clients?.forEach(client => {
            const activePolicies = client.policies?.filter((p: any) => p.status === 'Vigente') || [];
            const coveredLines = new Set(activePolicies.map((p: any) => p.insurance_lines?.category || p.insurance_lines?.name));

            PROTECTION_BUNDLE.forEach(item => {
                if (!coveredLines.has(item.name) && !coveredLines.has(item.name.toUpperCase())) {
                    opportunities.push({
                        client_id: client.id,
                        client_name: `${client.first_name} ${client.last_name}`,
                        missing_line: item.name,
                        priority: item.priority as any,
                        reason: `Protección integral: ${client.first_name} ya confía en nosotros pero su patrimonio en ${item.name} aún no está blindado con nuestra asesoría.`
                    });
                }
            });
        });

        return opportunities.sort((a, b) => {
            const score = { high: 3, medium: 2, low: 1 };
            return score[b.priority] - score[a.priority];
        });

    } catch (error) {
        console.error("Cross-Sell Analysis Error:", error);
        return [];
    }
}

export function generateCrossSellPitch(clientName: string, missingLine: string, archetype: ClientArchetype = 'generic'): string {
    const strategy: Record<string, Record<ClientArchetype, string>> = {
        'Autos': {
            parent: `Hola ${clientName}, como papá sé que tu mayor miedo es que tu esposa o hijos se queden varados en la noche por una falla mecánica o un percance. Mi plan de Auto RB Proyectos incluye asistencia de rescate inmediato; no solo aseguro el coche, aseguro que ellos siempre lleguen a salvo contigo.`,
            entrepreneur: `Qué tal ${clientName}. Para un emprendedor, que te roben la unidad de reparto o tu medio de transporte es perder días de facturación. He diseñado un plan con "operatividad garantizada": si te roban el auto, te damos flujo o auto sustituto para que tu negocio no se detenga ni un segundo.`,
            ceo: `Estimado ${clientName}. Un líder con visión protege su tiempo. Tu póliza de auto actual es genérica; la que te propongo es ejecutiva: incluye chofer de reemplazo y cobertura total de objetos personales valiosos. Protegemos tu estatus y tu patrimonio.`,
            professional: `Hola ${clientName}. Tu imagen como profesional es tu activo #1. Un coche chocado o mal asegurado proyecta descuido. Mi propuesta garantiza reparación en agencia con piezas originales siempre, cuidando tu estándar de excelencia.`,
            generic: `Hola ${clientName}, revisando tu blindaje noté que tu patrimonio vehicular aún no está bajo nuestra asesoría. Me encantaría ofrecerte una revisión para optimizar costos y coberturas.`
        },
        'Gastos Médicos Mayores': {
            parent: `Hola ${clientName}. No hay dolor más grande que ver a un hijo enfermo y saber que la mejor clínica del país está fuera de tu alcance. Vamos a eliminar ese miedo. Con este plan, tus hijos tienen "pase VIP" a los mejores especialistas, sin que tú tengas que tocar tus ahorros.`,
            entrepreneur: `Qué tal ${clientName}. Como emprendedor, tú eres el motor. Si tú te enfermas, ¿quién paga la nómina? Este seguro de Gastos Médicos es tu "seguro de socio clave": pagamos tu hospitalización y te damos un flujo para que tu negocio siga vivo mientras tú te recuperas.`,
            ceo: `Estimado ${clientName}. La medicina de alto nivel no es un lujo, es una herramienta estratégica. Blindamos tu salud con acceso internacional; porque un estratega como tú debe ser atendido donde estén los mejores del mundo.`,
            professional: `Hola ${clientName}. Has trabajado años para construir tu capital. Un imprevisto médico de 1 millón de pesos puede borrarlo en una semana. Vamos a blindar tus ahorros con una póliza que transfiera ese riesgo a la aseguradora.`,
            generic: `Hola ${clientName}. Sabemos que tu estabilidad es prioridad. Contamos con planes de Gastos Médicos de alta gama que completan tu protección 360.`
        },
        'Vida': {
            parent: `Hola ${clientName}. Como papá, tu mayor pesadilla es no estar para verlos graduarse o que tengan que dejar su escuela por falta de dinero. Un seguro de vida no es para que tú mueras, es para que ellos sigan viviendo el futuro que soñaste para ellos. ¿Lo aseguramos hoy?`,
            entrepreneur: `Qué tal ${clientName}. Has invertido todo en tu empresa. Si faltas hoy, tu familia hereda deudas y activos difíciles de vender. Vamos a darles liquidez inmediata para que puedan decidir si siguen con tu legado o viven tranquilos de tus frutos.`,
            ceo: `Estimado ${clientName}. La permanencia de tu imperio depende de la liquidez en la sucesión. Un seguro de vida de alta suma asegura que tus herederos paguen impuestos y mantengan el control de la organización sin malvender activos.`,
            professional: `Hola ${clientName}. Tu mente es la que genera la riqueza. Si esa "máquina de dinero" se detiene por invalidez o fallecimiento, este plan entra en acción. Es tu pensión garantizada y el blindaje de tus seres queridos.`,
            generic: `Hola ${clientName}. Como parte de nuestra asesoría patrimonial, un esquema de Vida es la pieza que falta para asegurar que tus metas financieras se cumplan siempre.`
        },
        'Hogar': {
            parent: `Hola ${clientName}. Protegemos el auto que duerme en la calle, pero ¿qué hay del lugar donde duermen tus hijos? Te preocupa un corto circuito o un robo mientras no estás. Por menos de lo que cuesta una cena, blindamos todo lo que hay dentro de tu santuario.`,
            entrepreneur: `Qué tal ${clientName}. A veces usamos la casa como respaldo o incluso bodega. Un incidente en el hogar puede descapitalizar tu negocio. Vamos a separar tus riesgos: que nada de lo que pase en casa toque el flujo de tu empresa.`,
            ceo: `Estimado ${clientName}. Tu residencia alberga obras de arte y una vida de logros. Merece la cobertura "All Risk" de RB Proyectos, donde incluso tus bienes fuera de casa y tu responsabilidad civil global están cubiertos.`,
            professional: `Hola ${clientName}. Tu casa es tu paz. Un robo de tus herramientas de trabajo (laptop, equipo) puede ser un golpe duro. Mi plan de Hogar cubre tus equipos electrónicos en todo lugar, para que trabajes tranquilo donde sea.`,
            generic: `Hola ${clientName}. Proteger tu hogar cuesta apenas una fracción de lo que inviertes en otros seguros. Vamos a darle a tu espacio el sello de protección RB Proyectos.`
        }
    };

    const linePitches = strategy[missingLine] || strategy['Autos'];
    return linePitches[archetype] || linePitches['generic'];
}

export interface PresentationData {
    intro: string;
    value_prop: string[];
    cta: string;
    example_link: string;
    data_reqs: string[];
}

export function generateStructuredPresentation(clientName: string, missingLine: string, archetype: ClientArchetype = 'generic'): PresentationData {
    const pitch = generateCrossSellPitch(clientName, missingLine, archetype);
    
    const baseValueProps = [
        "Estudio comparativo real con más de 20 aseguradoras líderes (GNP, AXA, Chubb, etc).",
        "Análisis actuarial del valor de tu activo para evitar infra-seguros.",
        "Coberturas 'Tailor-Made' diseñadas específicamente para tu perfil de riesgo."
    ];

    const specificData: Record<string, { reqs: string[], example: string }> = {
        'Autos': {
            reqs: ["Número de serie (VIN)", "Código Postal de circulación", "Uso del vehículo"],
            example: "https://portal.renebreton.mx/cotizacion/premium-auto-demo"
        },
        'Gastos Médicos Mayores': {
            reqs: ["Edades de los ocupantes", "Código Postal", "Nivel hospitalario deseado"],
            example: "https://portal.renebreton.mx/cotizacion/gmm-elite-demo"
        },
        'Vida': {
            reqs: ["Fecha de nacimiento", "Hábito de fumador", "Suma asegurada objetivo"],
            example: "https://portal.renebreton.mx/cotizacion/vida-blindaje-demo"
        }
    };

    const lineData = specificData[missingLine] || specificData['Autos'];

    return {
        intro: pitch,
        value_prop: baseValueProps,
        cta: `¿Te gustaría que diseñáramos tu Protección de ${missingLine} sin compromiso? Solo necesito estos datos para empezar:`,
        example_link: lineData.example,
        data_reqs: lineData.reqs
    };
}
