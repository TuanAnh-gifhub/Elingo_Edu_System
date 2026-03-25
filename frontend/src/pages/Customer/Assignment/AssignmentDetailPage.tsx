import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import assignmentService, {
  type Assignment,
  type SubmissionAnswerPayload,
  resolveAssignmentErrorMessage,
} from "../../../services/assignments/assignmentService";
import { DeadlineBadge, StatusBadge } from "../../../components/Assignment/StatusBadge";

const AssignmentDetailPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const startState = location.state as { accessPassword?: string; className?: string } | null;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [choiceAnswers, setChoiceAnswers] = useState<Record<string, number[]>>({});
  const [audioAnswers, setAudioAnswers] = useState<
    Record<string, { audioFileId: string; audioUrl: string; transcriptText: string }>
  >({});

  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [accessPassword, setAccessPassword] = useState(startState?.accessPassword || "");
  const [attemptStartedAt, setAttemptStartedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!assignmentId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(data);
      } catch (e) {
        console.error(e);
        setError(resolveAssignmentErrorMessage(e, "Khong the tai chi tiet bai tap"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [assignmentId]);

  const sortedQuestions = useMemo(() => {
    if (!assignment) return [];
    return [...assignment.questions].sort((a, b) => a.questionOrder - b.questionOrder);
  }, [assignment]);

  const isDeadlinePassed =
    !!assignment?.deadline && new Date(assignment.deadline).getTime() < Date.now();

  const timerStorageKey = assignmentId ? `assignment-attempt-start:${assignmentId}` : null;

  useEffect(() => {
    if (!assignment || !timerStorageKey) return;

    const existing = window.localStorage.getItem(timerStorageKey);
    const startedAt = existing || new Date().toISOString();
    if (!existing) {
      window.localStorage.setItem(timerStorageKey, startedAt);
    }
    setAttemptStartedAt(startedAt);
  }, [assignment, timerStorageKey]);

  useEffect(() => {
    if (!assignment?.timeLimitMinutes || !attemptStartedAt) {
      setRemainingSeconds(null);
      return;
    }

    const endAt = new Date(attemptStartedAt).getTime() + assignment.timeLimitMinutes * 60_000;

    const updateRemaining = () => {
      const seconds = Math.max(0, Math.floor((endAt - Date.now()) / 1000));
      setRemainingSeconds(seconds);
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [assignment?.timeLimitMinutes, attemptStartedAt]);

  const unansweredCount = useMemo(() => {
    return sortedQuestions.filter((question) => {
      if (question.questionType === "MULTIPLE_CHOICE") {
        return (choiceAnswers[question.questionId] || []).length === 0;
      }

      if (question.questionType === "AUDIO") {
        return !audioAnswers[question.questionId]?.audioFileId;
      }

      return !textAnswers[question.questionId]?.trim();
    }).length;
  }, [audioAnswers, choiceAnswers, sortedQuestions, textAnswers]);

  const startRecording = async (questionId: string) => {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const result = await assignmentService.uploadAudio(audioBlob);
          setAudioAnswers((prev) => ({
            ...prev,
            [questionId]: {
              audioFileId: result.audioFileId,
              audioUrl: result.audioUrl,
              transcriptText: result.transcriptText,
            },
          }));
        } catch (e) {
          console.error(e);
          setRecordingError("Upload audio that bai");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecordingQuestionId(questionId);
    } catch (e) {
      console.error(e);
      setRecordingError("Khong the bat microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecordingQuestionId(null);
  };

  const handleSubmit = async (forceAutoSubmit = false) => {
    if (!assignment) return;

    if (isDeadlinePassed) {
      setError("Bai tap da het han nop.");
      return;
    }

    if (unansweredCount > 0 && !forceAutoSubmit) {
      setError(`Vui long hoan thanh ${unansweredCount} cau hoi con lai.`);
      return;
    }

    const answers: SubmissionAnswerPayload[] = sortedQuestions.map((question) => {
      if (question.questionType === "MULTIPLE_CHOICE") {
        return {
          questionId: question.questionId,
          selectedOptionIndexes: (choiceAnswers[question.questionId] || []).slice().sort((a, b) => a - b),
        };
      }

      if (question.questionType === "AUDIO") {
        const audio = audioAnswers[question.questionId];
        return {
          questionId: question.questionId,
          audioFileId: audio?.audioFileId,
        };
      }

      return {
        questionId: question.questionId,
        answerText: textAnswers[question.questionId],
      };
    });

    setSubmitting(true);
    setError(null);
    try {
      const submission = await assignmentService.createSubmission({
        assignmentId: assignment.assignmentId,
        accessPassword: assignment.passwordRequired ? accessPassword : undefined,
        attemptStartedAt: attemptStartedAt || undefined,
        autoSubmitted: forceAutoSubmit,
        answers,
      });
      if (timerStorageKey) {
        window.localStorage.removeItem(timerStorageKey);
      }
      navigate(`/submissions/${submission.submissionId}`);
    } catch (e) {
      console.error(e);
      setError(resolveAssignmentErrorMessage(e, "Nop bai that bai."));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (remainingSeconds !== 0) return;
    if (submitting) return;
    handleSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, submitting]);

  if (loading) return <div className="p-6">Dang tai...</div>;
  if (!assignment) return <div className="p-6">Khong tim thay bai tap</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold md:text-3xl">Lam bai: {assignment.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DeadlineBadge deadline={assignment.deadline} />
            {assignment.passwordRequired && <StatusBadge label="Can mat khau" tone="violet" />}
            <StatusBadge label={`So lan toi da: ${assignment.maxAttempts || 1}`} tone="blue" />
          </div>
          <p className="mt-3 text-sm text-blue-100">Giao vien: {assignment.teacherName}</p>
          <p className="text-sm text-blue-100">Nhom: {startState?.className || assignment.classId}</p>
          {assignment.deadline && (
            <p className="mt-2 text-sm text-blue-100">
              Deadline: {new Date(assignment.deadline).toLocaleString("vi-VN")}
            </p>
          )}
          {assignment.timeLimitMinutes && (
            <p className="mt-1 text-sm text-blue-100">
              Thoi gian lam bai: {assignment.timeLimitMinutes} phut
              {remainingSeconds !== null && (
                <> - Con lai: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}</>
              )}
            </p>
          )}
        </section>

        {(assignment.description || assignment.passwordRequired) && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {assignment.description && <p className="text-sm leading-6 text-slate-700">{assignment.description}</p>}
            {assignment.passwordRequired && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="assignment-access-password">
                  Mat khau bai tap (khac voi ma tham gia nhom)
                </label>
                <input
                  id="assignment-access-password"
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nhap mat khau bai tap"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                />
              </div>
            )}
            {isDeadlinePassed && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Bai tap da qua han nop.
              </p>
            )}
          </section>
        )}

        <section className="space-y-4" aria-label="Danh sach cau hoi bai tap">
          {sortedQuestions.map((question) => (
            <article key={question.questionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Cau {question.questionOrder}: {question.questionContent}
              </h2>

              {question.questionType === "TEXT" && (
                <textarea
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  rows={4}
                  value={textAnswers[question.questionId] || ""}
                  onChange={(e) =>
                    setTextAnswers((prev) => ({
                      ...prev,
                      [question.questionId]: e.target.value,
                    }))
                  }
                  placeholder="Nhap cau tra loi"
                />
              )}

              {question.questionType === "MULTIPLE_CHOICE" && (
                <div className="mt-3 space-y-2">
                  {(question.options || []).map((option, index) => (
                    <label
                      key={`${question.questionId}-${index}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:border-blue-200"
                    >
                      <input
                        type="checkbox"
                        checked={(choiceAnswers[question.questionId] || []).includes(index)}
                        onChange={(e) =>
                          setChoiceAnswers((prev) => {
                            const current = prev[question.questionId] || [];
                            const next = e.target.checked
                              ? Array.from(new Set([...current, index]))
                              : current.filter((item) => item !== index);
                            return {
                              ...prev,
                              [question.questionId]: next,
                            };
                          })
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.questionType === "AUDIO" && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startRecording(question.questionId)}
                      disabled={recordingQuestionId !== null && recordingQuestionId !== question.questionId}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Recording
                    </button>
                    <button
                      onClick={stopRecording}
                      disabled={recordingQuestionId !== question.questionId}
                      className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      Stop Recording
                    </button>
                  </div>

                  {audioAnswers[question.questionId]?.audioUrl && (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <audio controls src={audioAnswers[question.questionId].audioUrl} className="w-full" />
                      <p className="text-sm text-slate-700">
                        Transcript: {audioAnswers[question.questionId].transcriptText || "(none)"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>

        {recordingError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{recordingError}</div>}
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end">
          <button
            disabled={submitting || isDeadlinePassed}
            onClick={() => {
              void handleSubmit();
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Dang nop..." : "Nop bai"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AssignmentDetailPage;

