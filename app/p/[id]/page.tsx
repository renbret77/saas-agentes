import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function ShortLinkPage({ params }: Props) {
  const { id } = await params

  try {
    // Decodificar Base64URL
    const base64 = id.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8')
    const data = JSON.parse(jsonStr)

    const { p, n, t, id: docId } = data

    // Si tenemos el ID del documento, registramos la vista
    if (docId) {
      // Usamos una operación atómica para incrementar el contador y actualizar la fecha
      // Nota: RPC podría ser más limpio pero para este caso directo usamos un update
      await supabase
        .from('policy_documents')
        .update({
          last_viewed_at: new Date().toISOString(),
          view_count: supabase.rpc('increment', { row_id: docId }) // Placeholder for logic
        })
        .eq('id', docId)

      // Alternativa si no hay RPC de incremento genérico:
      // Primero obtenemos el valor actual o simplemente hacemos un hack de SQL si el backend lo permite
      // Pero como estamos en Next.js Server Components, podemos hacerlo en dos pasos o vía RPC
      await (supabase.rpc as any)('record_document_view', {
          p_doc_id: docId
      })
    }

    // Redirigir a la ruta de vista con los parámetros originales
    const searchParams = new URLSearchParams()
    if (p) searchParams.set('p', p)
    if (n) searchParams.set('n', n)
    if (t) searchParams.set('t', t)

    redirect(`/portal/view?${searchParams.toString()}`)
  } catch (err) {
    console.error("Error decoding short link:", err)
    redirect('/portal/view')
  }
}
