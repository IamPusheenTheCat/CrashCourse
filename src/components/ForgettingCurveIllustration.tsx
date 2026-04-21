import { useId } from 'react';

/** 个人页：艾宾浩斯遗忘曲线示意 */
export default function ForgettingCurveIllustration() {
  const gid = useId().replace(/:/g, '');

  /** 贝塞尔近似：左侧高保留、初期陡降、后期趋缓并贴近下沿（指数型遗忘的常见视觉特征） */
  const curveD =
    'M 40 18 C 72 44, 108 68, 148 78 C 178 84, 200 87 220 88';

  return (
    <div className="w-full select-none">
      <svg
        viewBox="0 0 248 114"
        className="w-full h-auto max-h-[132px]"
        aria-label="Schematic Ebbinghaus forgetting curve: retention high at first, then drops faster at the start and more slowly later"
      >
        <defs>
          <linearGradient id={`${gid}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1="40" y1="90" x2="220" y2="90" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <line x1="40" y1="90" x2="40" y2="12" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <path d={`${curveD} L 220 90 L 40 90 Z`} fill={`url(#${gid}-fade)`} />
        <path
          d={curveD}
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="132" y="106" fill="rgba(255,255,255,0.45)" fontSize="9" textAnchor="middle">
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
        Retention falls fast early, then slows—reviews help bring it back up
      </p>
    </div>
  );
}
