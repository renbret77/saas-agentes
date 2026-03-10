import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const migrationsDir = path.join(process.cwd(), 'migrations')

        if (!fs.existsSync(migrationsDir)) {
            return NextResponse.json({ migrations: [] })
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort((a, b) => {
                // Ordenar por versión si tienen el formato migration_vX
                const matchA = a.match(/v(\d+)/)
                const matchB = b.match(/v(\d+)/)
                if (matchA && matchB) {
                    return parseInt(matchA[1]) - parseInt(matchB[1])
                }
                return a.localeCompare(b)
            })

        return NextResponse.json({ migrations: files })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
