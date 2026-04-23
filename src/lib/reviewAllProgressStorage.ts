import { readPersistedAuthField } from '../api/client';

const STORAGE_KEY = 'crashcourse-review-all-v1';
const USER_ID_KEY = 'crashcourse-user-id';

export type ReviewAllPersistSlot = {
  reviewIds: number[];
  reviewIndex: number;
};

type StoredV1 = {
  v: 1;
  userId: number;
  list: ReviewAllPersistSlot | null;
  rand: ReviewAllPersistSlot | null;
};

function readPersistedUserId(): number | null {
  const v = readPersistedAuthField(USER_ID_KEY);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function readStored(): StoredV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw.length === 0) return null;
    const o = JSON.parse(raw) as unknown;
    if (o == null || typeof o !== 'object') return null;
    const rec = o as Record<string, unknown>;
    if (rec.v !== 1 || typeof rec.userId !== 'number') return null;
    return rec as StoredV1;
  } catch {
    return null;
  }
}

function writeStored(s: StoredV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
}

/** 与当前活跃题库是否为同一批题（忽略顺序） */
export function reviewIdMultisetEquals(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

export function loadReviewAllSlot(randomOrder: boolean): ReviewAllPersistSlot | null {
  const userId = readPersistedUserId();
  if (userId == null) return null;
  const s = readStored();
  if (s == null || s.userId !== userId) return null;
  const slot = randomOrder ? s.rand : s.list;
  if (slot == null || !Array.isArray(slot.reviewIds) || slot.reviewIds.length === 0) return null;
  const idx = typeof slot.reviewIndex === 'number' ? slot.reviewIndex : 0;
  if (!Number.isFinite(idx) || idx < 0) return null;
  return { reviewIds: slot.reviewIds.map((x) => Number(x)).filter((n) => Number.isFinite(n)), reviewIndex: idx };
}

export function saveReviewAllSlot(randomOrder: boolean, slot: ReviewAllPersistSlot): void {
  const userId = readPersistedUserId();
  if (userId == null) return;
  if (slot.reviewIds.length === 0) return;
  let s = readStored();
  if (s == null || s.userId !== userId) {
    s = { v: 1, userId, list: null, rand: null };
  }
  if (randomOrder) s.rand = { reviewIds: [...slot.reviewIds], reviewIndex: slot.reviewIndex };
  else s.list = { reviewIds: [...slot.reviewIds], reviewIndex: slot.reviewIndex };
  writeStored(s);
}

export function clearReviewAllSlot(randomOrder: boolean): void {
  const userId = readPersistedUserId();
  if (userId == null) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* */
    }
    return;
  }
  const s = readStored();
  if (s == null || s.userId !== userId) return;
  if (randomOrder) s.rand = null;
  else s.list = null;
  if (s.list == null && s.rand == null) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* */
    }
  } else {
    writeStored(s);
  }
}

export function clearAllReviewAllProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* */
  }
}
