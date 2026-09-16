import * as React from 'react'

export interface ChartPoint {
  date: string
  value: number
}

const WIDTH = 680
const HEIGHT = 280
const PAD = { top: 20, right: 16, bottom: 32, left: 46 }

export function WeightChart({ points, unitLabel }: { points: ChartPoint[]; unitLabel: string }) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)

  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  const values = points.map((p) => p.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const range = rawMax - rawMin || 2
  const min = rawMin - range * 0.15
  const max = rawMax + range * 0.15

  const times = points.map((p) => new Date(p.date).getTime())
  const minT = Math.min(...times)
  const maxT = Math.max(...times)
  const timeRange = maxT - minT || 1

  const xFor = (i: number) => {
    if (points.length === 1) return PAD.left + innerW / 2
    return PAD.left + ((times[i] - minT) / timeRange) * innerW
  }
  const yFor = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ')
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${PAD.top + innerH} L ${xFor(0)} ${PAD.top + innerH} Z`

  const gridLevels = 4
  const gridValues = Array.from({ length: gridLevels }, (_, i) => min + ((max - min) / (gridLevels - 1)) * i)

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const scaleX = WIDTH / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX
    let closest = 0
    let closestDist = Infinity
    points.forEach((_, i) => {
      const dist = Math.abs(xFor(i) - mouseX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setHoverIdx(closest)
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null
  const last = points[points.length - 1]

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 100% 50%)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(38 100% 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="hsl(220 12% 20%)"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={yFor(v) + 4} textAnchor="end" fontSize={11} fill="hsl(220 8% 55%)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#weightAreaGradient)" />
        <path d={linePath} fill="none" stroke="hsl(38 100% 50%)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => {
          const isHover = hoverIdx === i
          const isLast = i === points.length - 1
          if (points.length > 20 && !isHover && !isLast) return null
          return (
            <circle
              key={i}
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={isHover ? 6 : 4}
              fill={isHover ? 'hsl(38 100% 50%)' : 'hsl(220 15% 8%)'}
              stroke="hsl(38 100% 50%)"
              strokeWidth={2}
            />
          )
        })}

        {hover && (
          <line
            x1={xFor(hoverIdx!)}
            x2={xFor(hoverIdx!)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="hsl(220 8% 55%)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        <text x={WIDTH - PAD.right} y={yFor(last.value) - 12} textAnchor="end" fontSize={12} fill="hsl(40 20% 96%)" fontWeight={700}>
          {last.value.toFixed(1)} {unitLabel}
        </text>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-card"
          style={{
            left: `${(xFor(hoverIdx!) / WIDTH) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-foreground">
            {hover.value.toFixed(1)} {unitLabel}
          </div>
          <div className="text-muted-foreground">{new Date(hover.date).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  )
}
