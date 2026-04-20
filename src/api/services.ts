import { apiRequest, type ApiEnvelope } from './client';

export interface LoginData {
  token: string;
  user_id: number;
}

/** 后端实际返回 access_token；接口文档示例为 token — 两者都认 */
type LoginEnvelopeData = {
  user_id: number;
  token?: string;
  access_token?: string;
  refresh_token?: string;
};

export async function loginOrRegister(email: string, password: string): Promise<LoginData> {
  const res = await apiRequest<ApiEnvelope<LoginEnvelopeData>>('/auth/login_or_register', {
    method: 'POST',
    json: { email, password },
  });
  if (res.code !== 200 || !res.data) {
    throw new Error(res.msg || 'Login failed');
  }
  const token = res.data.access_token ?? res.data.token;
  if (!token) {
    throw new Error(res.msg || 'Login failed: no access token in response');
  }
  return { token, user_id: res.data.user_id };
}

export async function logout(): Promise<void> {
  const res = await apiRequest<ApiEnvelope<unknown>>('/auth/logout', {
    method: 'POST',
  });
  if (res.code !== 200) {
    throw new Error(res.msg || 'Logout failed');
  }
}

export interface QuestionDetail {
  question_id: number;
  content: string;
  type: string;
  options: { id: string; text: string }[];
  status: {
    is_favorited: boolean;
    is_mistake: boolean;
  };
}

export async function getNextQuestion(): Promise<QuestionDetail> {
  const res = await apiRequest<ApiEnvelope<QuestionDetail>>('/questions/get_next', {
    method: 'GET',
  });
  if (res.code !== 200 || !res.data) {
    const m = res.msg?.trim();
    const vague = !m || m.toLowerCase() === 'success';
    throw new Error(vague ? 'No question available' : m);
  }
  return res.data;
}

export async function getQuestionDetail(questionId: number): Promise<QuestionDetail> {
  const res = await apiRequest<ApiEnvelope<QuestionDetail>>(
    `/questions/get_detail?question_id=${encodeURIComponent(String(questionId))}`,
    { method: 'GET' },
  );
  if (res.code !== 200 || !res.data) {
    throw new Error(res.msg || 'Failed to load question');
  }
  return res.data;
}

export interface SubmitAnswerData {
  is_correct: boolean;
  correct_option: string;
  warning_video_url?: string | null;
  explanation?: string;
}

export async function submitAnswer(questionId: number, selectedOption: string): Promise<SubmitAnswerData> {
  const res = await apiRequest<ApiEnvelope<SubmitAnswerData>>('/questions/submit_answer', {
    method: 'POST',
    json: { question_id: questionId, selected_option: selectedOption },
  });
  if (res.code !== 200 || !res.data) {
    throw new Error(res.msg || 'Submit failed');
  }
  return res.data;
}

export async function addFavorite(questionId: number): Promise<void> {
  const res = await apiRequest<ApiEnvelope<unknown>>('/favorites/add_favorite', {
    method: 'POST',
    json: { question_id: questionId },
  });
  if (res.code !== 200) {
    throw new Error(res.msg || 'Favorite failed');
  }
}

export async function delFavorite(questionId: number): Promise<void> {
  const res = await apiRequest<ApiEnvelope<unknown>>('/favorites/del_favorite', {
    method: 'POST',
    json: { question_id: questionId },
  });
  if (res.code !== 200) {
    throw new Error(res.msg || 'Unfavorite failed');
  }
}

export interface FavoriteListItem {
  question_id: number;
  content_preview: string;
}

export interface PagedList {
  total: number;
  list: FavoriteListItem[];
}

export async function getFavoriteList(page = 1, size = 50): Promise<PagedList> {
  const res = await apiRequest<ApiEnvelope<PagedList>>(
    `/favorites/get_list?page=${page}&size=${size}`,
    { method: 'GET' },
  );
  if (res.code !== 200 || !res.data) {
    throw new Error(res.msg || 'Failed to load favorites');
  }
  return res.data;
}

export async function getMistakeList(page = 1, size = 50): Promise<PagedList> {
  const res = await apiRequest<ApiEnvelope<PagedList>>(
    `/mistakes/get_list?page=${page}&size=${size}`,
    { method: 'GET' },
  );
  if (res.code !== 200 || !res.data) {
    throw new Error(res.msg || 'Failed to load mistakes');
  }
  return res.data;
}

const REVIEW_LIST_PAGE_SIZE = 200;
/** 防止异常 total 导致死循环；200×250 = 最多 5 万条 id */
const REVIEW_LIST_MAX_PAGES = 250;

async function collectAllPagedQuestionIds(
  fetchPage: (page: number, size: number) => Promise<PagedList>,
): Promise<number[]> {
  const ids: number[] = [];
  let reportedTotal = Infinity;
  for (let page = 1; page <= REVIEW_LIST_MAX_PAGES; page++) {
    const data = await fetchPage(page, REVIEW_LIST_PAGE_SIZE);
    if (page === 1) reportedTotal = data.total;
    ids.push(...data.list.map((x) => x.question_id));
    if (data.list.length === 0) break;
    if (ids.length >= reportedTotal) break;
  }
  return ids;
}

/** 拉取错题本全部分页，合并为题目 id 列表（顺序与接口分页一致） */
export async function fetchAllMistakeQuestionIds(): Promise<number[]> {
  return collectAllPagedQuestionIds(getMistakeList);
}

/** 拉取收藏列表全部分页，合并为题目 id 列表 */
export async function fetchAllFavoriteQuestionIds(): Promise<number[]> {
  return collectAllPagedQuestionIds(getFavoriteList);
}

export async function delMistake(questionId: number): Promise<void> {
  const res = await apiRequest<ApiEnvelope<unknown>>('/mistakes/del_mistake', {
    method: 'POST',
    json: { question_id: questionId },
  });
  if (res.code !== 200) {
    throw new Error(res.msg || 'Failed to remove mistake');
  }
}

export interface StatsSummary {
  total_answered: number;
  correct_count: number;
  incorrect_count: number;
  favorite_count: number;
  learning_progress: number;
}

export async function getStatsSummary(): Promise<StatsSummary> {
  const res = await apiRequest<ApiEnvelope<StatsSummary>>('/stats/get_summary', {
    method: 'GET',
  });
  if (res.code !== 200 || !res.data) {
    throw new Error(res.msg || 'Failed to load stats');
  }
  return res.data;
}
