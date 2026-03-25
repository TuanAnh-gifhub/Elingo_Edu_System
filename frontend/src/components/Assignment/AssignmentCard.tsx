import { Link } from "react-router-dom";
import type { Assignment, Submission } from "../../services/assignments/assignmentService";
import { DeadlineBadge, StatusBadge } from "./StatusBadge";

type AssignmentCardProps = {
  assignment: Assignment;
  classLabel: string;
  latestSubmission?: Submission;
  isTeacher?: boolean;
  isStarting?: boolean;
  onStart?: (assignment: Assignment) => void;
  onOpenResult?: (submissionId: string) => void;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Khong co deadline";
  return new Date(value).toLocaleString("vi-VN");
};

const AssignmentCard = ({
  assignment,
  classLabel,
  latestSubmission,
  isTeacher = false,
  isStarting = false,
  onStart,
  onOpenResult,
}: AssignmentCardProps) => {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">{assignment.title}</h3>
          <p className="text-sm text-slate-600">Giao vien: {assignment.teacherName}</p>
          <p className="text-sm text-slate-600">Nhom: {classLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DeadlineBadge deadline={assignment.deadline} />
          {assignment.passwordRequired && <StatusBadge label="Can mat khau" tone="violet" />}
        </div>
      </div>

      {assignment.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{assignment.description}</p>
      )}

      {latestSubmission && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Da lam bai (lan {latestSubmission.attemptNumber}) - {latestSubmission.totalScore ?? "Dang cham"} diem
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">Deadline: {formatDateTime(assignment.deadline)}</div>

        {isTeacher ? (
          <Link
            to={`/teacher/assignments/${assignment.assignmentId}/submissions`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Xem bai nop
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            {latestSubmission && (
              <button
                onClick={() => onOpenResult?.(latestSubmission.submissionId)}
                className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                Xem ket qua
              </button>
            )}
            <button
              onClick={() => onStart?.(assignment)}
              disabled={isStarting}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isStarting ? "Dang vao bai..." : "Lam bai ngay"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default AssignmentCard;

