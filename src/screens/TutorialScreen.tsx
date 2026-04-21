import { useState, useRef, useCallback, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { TUTORIAL_SLIDES, getTutorialVideoUrl } from '../data/tutorialSlides';
import { markGuestTutorialIntroDone } from '../constants/storageKeys';
import { TUTORIAL_LOGIN_FOOTNOTE } from '../constants/authCopy';
import PrimaryButton from '../components/ui/PrimaryButton';
import './TutorialScreen.css';

const SLIDES = TUTORIAL_SLIDES;

export default function TutorialScreen() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const didEmitFirstFramePlayingRef = useRef(false);
  const startXRef = useRef(0);
  const moveXRef = useRef(0);
  const draggingRef = useRef(false);

  const goTo = useCallback((index: number) => {
    let next = index;
    if (next < 0) next = SLIDES.length - 1;
    if (next >= SLIDES.length) next = 0;
    setCurrent(next);
  }, []);

  // 当前页自动播放
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current]);

  // 第一个视频开始播放时派发事件，App 再隐藏 Splash
  const onFirstVideoCanPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (current === 0) v.play().catch(() => {});
  }, [current]);
  const onFirstVideoPlaying = useCallback(() => {
    if (didEmitFirstFramePlayingRef.current) return;
    didEmitFirstFramePlayingRef.current = true;
    window.dispatchEvent(new CustomEvent('tutorial-first-frame-playing'));
  }, []);

  const SWIPE_THRESHOLD = 40;
  const handlePointerStart = useCallback((clientX: number) => {
    startXRef.current = clientX;
    draggingRef.current = true;
    moveXRef.current = 0;
  }, []);
  const handlePointerMove = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    moveXRef.current = clientX - startXRef.current;
  }, []);
  const handlePointerEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const dx = moveXRef.current;
    moveXRef.current = 0;
    if (dx < -SWIPE_THRESHOLD) goTo(current + 1);
    else if (dx > SWIPE_THRESHOLD) goTo(current - 1);
  }, [current, goTo]);

  const onTouchStart = (e: React.TouchEvent) => handlePointerStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handlePointerMove(e.touches[0].clientX);
  const onTouchEnd = handlePointerEnd;
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handlePointerStart(e.clientX); };
  const onMouseMove = (e: React.MouseEvent) => handlePointerMove(e.clientX);
  const onMouseUp = handlePointerEnd;

  if (isAuthenticated) {
    return <Navigate to="/menu" replace />;
  }

  return (
    <div className="tutorial-page -mx-5 px-0 flex flex-col items-center justify-center min-h-[calc(100dvh-44px)]"
      style={{ gap: 0 }}
    >
      <div className="carousel-wrapper">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${current * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { draggingRef.current = false; }}
        >
          {SLIDES.map((slide, i) => (
            <div key={i} className="carousel-slide">
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={getTutorialVideoUrl(slide.video)}
                muted
                playsInline
                loop
                preload="auto"
                autoPlay={i === 0}
                onCanPlay={i === 0 ? onFirstVideoCanPlay : undefined}
                onPlaying={i === 0 ? onFirstVideoPlaying : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="dot-indicators" role="tablist" aria-label="Tutorial slides">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div className="slide-description">
        <h3>{SLIDES[current].title}</h3>
        <p>{SLIDES[current].desc}</p>
      </div>

      <div className="flex flex-col items-center px-6 mt-4 w-full">
        <PrimaryButton
          variant="accent"
          className="max-w-[280px]"
          icon={<i className="fas fa-sign-in-alt" aria-hidden />}
          onClick={() => {
            markGuestTutorialIntroDone();
            navigate('/login');
          }}
        >
          Login
        </PrimaryButton>
        <p className="text-cc-muted text-xs mt-3 text-center max-w-[280px] leading-relaxed">
          {TUTORIAL_LOGIN_FOOTNOTE}
        </p>
      </div>
    </div>
  );
}
