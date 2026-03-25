import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import assignmentService, {
  type GradeSubmissionPayload,
  type Submission,
} from "../../../services/assignments/assignmentService";
import SubmissionPanel from "../../../components/Assignment/SubmissionPanel";
import { SubmissionStatusBadge } from "../../../components/Assignment/StatusBadge";

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

   return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold md:text-3xl">Cham bai tap</h1>
          <p className="mt-1 text-sm text-blue-100">Theo doi bai nop, cham diem va gui nhan xet cho hoc vien.</p>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Danh sach bai nop</h2>
            {loading && <div className="mt-3 text-sm text-slate-600">Dang tai...</div>}
            {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {!loading && items.length === 0 && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                Chua co bai nop.
              </div>
            )}

            <div className="mt-3 space-y-2" aria-label="Danh sach hoc vien nop bai">
              {items.map((item) => (
                <button
                  key={item.submissionId}
                  onClick={() => selectSubmission(item)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected?.submissionId === item.submissionId
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">{item.studentName}</div>
                    <SubmissionStatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Lan nop: {item.attemptNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.submittedAt).toLocaleString("vi-VN")}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4 lg:col-span-2">
            {!selected && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-sm">
                Chon bai nop de cham diem.
              </div>
            )}

            {selected && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Cham bai: {selected.studentName}</h2>
                  <p className="mt-1 text-sm text-slate-600">Tong diem tam tinh: {totalScore}</p>
                </div>

                <SubmissionPanel
                  submission={selected}
                  editable
                  scores={scores}
                  feedbacks={feedbacks}
                  onScoreChange={(answerId, score) => {
                    setScores((prev) => ({ ...prev, [answerId]: score }));
                  }}
                  onFeedbackChange={(answerId, feedback) => {
                    setFeedbacks((prev) => ({ ...prev, [answerId]: feedback }));
                  }}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nhan xet tong ket</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhan xet tong ket"
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    rows={3}
                  />

                  <div className="mt-3 flex items-center justify-end">
                    <button
                      disabled={saving}
                      onClick={handleGrade}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Dang luu..." : "Luu diem"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default TeacherSubmissionPage;


