"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/format";

// Single-series charts in the brand hue (validated ≥3:1 against both chart surfaces):
// line = --primary-strong on light / --primary on dark, via the --chart-line token.
const LINE = "var(--chart-line)";
const FILL = "var(--chart-fill)";
const GRID = "var(--border)";
const AXIS = "var(--ink-muted)";

type Point = { day: string; revenue: number; orders: number };

const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** KPI sparkline (decorative — the number beside it carries the value). */
export function Sparkline({ data, field }: { data: Point[]; field: "revenue" | "orders" }) {
  return (
    <div className="h-12 w-28" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${field}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FILL} stopOpacity={0.45} />
              <stop offset="100%" stopColor={FILL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={field}
            stroke={LINE}
            strokeWidth={2}
            fill={`url(#spark-${field})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: Point }[];
  label?: string;
}) {
  const p = payload?.[0];
  if (!active || !p || !label) return null;
  return (
    <div className="bg-ink text-bg rounded-control px-3 py-2 text-xs shadow-lg">
      <p className="opacity-80">{dayLabel(label)}</p>
      <p className="mt-0.5 text-sm font-semibold">{money(p.payload.revenue)}</p>
      <p className="opacity-80">
        {p.payload.orders} order{p.payload.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Revenue over time — area chart with crosshair + tooltip; a table copy is rendered for screen readers. */
export function RevenueChart({ data }: { data: Point[] }) {
  const tickEvery = Math.max(1, Math.ceil(data.length / 8));
  return (
    <>
      <div className="h-72" role="img" aria-label="Revenue per day chart (data table follows)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={FILL} stopOpacity={0.5} />
                <stop offset="100%" stopColor={FILL} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
            <XAxis
              dataKey="day"
              tickFormatter={dayLabel}
              interval={tickEvery - 1}
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 100_000 ? `$${Number((v / 100_000).toFixed(1))}k` : `$${Math.round(v / 100)}`
              }
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: LINE, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={LINE}
              strokeWidth={2}
              fill="url(#revenue-fill)"
              activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: LINE }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Revenue per day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{money(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/** Orders by status — horizontal bars, labelled directly (single measure, one hue). */
export function StatusBars({ data }: { data: { label: string; n: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
          barCategoryGap={6}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: AXIS, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-muted)" }}
            content={({ active, payload }) => {
              const p = payload[0];
              if (!active || !p) return null;
              const d = p.payload as { label: string; n: number };
              return (
                <div className="bg-ink text-bg rounded-control px-3 py-2 text-xs shadow-lg">
                  {d.label}: <strong>{d.n}</strong>
                </div>
              );
            }}
          />
          <Bar
            dataKey="n"
            fill={LINE}
            radius={[0, 4, 4, 0]}
            label={{ position: "right", fill: AXIS, fontSize: 11 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
