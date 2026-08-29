import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', other: 'Other' }

export default function PaymentMethodChart({ data }) {
  // A single-hue bar breakdown rather than a pie: the 4 categories are fixed
  // and already fully identified by their axis labels, so color doesn't need
  // to carry identity here — and it avoids reusing the store accent colors
  // for an unrelated dimension elsewhere on the same dashboard.
  const chartData = Object.entries(LABELS).map(([key, label]) => ({
    method: label,
    revenue: Number(data[key] ?? 0),
  }))

  const hasData = chartData.some((row) => row.revenue > 0)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Payment Methods</h3>

      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No sales yet for this range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="method"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Bar dataKey="revenue" fill="#4338CA" radius={[4, 4, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
