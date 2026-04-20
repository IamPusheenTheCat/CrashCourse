/** 与 GET /questions/get_detail 对齐，供答题 UI 使用 */
export interface QuizQuestion {
  question_id: number;
  content: string;
  type: string;
  options: { id: string; text: string }[];
  status: {
    is_favorited: boolean;
    is_mistake: boolean;
  };
}

export interface SubmitAnswerResult {
  is_correct: boolean;
  correct_option: string;
  warning_video_url: string | null;
  explanation: string;
}
