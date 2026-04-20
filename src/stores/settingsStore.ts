import { create } from 'zustand';

const SOUND_EFFECTS_KEY = 'crashcourse-sound-effects';
const VIDEO_WARNING_KEY = 'crashcourse-video-autoplay-on-wrong';
const DAILY_REMINDER_KEY = 'crashcourse-daily-reminder';

function readBool(key: string, defaultWhenMissing: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultWhenMissing;
    return v !== '0';
  } catch {
    return defaultWhenMissing;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* private mode */
  }
}

interface SettingsState {
  /** 音效/震动（占位：持久化；业务侧尚未读取） */
  soundEffects: boolean;
  setSoundEffects: (value: boolean) => void;
  /** true：答错且有时显示全屏警示视频；false：跳过视频，抖动后直接下一题 */
  videoAutoplayOnWrong: boolean;
  setVideoAutoplayOnWrong: (value: boolean) => void;
  /** 每日提醒（占位：持久化；尚未接通知） */
  dailyReminder: boolean;
  setDailyReminder: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEffects: readBool(SOUND_EFFECTS_KEY, true),
  setSoundEffects: (value) => {
    writeBool(SOUND_EFFECTS_KEY, value);
    set({ soundEffects: value });
  },
  videoAutoplayOnWrong: readBool(VIDEO_WARNING_KEY, true),
  setVideoAutoplayOnWrong: (value) => {
    writeBool(VIDEO_WARNING_KEY, value);
    set({ videoAutoplayOnWrong: value });
  },
  dailyReminder: readBool(DAILY_REMINDER_KEY, false),
  setDailyReminder: (value) => {
    writeBool(DAILY_REMINDER_KEY, value);
    set({ dailyReminder: value });
  },
}));
