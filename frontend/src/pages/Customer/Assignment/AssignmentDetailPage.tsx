import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import assignmentService, {
  type Assignment,
  type SubmissionAnswerPayload,
} from "../../../services/assignments/assignmentService";

const AssignmentDetailPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

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
  const [accessPassword, setAccessPassword] = useState("");
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
        setError("Khong the tai chi tiet bai tap");
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
      const apiError = e as AxiosError<{ message?: string }>;
      const serverMessage = apiError.response?.data?.message || "";
      if (serverMessage.includes("Submission already exists")) {
        setError("Ban da nop bai nay truoc do.");
      } else if (serverMessage.includes("Assignment password is invalid")) {
        setError("Mat khau bai tap khong dung.");
      } else if (serverMessage.includes("Submission attempt limit exceeded")) {
        setError("Ban da het so lan lam bai cho bai tap nay.");
      } else if (serverMessage.includes("Forbidden")) {
        setError("Ban khong co quyen nop bai tap nay.");
      } else {
        setError(serverMessage || "Nop bai that bai.");
      }
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
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!assignment) return <div className="p-6">Khong tim thay bai tap</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <div className="border rounded p-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        {assignment.description && <p className="mt-2 text-gray-700">{assignment.description}</p>}
        {assignment.deadline && (
          <p className="mt-2 text-sm text-orange-600">
            Deadline: {new Date(assignment.deadline).toLocaleString("vi-VN")}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-700">So lan lam toi da: {assignment.maxAttempts || 1}</p>
        {assignment.timeLimitMinutes && (
          <p className="mt-2 text-sm text-blue-700">
            Thoi gian lam bai: {assignment.timeLimitMinutes} phut
            {remainingSeconds !== null && (
              <> - Con lai: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}</>
            )}
          </p>
        )}
        {assignment.passwordRequired && (
          <div className="mt-3">
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="Nhap mat khau bai tap"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
            />
          </div>
        )}
        {isDeadlinePassed && (
          <p className="mt-2 text-sm text-red-600">Bai tap da qua han nop.</p>
        )}
      </div>

      {sortedQuestions.map((question) => (
        <div key={question.questionId} className="border rounded p-4 bg-white shadow-sm space-y-3">
          <div className="font-medium">
            Cau {question.questionOrder}: {question.questionContent}
          </div>

          {question.questionType === "TEXT" && (
            <textarea
              className="w-full border rounded px-3 py-2"
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
            <div className="space-y-2">
              {(question.options || []).map((option, index) => (
                <label key={`${question.questionId}-${index}`} className="flex items-center gap-2">
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
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => startRecording(question.questionId)}
                  disabled={recordingQuestionId !== null && recordingQuestionId !== question.questionId}
                  className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  Start Recording
                </button>
                <button
                  onClick={stopRecording}
                  disabled={recordingQuestionId !== question.questionId}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
                >
                  Stop Recording
                </button>
              </div>

              {audioAnswers[question.questionId]?.audioUrl && (
                <div className="space-y-2">
                  <audio controls src={audioAnswers[question.questionId].audioUrl} />
                  <div className="text-sm text-gray-700">
                    Transcript: {audioAnswers[question.questionId].transcriptText || "(none)"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {recordingError && <div className="text-red-500">{recordingError}</div>}

      <div className="flex justify-end">
        <button
          disabled={submitting || isDeadlinePassed}
          onClick={() => {
            void handleSubmit();
          }}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
        >
          {submitting ? "Dang nop..." : "Nop bai"}
        </button>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;

