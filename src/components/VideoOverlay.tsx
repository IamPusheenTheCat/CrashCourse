import { useRef, useEffect, useState, useCallback } from 'react';
import PrimaryButton from './ui/PrimaryButton';

/** 正确/错误反馈统一时长（ms）：Correct 停留、overlay 淡入淡出、抖动到打开视频的延迟 */
export const FEEDBACK_DURATION_MS = 320;

const fadeTransition = `opacity ${FEEDBACK_DURATION_MS}ms ease-out`;

interface Props {
  videoSrc: string;
  /** 解析/正确答案等，仅用于无障碍（不再显示顶部 Warning 条） */
  label?: string;
  onContinue: () => void;
  /** 为 true 时不响应 Enter/Space（例如上层仍有 product tour，须先点 Done） */
  suppressContinueKeyboard?: boolean;
}

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

/** 错误反馈全屏：单 video 预加载，就绪后淡入并播放；Continue 立即回调（由上层在换题完成后再卸 overlay，避免内层淡出 + 实色底造成「全屏灭一下」）。 */
export default function VideoOverlay({
  videoSrc,
  label,
  onContinue,
  suppressContinueKeyboard = false,
}: Props) {
  const trimmedLabel = label?.trim() ?? '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const continueOnceRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setIsReady(false);
    setClosing(false);
    continueOnceRef.current = false;
  }, [videoSrc]);

  useEffect(() => {
    if (!isReady) return;
    const v = videoRef.current;
    if (!v) return;
    v.loop = true;
    const onEnded = () => {
      /** 少数环境 `loop` 属性不可靠，播完停在最后一帧；手动重头播 */
      try {
        v.currentTime = 0;
        void v.play();
      } catch {
        /* ignore */
      }
    };
    v.addEventListener('ended', onEnded);
    v.muted = true;
    void v
      .play()
      .then(() => {
        v.muted = false;
      })
      .catch(() => {});
    return () => v.removeEventListener('ended', onEnded);
  }, [isReady]);

  const handleContinue = useCallback(() => {
    if (closing || continueOnceRef.current) return;
    continueOnceRef.current = true;
    setClosing(true);
    onContinue();
  }, [closing, onContinue]);

  useEffect(() => {
    if (!isReady || closing || suppressContinueKeyboard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
      handleContinue();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isReady, closing, suppressContinueKeyboard, handleContinue]);

  const dialogAriaLabel = trimmedLabel
    ? `Wrong answer: ${trimmedLabel}`
    : 'Wrong answer: review the video, then tap Continue';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-cc-surface"
      role="dialog"
      aria-modal="true"
      aria-label={dialogAriaLabel}
    >
      {/* 不在此做整层淡出：淡出时只剩实色底，会像全屏黑/闪一下；卸 overlay 时机交给上层 */}
      <div className="absolute inset-0 flex flex-col">
      {/* 预加载后淡入：同一元素先 load，loadeddata 后再显示并 play */}
      <div
        className="absolute inset-0"
        style={{ opacity: isReady ? 1 : 0, transition: fadeTransition }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          loop
          preload="auto"
          src={videoSrc}
          onLoadedMetadata={isIOS ? () => setIsReady(true) : undefined}
          onLoadedData={!isIOS ? () => setIsReady(true) : undefined}
          style={{ visibility: isReady ? 'visible' : 'hidden' }}
        />
      </div>
      {!isReady && (
        <div className="absolute inset-0 bg-cc-surface" aria-hidden />
      )}

      {/* 底部按钮：product tour 锚在按钮上，不把外层 safe-area padding 算进高亮 */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-5"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
          opacity: isReady ? 1 : 0,
          transition: fadeTransition,
        }}
      >
        <PrimaryButton
          data-product-tour="quiz-wrong-continue"
          variant="accent"
          onClick={handleContinue}
          disabled={closing}
          className="h-14 rounded-2xl py-0 text-lg shadow-md"
        >
          I Understand, Continue
        </PrimaryButton>
      </div>
      </div>
    </div>
  );
}
