import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import assignmentService, {
  type Submission,
} from "../../../services/assignments/assignmentService";

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
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Ket qua bai nop</h1>
      <div className="border rounded p-4 bg-white shadow-sm space-y-2">
        <div>Lan nop: <b>{submission.attemptNumber}</b></div>
        <div>Trang thai: <b>{submission.status}</b></div>
        <div>Tong diem: <b>{submission.totalScore ?? "Dang cham"}</b></div>
        <div>Nop luc: {new Date(submission.submittedAt).toLocaleString("vi-VN")}</div>
        {submission.teacherFeedback && (
          <div className="text-gray-700">Nhan xet GV: {submission.teacherFeedback}</div>
        )}
      </div>

      <div className="space-y-3">
        {submission.answers.map((answer) => (
          <div key={answer.answerId} className="border rounded p-4 bg-white shadow-sm">
            <div className="font-semibold">Cau {answer.questionOrder}: {answer.questionContent}</div>
            {answer.answerText && <div className="mt-2">Tra loi: {answer.answerText}</div>}
            {formatSelectedOptions(answer.selectedOptionIndexes, answer.selectedOptionIndex) && (
              <div className="mt-2">Lua chon: {formatSelectedOptions(answer.selectedOptionIndexes, answer.selectedOptionIndex)}</div>
            )}
            {answer.audioUrl && (
              <div className="mt-2 space-y-2">
                <audio controls src={answer.audioUrl} />
                <div className="text-sm">Transcript: {answer.transcriptText || "(none)"}</div>
              </div>
            )}
            <div className="mt-2">Diem: {answer.score ?? "Dang cham"}</div>
            {answer.feedback && <div className="text-sm text-gray-700">Feedback: {answer.feedback}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionDetailPage;

