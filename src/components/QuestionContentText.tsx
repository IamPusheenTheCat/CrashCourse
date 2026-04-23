import { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const TAG_RE = /<([A-Za-z][A-Za-z0-9_]*)>/g;

/** 与 `public/question-signs/<Tag>.png` 文件名一致 */
const SIGN_IMAGE_TAGS = new Set([
  'SchoolSign',
  'BlackCrossSymbol',
  'PavementEndsSign',
  'StopSign',
]);

const SIGN_ALT: Record<string, string> = {
  SchoolSign: 'School zone warning sign',
  BlackCrossSymbol: 'Crossroad warning sign',
  PavementEndsSign: 'Pavement ends warning sign',
  StopSign: 'Stop ahead warning sign',
};

function signImageSrc(tag: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}question-signs/${encodeURIComponent(tag)}.png`;
}

type Part =
  | { kind: 'text'; text: string }
  | { kind: 'img'; tag: string; src: string; alt: string };

export function parseQuestionContentToParts(content: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(content)) !== null) {
    if (m.index > last) {
      parts.push({ kind: 'text', text: content.slice(last, m.index) });
    }
    const tag = m[1]!;
    const full = m[0];
    if (SIGN_IMAGE_TAGS.has(tag)) {
      parts.push({
        kind: 'img',
        tag,
        src: signImageSrc(tag),
        alt: SIGN_ALT[tag] ?? `${tag} (road sign)`,
      });
    } else {
      parts.push({ kind: 'text', text: full });
    }
    last = m.index + full.length;
  }
  if (last < content.length) {
    parts.push({ kind: 'text', text: content.slice(last) });
  }

  // 题库若写成 `<Tag>word` 无空格，在图标与英文之间补极细间隔，避免贴字
  for (let i = 0; i < parts.length - 1; i++) {
    const a = parts[i];
    const b = parts[i + 1];
    if (a?.kind === 'img' && b?.kind === 'text' && b.text.length > 0) {
      const c0 = b.text[0]!;
      if (/[A-Za-z]/.test(c0)) {
        parts[i + 1] = { kind: 'text', text: `\u2009${b.text}` };
      }
    }
  }

  return parts;
}

/** 题干内略放大；点击全屏看清标志上的字，且避免触发卡片拖拽 */
function SignImageEnlargeable({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        className="inline-flex max-w-[min(90vw,13.5rem)] shrink-0 cursor-zoom-in align-middle rounded-md border-0 bg-transparent p-0 mx-0.5 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label={`${alt} — tap to view larger`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="pointer-events-none h-[3.35rem] w-auto max-h-[3.5rem] max-w-full object-contain select-none drop-shadow-md"
        />
      </button>
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[240] flex items-center justify-center bg-black/82 p-5 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={close}
            >
              <div
                className="relative max-h-[min(86vh,40rem)] max-w-[min(94vw,28rem)]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[min(86vh,40rem)] max-w-full rounded-xl object-contain shadow-2xl"
                />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/75 text-lg text-white shadow-lg backdrop-blur-md active:scale-95"
                  aria-label="Close"
                  onClick={close}
                >
                  <i className="fas fa-times" aria-hidden />
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

interface QuestionContentTextProps {
  content: string;
  className?: string;
}

/**
 * 题干中的 `<SchoolSign>` 等占位符替换为内联路标图；未知标签原样显示。
 */
export default function QuestionContentText({ content, className }: QuestionContentTextProps) {
  const parts = useMemo(() => parseQuestionContentToParts(content), [content]);

  const flowClass = [className, '[overflow-wrap:anywhere] break-words'].filter(Boolean).join(' ');

  return (
    <p className={flowClass}>
      {parts.map((p, i) => {
        if (p.kind === 'text') {
          if (!p.text) return null;
          return <span key={i}>{p.text}</span>;
        }
        return <SignImageEnlargeable key={i} src={p.src} alt={p.alt} />;
      })}
    </p>
  );
}
