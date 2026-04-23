import { useId, useMemo } from 'react';
import { EBBINGHAUS_CURVE_MARKERS } from '../constants/forgettingCurveSchedule';

type Pt = readonly [number, number];

const X_L = 40;
const X_R = 220;
const Y_AXIS = 90;

/**
 * 原始示意曲线（与初版相同）：先陡后缓，贴近常见「艾宾浩斯」示意图走势。
 * 仅几何形状保留；横轴刻度用时间映射到本路径的 x。
 */
const CURVE_D = 'M 40 18 C 72 44, 108 68, 148 78 C 178 84, 200 87 220 88';

const SEG1: readonly [Pt, Pt, Pt, Pt] = [
  [40, 18],
  [72, 44],
  [108, 68],
  [148, 78],
];
const SEG2: readonly [Pt, Pt, Pt, Pt] = [
  [148, 78],
  [178, 84],
  [200, 87],
  [220, 88],
];

/** 轴上时间：30m～7d 用对数映射到 x（多数量级下仍可读；刻度即真实时间） */
const T_AXIS_MIN = EBBINGHAUS_CURVE_MARKERS[0].minutes;
const T_AXIS_MAX = 7 * 24 * 60;

const AXIS_TICKS = [
  { minutes: 30, label: '30m' },
  { minutes: 12 * 60, label: '12h' },
  { minutes: 24 * 60, label: '1d' },
  { minutes: T_AXIS_MAX, label: '7d' },
] as const;

function cubicBezier(t: number, seg: readonly [Pt, Pt, Pt, Pt]): Pt {
  const [p0, p1, p2, p3] = seg;
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  const x = u3 * p0[0] + 3 * u2 * t * p1[0] + 3 * u * t2 * p2[0] + t3 * p3[0];
  const y = u3 * p0[1] + 3 * u2 * t * p1[1] + 3 * u * t2 * p2[1] + t3 * p3[1];
  return [x, y] as const;
}

function xOfTime(minutes: number): number {
  const lo = Math.log(T_AXIS_MIN);
  const hi = Math.log(T_AXIS_MAX);
  const clamped = Math.min(Math.max(minutes, T_AXIS_MIN), T_AXIS_MAX);
  return X_L + (X_R - X_L) * ((Math.log(clamped) - lo) / (hi - lo));
}

/** 原曲线上 x 对应的 y（两段贝塞尔上 x 均单调增，可二分参数） */
function yOnCurveAtX(targetX: number): number {
  if (targetX <= X_L) return SEG1[0][1];
  if (targetX >= X_R) return SEG2[3][1];
  const seg = targetX <= 148 ? SEG1 : SEG2;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const x = cubicBezier(mid, seg)[0];
    if (x < targetX) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  return cubicBezier(u, seg)[1];
}

/** 个人页：艾宾浩斯示意曲线（形状不变）+ 横轴为时间 + 后端复习锚点落在曲线上 */
export default function ForgettingCurveIllustration() {
  const gid = useId().replace(/:/g, '');

  const fillD = `${CURVE_D} L ${X_R} ${Y_AXIS} L ${X_L} ${Y_AXIS} Z`;

  const markerPoints = useMemo(
    () =>
      EBBINGHAUS_CURVE_MARKERS.map((m) => {
        const x = xOfTime(m.minutes);
        return { shortLabel: m.shortLabel, x, y: yOnCurveAtX(x) };
      }),
    [],
  );

  const ariaMarkers = EBBINGHAUS_CURVE_MARKERS.map((m) => `${m.shortLabel}`).join(', ');

  return (
    <div className="w-full select-none">
      <svg
        viewBox="0 -8 248 128"
        className="w-full h-auto max-h-[152px]"
        aria-label={`Ebbinghaus-style forgetting curve (schematic). Time on horizontal axis (${T_AXIS_MIN} min to ${T_AXIS_MAX} min, log spacing). Markers: ${ariaMarkers}.`}
      >
        <defs>
          <linearGradient id={`${gid}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={X_L} y1={Y_AXIS} x2={X_R} y2={Y_AXIS} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <line x1={X_L} y1={Y_AXIS} x2={X_L} y2="12" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        {AXIS_TICKS.map((tick) => (
          <line
            key={tick.label}
            x1={xOfTime(tick.minutes)}
            y1={Y_AXIS}
            x2={xOfTime(tick.minutes)}
            y2={Y_AXIS + 4}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
          />
        ))}

        <path d={fillD} fill={`url(#${gid}-fade)`} />
        <path
          d={CURVE_D}
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {markerPoints.map((p) => (
          <g key={p.shortLabel}>
            <text
              x={p.x}
              y={p.y - 9}
              fill="rgba(255,255,255,0.58)"
              fontSize="8.5"
              fontWeight="600"
              textAnchor="middle"
              style={{ fontFeatureSettings: '"tnum"' }}
            >
              {p.shortLabel}
            </text>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="rgb(251 113 133)"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="1.25"
            />
          </g>
        ))}

        {AXIS_TICKS.map((tick) => {
          const x = xOfTime(tick.minutes);
          const anchor =
            tick.minutes <= 45 ? 'start' : tick.label === '7d' ? 'end' : 'middle';
          const tx = anchor === 'start' ? x + 2 : anchor === 'end' ? x - 2 : x;
          return (
            <text
              key={tick.label}
              x={tx}
              y={104}
              fill="rgba(255,255,255,0.42)"
              fontSize="8"
              textAnchor={anchor}
            >
              {tick.label}
            </text>
          );
        })}

        <text x="132" y="118" fill="rgba(255,255,255,0.45)" fontSize="9" textAnchor="middle">
          Time →
        </text>
        <text
          x="12"
          y="54"
          fill="rgba(255,255,255,0.45)"
          fontSize="8.5"
          textAnchor="middle"
          transform="rotate(-90 12 54)"
        >
          Retention
        </text>
      </svg>
      <p className="text-cc-muted text-[11px] leading-snug mt-2 text-center px-0.5">
        Retention falls fast early, then slows—reviews help bring it back up.
      </p>
    </div>
  );
}
