import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export type ProductTourStep = {
  /** document.querySelector，如 `[data-product-tour="menu-practice"]` */
  selector: string;
  title: string;
  body: string;
  /** 高亮框比元素大出的像素（更易点中视觉） */
  inflate?: number;
};

type Props = {
  open: boolean;
  steps: ProductTourStep[];
  onClose: () => void;
  onComplete: () => void;
  /** 底部安全区 + 可选 Tab 高度（px），避免气泡被遮挡 */
  bottomInsetPx?: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export default function ProductTourOverlay({
  open,
  steps,
  onClose,
  onComplete,
  bottomInsetPx = 24,
}: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [bubbleTop, setBubbleTop] = useState<number>(0);

  const safeStep =
    steps.length === 0 ? 0 : Math.min(step, Math.max(0, steps.length - 1));
  const current = steps[safeStep];
  const isLast = steps.length > 0 && safeStep >= steps.length - 1;

  const measure = useCallback(() => {
    if (!open || steps.length === 0 || !current) return;
    const el = document.querySelector(current.selector);
    if (!el) {
      setRect(null);
      return;
    }
    const pad = current.inflate ?? 8;
    const r = el.getBoundingClientRect();
    const rawLeft = r.left - pad;
    const rawTop = r.top - pad;
    const rawRight = r.left + r.width + pad;
    const rawBottom = r.top + r.height + pad;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(0, rawLeft);
    const top = Math.max(0, rawTop);
    const right = Math.min(vw, rawRight);
    const bottom = Math.min(vh, rawBottom);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    if (width < 1 || height < 1) {
      setRect(null);
      return;
    }
    setRect({ top, left, width, height });
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    } catch {
      /* ignore */
    }
  }, [open, current, steps.length]);

  useLayoutEffect(() => {
    measure();
  }, [measure, safeStep]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setRect(null);
      return;
    }
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const el = current ? document.querySelector(current.selector) : null;
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && el) {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }
    const id = window.setInterval(measure, 400);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      ro?.disconnect();
      window.clearInterval(id);
    };
  }, [open, measure, current]);

  useLayoutEffect(() => {
    if (!open) return;
    if (!rect) {
      setBubbleTop(Math.max(24, window.innerHeight * 0.18));
      return;
    }
    const margin = 12;
    const bubbleH = 200;
    const spaceBelow = window.innerHeight - rect.top - rect.height - bottomInsetPx;
    const preferBelow = spaceBelow > bubbleH + margin;
    const top = preferBelow
      ? clamp(rect.top + rect.height + margin, margin, window.innerHeight - bubbleH - margin - bottomInsetPx)
      : clamp(rect.top - bubbleH - margin, margin, window.innerHeight - bubbleH - margin - bottomInsetPx);
    setBubbleTop(top);
  }, [open, rect, bottomInsetPx]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
      onClose();
      setStep(0);
      return;
    }
    setStep((s) => s + 1);
  }, [isLast, onComplete, onClose]);

  const handleSkip = useCallback(() => {
    onComplete();
    onClose();
    setStep(0);
  }, [onComplete, onClose]);

  const spotlightStyle = useMemo(() => {
    if (!rect) return undefined;
    const radius = 14;
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: radius,
      boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)',
    } as const;
  }, [rect]);

  if (steps.length === 0) return null;

  /** Portal 到 body：避免被 AppShell 里 main 的 z-1 压住，底栏 TabBar (z-50) 仍能点到 */
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="product-tour"
          className="fixed inset-0 z-[240] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-tour-title"
        >
          {/* 捕获点击，防止误触下层 */}
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-transparent"
            aria-label="Tour overlay"
            onClick={(e) => e.stopPropagation()}
          />

          {spotlightStyle ? (
            <div
              className="pointer-events-none fixed z-[241] border-2 border-white/35"
              style={spotlightStyle}
            />
          ) : (
            <div className="pointer-events-none fixed inset-0 z-[241] bg-slate-950/70" />
          )}

          <div
            className="pointer-events-none fixed inset-x-0 z-[242] px-4"
            style={{
              top: bubbleTop,
              paddingBottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom, 0px))`,
            }}
          >
            <motion.div
              key={safeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto mx-auto max-w-[min(100%,360px)] rounded-2xl border border-white/20 bg-[#1a1a2e]/95 p-4 text-left shadow-2xl backdrop-blur-xl"
            >
              <h2 id="product-tour-title" className="text-base font-semibold text-white">
                {current?.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cc-muted">{current?.body}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[11px] text-cc-muted tabular-nums">
                  {safeStep + 1} / {steps.length}
                </span>
                <div className="flex items-center gap-2">
                  {!isLast ? (
                    <button
                      type="button"
                      className="rounded-xl px-3 py-2 text-xs font-medium text-cc-muted hover:bg-white/10"
                      aria-label="Skip the rest of this guide"
                      onClick={handleSkip}
                    >
                      Skip tour
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-xl bg-cc-accent px-4 py-2 text-xs font-semibold text-white shadow-md active:scale-[0.98]"
                    onClick={handleNext}
                  >
                    {isLast ? 'Done' : 'Next'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
