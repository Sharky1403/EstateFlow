import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { LeaseDocument } from '@/components/pdf/LeaseDocument'
import React from 'react'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leaseId, signatureData } = await req.json()
  if (!leaseId || !signatureData) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the lease belongs to this tenant
  const { data: lease } = await supabase
    .from('leases')
    .select('id, tenant_id, signed_at')
    .eq('id', leaseId)
    .single()

  if (!lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  if (lease.tenant_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (lease.signed_at) return NextResponse.json({ error: 'Lease already signed' }, { status: 400 })

  const signedAt = new Date().toISOString()

  const { error } = await supabase
    .from('leases')
    .update({ signature_data: signatureData, signed_at: signedAt })
    .eq('id', leaseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Regenerate PDF with signature embedded
  try {
    const { data: leaseForPdf } = await supabase
      .from('leases')
      .select('*, profiles!tenant_id(full_name), units(unit_number, buildings(name, address))')
      .eq('id', leaseId)
      .single()

    const pdfBuffer = await renderToBuffer(
      React.createElement(LeaseDocument, {
        lease: { ...leaseForPdf, signed_at: signedAt },
        signatureData,
      }) as React.ReactElement<DocumentProps>
    )

    const fileName = `leases/${leaseId}.pdf`
    const { data: upload, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (!uploadError && upload) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      await supabase.from('leases').update({ pdf_url: urlData.publicUrl }).eq('id', leaseId)
    }
  } catch (_) {
    // PDF regeneration failure is non-fatal
  }

  return NextResponse.json({ ok: true })
}
