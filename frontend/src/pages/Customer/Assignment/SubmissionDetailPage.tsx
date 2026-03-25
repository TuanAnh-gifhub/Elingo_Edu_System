import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import assignmentService, {
  type Submission,
} from "../../../services/assignments/assignmentService";
import SubmissionPanel from "../../../components/Assignment/SubmissionPanel";
import { SubmissionStatusBadge } from "../../../components/Assignment/StatusBadge";

const SubmissionDetailPage = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await assignmentService.getSubmission(submissionId);
        setSubmission(data);
      } catch (e) {
        console.error(e);
        setError("Khong the tai ket qua nop bai");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [submissionId]);

  if (!submissionId) return <div className="p-6">Thieu submissionId</div>;
  if (loading) return <div className="p-6">Dang tai...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!submission) return <div className="p-6">Khong tim thay bai nop</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold md:text-3xl">Ket qua bai nop</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SubmissionStatusBadge status={submission.status} />
            <span className="text-sm text-blue-100">Lan nop: {submission.attemptNumber}</span>
            <span className="text-sm text-blue-100">Tong diem: {submission.totalScore ?? "Dang cham"}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Nop luc: {new Date(submission.submittedAt).toLocaleString("vi-VN")}</div>
          {submission.teacherFeedback && (
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Nhan xet GV: {submission.teacherFeedback}
            </div>
          )}
        </section>

        <SubmissionPanel submission={submission} editable={false} />
      </div>
    </main>
  );
};

export default SubmissionDetailPage;

