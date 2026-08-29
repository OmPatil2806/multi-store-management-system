import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
]

// Secondary encoding beyond color (dash pattern) so the Emerald/Rose pair
// stays distinguishable for deuteranopic readers, not color-alone.
const DASH_PATTERNS = [undefined, '6 3', '2 3']

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * series: [{ name, color, data: [{ date, revenue }] }]
 * One entry = single line, no legend. Multiple entries = multi-line + legend.
 */
export default function RevenueChart({ series, range, onRangeChange }) {
  const chartData = useMemo(() => {
    const dateSet = new Set()
    series.forEach((s) => s.data.forEach((point) => dateSet.add(point.date)))
    const dates = [...dateSet].sort()

    return dates.map((date) => {
      const row = { date }
      series.forEach((s) => {
        const point = s.data.find((p) => p.date === date)
        row[s.name] = point ? Number(point.revenue) : 0
      })
      return row
    })
  }, [series])

  const hasData = chartData.length > 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Revenue</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? 'default' : 'outline'}
              onClick={() => onRangeChange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No sales yet for this range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
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
              formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
              labelFormatter={formatDate}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={DASH_PATTERNS[i % DASH_PATTERNS.length]}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
