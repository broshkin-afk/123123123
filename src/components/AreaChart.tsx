import React from 'react';

type Point = { label?: string; value: number };

type Props = {
  points: Point[];
  height?: number;
  stroke?: string;
  fill?: string;
};

export default function AreaChart({ points, height = 360, stroke = '#6a5cff', fill = 'rgba(106,92,255,0.25)' }: Props) {
  const width = 1000;
  const pad = { top: 24, right: 16, bottom: 36, left: 24 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map(p => p.value));
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const xy = points.map((p, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + (innerH - (p.value / max) * innerH);
    return { x, y, p };
  });

  const lineD = xy.length
    ? `M ${xy[0].x} ${xy[0].y} ` + xy.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ')
    : '';
  const areaD = xy.length
    ? `M ${xy[0].x} ${height - pad.bottom} ` +
      xy.map(pt => `L ${pt.x} ${pt.y}`).join(' ') +
      ` L ${xy[xy.length - 1].x} ${height - pad.bottom} Z`
    : '';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', display: 'block' }}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" />

        {areaD && <path d={areaD} fill={fill} stroke="none" />}
        {lineD && <path d={lineD} fill="none" stroke={stroke} strokeWidth={3} />}

        {xy.map(({ x, y, p }, i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill={stroke} />
            {/* value label */}
            {Number.isFinite(p.value) && (
              <g>
                <rect x={x - (String(p.value).length * 6 + 12) / 2} y={y - 26} rx={6} ry={6} width={String(p.value).length * 6 + 12} height={18} fill={stroke} opacity={0.9} />
                <text x={x} y={y - 13} textAnchor="middle" fontSize={10} fill="#fff">{p.value}</text>
              </g>
            )}
          </g>
        ))}

        {/* x ticks */}
        {xy.map(({ x, p }, i) => (
          p.label ? (
            <text key={`t-${i}`} x={x} y={height - 10} textAnchor="middle" fontSize={11} fill="#8b90a0">{p.label}</text>
          ) : null
        ))}
      </svg>
    </div>
  );
} 