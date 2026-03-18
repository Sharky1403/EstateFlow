'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function TaxReportDownload({ year }: { year: number }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/tax-report?year=${year}`)
      const data = await res.json()

      const rows = [
        ['EstateFlow Tax Report', year.toString(), '', '', ''],
        ['', '', '', '', ''],
        ['SUMMARY', '', '', '', ''],
        ['Gross Income', `$${data.summary.income.toLocaleString()}`, '', '', ''],
        ['Total Expenses', `$${data.summary.expenses.toLocaleString()}`, '', '', ''],
        ['Net Operating Income', `$${data.summary.noi.toLocaleString()}`, '', '', ''],
        ['', '', '', '', ''],
        ['TRANSACTIONS', '', '', '', ''],
        ['Date', 'Type', 'Property', 'Description', 'Amount'],
        ...data.entries.map((e: any) => [
          e.date ? new Date(e.date).toLocaleDateString() : '',
          e.type?.replace(/_/g, ' ') ?? '',
          e.building ?? '',
          e.description ?? '',
          (e.bucket === 'expense' ? '-' : '') + e.amount,
        ]),
      ]

      const csv = rows.map(r => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `estateflow-tax-report-${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} loading={loading}>
      Download CSV
    </Button>
  )
}
