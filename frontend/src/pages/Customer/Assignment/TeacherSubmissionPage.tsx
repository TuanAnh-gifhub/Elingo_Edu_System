import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import assignmentService, {
  type GradeSubmissionPayload,
  type Submission,
} from "../../../services/assignments/assignmentService";

const TeacherSubmissionPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [items, setItems] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await assignmentService.getSubmissionsByAssignment(assignmentId, 1, 30);
      const sorted = [...(data.data || [])].sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        if (a.status === "IN_REVIEW") return -1;
        if (b.status === "IN_REVIEW") return 1;
        return 0;
      });
      setItems(sorted);
      if (sorted.length > 0) {
        selectSubmission(sorted[0]);
      }
    } catch (e) {
      console.error(e);
      setError("Khong the tai danh sach bai nop");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const selectSubmission = (submission: Submission) => {
    setSelected(submission);
    setTeacherFeedback(submission.teacherFeedback || "");
    setScores(
      Object.fromEntries(
        submission.answers.map((answer) => [answer.answerId, Number(answer.score ?? 0)]),
      ),
    );
    setFeedbacks(
      Object.fromEntries(submission.answers.map((answer) => [answer.answerId, answer.feedback || ""])),
    );
  };

  const totalScore = useMemo(() => {
    if (!selected) return 0;
    return selected.answers.reduce(
      (sum, answer) => sum + Number(scores[answer.answerId] ?? 0),
      0,
    );
  }, [selected, scores]);

  const handleGrade = async () => {
    if (!selected) return;

    const payload: GradeSubmissionPayload = {
      teacherFeedback,
      answers: selected.answers.map((answer) => ({
        answerId: answer.answerId,
        score: Number(scores[answer.answerId] ?? 0),
        feedback: feedbacks[answer.answerId] || undefined,
      })),
    };

    setSaving(true);
    try {
      const updated = await assignmentService.gradeSubmission(selected.submissionId, payload);
      setSelected(updated);
      await loadSubmissions();
    } catch (e) {
      console.error(e);
      setError("Cham diem that bai");
    } finally {
      setSaving(false);
    }
  };

  if (!assignmentId) return <div className="p-6">Thieu assignmentId</div>;

  const formatSelectedOptions = (indexes?: number[], fallback?: number) => {
    const resolved = indexes && indexes.length > 0
      ? indexes
      : fallback !== undefined
        ? [fallback]
        : [];

    if (resolved.length === 0) return null;
    return resolved
      .slice()
      .sort((a, b) => a - b)
      .map((item) => item + 1)
      .join(", ");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="border rounded p-4 bg-white shadow-sm space-y-2">
        <h1 className="text-xl font-bold">Danh sach bai nop</h1>
        {loading && <div>Dang tai...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && items.length === 0 && <div>Chua co bai nop.</div>}

        {items.map((item) => (
          <button
            key={item.submissionId}
            onClick={() => selectSubmission(item)}
            className={`w-full text-left border rounded p-3 ${
              selected?.submissionId === item.submissionId ? "border-blue-600" : ""
            }`}
          >
            <div className="font-semibold">{item.studentName}</div>
            <div className="text-sm">Lan nop: {item.attemptNumber}</div>
            <div className="text-sm">{item.status}</div>
            <div className="text-sm">{new Date(item.submittedAt).toLocaleString("vi-VN")}</div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 border rounded p-4 bg-white shadow-sm space-y-3">
        {!selected && <div>Chon bai nop de cham diem.</div>}

        {selected && (
          <>
            <h2 className="text-lg font-bold">Cham bai: {selected.studentName}</h2>

            {selected.answers.map((answer) => (
              <div key={answer.answerId} className="border rounded p-3 space-y-2">
                <div className="font-semibold">
                  Cau {answer.questionOrder}: {answer.questionContent}
                </div>
                {answer.answerText && <div>Tra loi: {answer.answerText}</div>}
                {formatSelectedOptions(answer.selectedOptionIndexes, answer.selectedOptionIndex) && (
                  <div>Lua chon: {formatSelectedOptions(answer.selectedOptionIndexes, answer.selectedOptionIndex)}</div>
                )}
                {answer.audioUrl && (
                  <div className="space-y-2">
                    <audio controls src={answer.audioUrl} />
                    <div className="text-sm">Transcript: {answer.transcriptText || "(none)"}</div>
                  </div>
                )}

                <input
                  type="number"
                  className="border rounded px-3 py-2"
                  value={scores[answer.answerId] ?? 0}
                  disabled={answer.autoGraded}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [answer.answerId]: Number(e.target.value),
                    }))
                  }
                />
                {answer.autoGraded && (
                  <div className="text-xs text-blue-600">
                    Cau nay da duoc cham tu dong (trac nghiem).
                  </div>
                )}

                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Feedback tung cau"
                  value={feedbacks[answer.answerId] || ""}
                  onChange={(e) =>
                    setFeedbacks((prev) => ({
                      ...prev,
                      [answer.answerId]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}

            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Nhan xet tong ket"
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <div>Tong diem tam tinh: {totalScore}</div>
              <button
                disabled={saving}
                onClick={handleGrade}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
              >
                {saving ? "Dang luu..." : "Luu diem"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherSubmissionPage;


