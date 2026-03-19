import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateProratedRent } from '@/lib/utils/rent'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { LeaseDocument } from '@/components/pdf/LeaseDocument'
import React from 'react'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { unitId, tenantId, startDate, endDate, monthlyRent, clauses, breakFee, breakFeeDescription } = await req.json()

  if (!unitId || !tenantId || !startDate || !endDate || !monthlyRent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify landlord owns this unit
  const { data: unit } = await supabase
    .from('units')
    .select('id, buildings(landlord_id)')
    .eq('id', unitId)
    .single()

  if (!unit || (unit as any).buildings?.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create the lease
  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .insert({
      unit_id: unitId,
      tenant_id: tenantId,
      start_date: startDate,
      end_date: endDate,
      monthly_rent: monthlyRent,
      clauses: clauses ?? [],
      break_fee: breakFee ?? 0,
      break_fee_description: breakFeeDescription ?? null,
      status: 'active',
    })
    .select()
    .single()

  if (leaseError) return NextResponse.json({ error: leaseError.message }, { status: 500 })

  // Mark unit as occupied
  await supabase.from('units').update({ occupied: true }).eq('id', unitId)

  // Auto-generate PDF
  try {
    const { data: leaseForPdf } = await supabase
      .from('leases')
      .select('*, profiles!tenant_id(full_name), units(unit_number, buildings(name, address))')
      .eq('id', lease.id)
      .single()

    const pdfBuffer = await renderToBuffer(
      React.createElement(LeaseDocument, { lease: leaseForPdf }) as React.ReactElement<DocumentProps>
    )
    const fileName = `leases/${lease.id}.pdf`
    const { data: upload, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (!uploadError && upload) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      await supabase.from('leases').update({ pdf_url: urlData.publicUrl }).eq('id', lease.id)
      lease.pdf_url = urlData.publicUrl
    }
  } catch (_) {
    // PDF generation failure is non-fatal — lease is still created
  }

  // Calculate and log prorated first-month rent if move-in is not the 1st
  const moveIn = new Date(startDate)
  if (moveIn.getDate() !== 1) {
    const prorated = calculateProratedRent(moveIn, Number(monthlyRent))
    await supabase.from('ledger_entries').insert({
      lease_id: lease.id,
      type: 'rent',
      amount: prorated,
      bucket: 'revenue',
      description: `Prorated rent for ${moveIn.toLocaleString('en-US', { month: 'long', year: 'numeric' })} (${moveIn.getDate()}–end of month)`,
    })
  }

  // Log security deposit as deposit_hold (assumed = 1 month's rent)
  await supabase.from('ledger_entries').insert({
    lease_id: lease.id,
    type: 'deposit',
    amount: monthlyRent,
    bucket: 'deposit_hold',
    description: 'Security deposit (held)',
  })

  return NextResponse.json({ lease: { ...lease, pdf_url: lease.pdf_url ?? null } })
}
