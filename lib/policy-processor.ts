
import { InsurerConfig } from './insurers-config';

export interface ClassifiedFile {
    originalName: string;
    normalizedName: string;
    category: string;
    confidence: number;
    installmentNumber?: number;
}

/**
 * Normaliza nombres de archivo similar al script Python de Quálitas
 */
export function normalizeFileName(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[\s\-_.]+/g, " ") // Espacios por guiones/puntos
        .trim();
}

/**
 * Clasifica un archivo basado en las reglas de la aseguradora
 */
export function classifyFile(fileName: string, config: InsurerConfig): ClassifiedFile {
    const norm = normalizeFileName(fileName);
    const rules = config.docClassificationRules;

    if (!rules) {
        return { originalName: fileName, normalizedName: norm, category: 'otro', confidence: 0 };
    }

    // 1. Buscar coincidencias por prefijo
    for (const [category, prefixes] of Object.entries(rules.prefixes)) {
        for (const prefix of prefixes) {
            const normPrefix = normalizeFileName(prefix);
            if (norm.startsWith(normPrefix)) {
                let installmentNumber: number | undefined = undefined;

                // Si es recibo, intentar extraer el número
                if (category === 'recibos') {
                    const match = norm.match(/(\d+)/);
                    if (match) installmentNumber = parseInt(match[1]);
                }

                return {
                    originalName: fileName,
                    normalizedName: norm,
                    category,
                    confidence: 1,
                    installmentNumber
                };
            }
        }
    }

    return { originalName: fileName, normalizedName: norm, category: 'otro', confidence: 0 };
}

/**
 * Procesa una lista de archivos y los agrupa por categoría
 */
export function processFileList(fileNames: string[], config: InsurerConfig) {
    const results = fileNames.map(f => classifyFile(f, config));
    
    return {
        buckets: results.reduce((acc, curr) => {
            if (!acc[curr.category]) acc[curr.category] = [];
            acc[curr.category].push(curr);
            return acc;
        }, {} as Record<string, ClassifiedFile[]>),
        all: results
    };
}
