'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts'

interface UnitRent {
  label: string
  market: number
  actual: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const market = payload.find((p: any) => p.dataKey === 'market')?.value ?? 0
  const actual = payload.find((p: any) => p.dataKey === 'actual')?.value ?? 0
  const gap    = market - actual
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      <p className="text-slate-500">Market: <span className="font-bold text-slate-800">${market.toLocaleString()}</span></p>
      <p className="text-slate-500">Actual: <span className="font-bold text-emerald-600">${actual.toLocaleString()}</span></p>
      {gap > 0 && (
        <p className="text-orange-500 font-semibold mt-1">−${gap.toLocaleString()} gap</p>
      )}
    </div>
  )
}

export function RentComparisonChart({ data }: { data: UnitRent[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-400">
        No unit data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v.toLocaleString()}`}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="market" name="Market Rent" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={10} />
        <Bar dataKey="actual" name="Actual Rent"  fill="#2563eb" radius={[0, 4, 4, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  )
}
