import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { LeaseDocument } from '@/components/pdf/LeaseDocument'
import React from 'react'

export async function POST(req: Request) {
  const { lease_id } = await req.json()
  const supabase = await createClient()

  const { data: lease } = await supabase
    .from('leases')
    .select('*, profiles(full_name), units(unit_number, buildings(name, address))')
    .eq('id', lease_id)
    .single()

  const pdfBuffer = await renderToBuffer(
    React.createElement(LeaseDocument, { lease }) as React.ReactElement<DocumentProps>
  )

  const fileName = `leases/${lease_id}.pdf`
  await supabase.storage.from('documents').upload(fileName, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  })

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
  await supabase.from('leases').update({ pdf_url: urlData.publicUrl }).eq('id', lease_id)

  return NextResponse.json({ pdf_url: urlData.publicUrl })
}
