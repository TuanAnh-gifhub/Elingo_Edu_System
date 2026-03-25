import type { Submission } from "../../services/assignments/assignmentService";
import { SubmissionStatusBadge } from "./StatusBadge";

type SubmissionPanelProps = {
  submission: Submission;
  editable?: boolean;
  scores?: Record<string, number>;
  feedbacks?: Record<string, string>;
  onScoreChange?: (answerId: string, score: number) => void;
  onFeedbackChange?: (answerId: string, feedback: string) => void;
};

const formatSelectedOptions = (indexes?: number[], fallback?: number) => {
  const resolved = indexes && indexes.length > 0 ? indexes : fallback !== undefined ? [fallback] : [];
  if (resolved.length === 0) return null;

  return resolved
    .slice()
    .sort((a, b) => a - b)
    .map((item) => item + 1)
    .join(", ");
};

const SubmissionPanel = ({
  submission,
  editable = false,
  scores = {},
  feedbacks = {},
  onScoreChange,
  onFeedbackChange,
}: SubmissionPanelProps) => {
  return (
    <section className="space-y-4" aria-label="Chi tiet bai nop">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <SubmissionStatusBadge status={submission.status} />
          <span className="text-sm text-slate-600">Lan nop: {submission.attemptNumber}</span>
          <span className="text-sm text-slate-600">Tong diem: {submission.totalScore ?? "Dang cham"}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">Nop luc: {new Date(submission.submittedAt).toLocaleString("vi-VN")}</p>
      </div>

      {submission.answers.map((answer) => {
        const selectedText = formatSelectedOptions(answer.selectedOptionIndexes, answer.selectedOptionIndex);
        const currentScore = scores[answer.answerId] ?? Number(answer.score ?? 0);
        const currentFeedback = feedbacks[answer.answerId] ?? answer.feedback ?? "";

        return (
          <article key={answer.answerId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              Cau {answer.questionOrder}: {answer.questionContent}
            </h3>

            {answer.answerText && <p className="mt-2 text-sm text-slate-700">Tra loi: {answer.answerText}</p>}
            {selectedText && <p className="mt-2 text-sm text-slate-700">Lua chon: {selectedText}</p>}

            {answer.audioUrl && (
              <div className="mt-2 space-y-2">
                <audio controls src={answer.audioUrl} className="w-full" />
                <p className="text-sm text-slate-700">Transcript: {answer.transcriptText || "(none)"}</p>
              </div>
            )}

            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor={`score-${answer.answerId}`}>
                Diem
              </label>
              <input
                id={`score-${answer.answerId}`}
                type="number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                value={currentScore}
                disabled={!editable || answer.autoGraded}
                onChange={(e) => onScoreChange?.(answer.answerId, Number(e.target.value))}
              />
              {answer.autoGraded && (
                <p className="text-xs text-blue-600">Cau nay da duoc cham tu dong (trac nghiem).</p>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor={`feedback-${answer.answerId}`}>
                Nhan xet tung cau
              </label>
              <textarea
                id={`feedback-${answer.answerId}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={currentFeedback}
                onChange={(e) => onFeedbackChange?.(answer.answerId, e.target.value)}
                rows={2}
                readOnly={!editable}
              />
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default SubmissionPanel;

