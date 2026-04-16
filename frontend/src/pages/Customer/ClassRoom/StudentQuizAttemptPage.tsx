import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import websocketService from "../../../services/chats/websocketService";
import {
  studentQuizService,
  type QuizAttemptSummary,
  type QuizSubmitResult,
  type StudentQuizAttemptReview,
  type StudentQuestionType,
  type StudentQuizTakeResponse,
} from "../../../services/quizzes/studentQuizService";

interface QuizStatusEvent {
  classId: string;
  quizId: string;
  isOpen: boolean;
}

const resolveApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.
      data?.message === "string"
  ) {
    return (
      error as { response?: { data?: { message?: string } } }
    ).response!.data!.message!;
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

const StudentQuizAttemptPage = () => {
  const navigate = useNavigate();
  const { classId, quizId } = useParams<{ classId: string; quizId: string }>();
  const [searchParams] = useSearchParams();
  const attemptIdFromQuery = searchParams.get("attemptId") || "";

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingQuizTake, setLoadingQuizTake] = useState(false);
  const [loadingMyAttempts, setLoadingMyAttempts] = useState(false);
  const [loadingAttemptReview, setLoadingAttemptReview] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [quizOpenRealtime, setQuizOpenRealtime] = useState(true);
  const [quizTakeData, setQuizTakeData] =
    useState<StudentQuizTakeResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitResult, setQuizSubmitResult] =
    useState<QuizSubmitResult | null>(null);
  const [myAttempts, setMyAttempts] = useState<QuizAttemptSummary[]>([]);
  const [attemptReview, setAttemptReview] =
    useState<StudentQuizAttemptReview | null>(null);

  const isReviewMode = Boolean(attemptIdFromQuery);

  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
  };

  const sortedQuestions = useMemo(() => {
    if (!quizTakeData) {
      return [];
    }

    return [...quizTakeData.questions].sort(
      (first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0),
    );
  }, [quizTakeData]);

  const initializeAnswers = (takeData: StudentQuizTakeResponse) => {
    const initialAnswers: Record<string, string[]> = {};
    takeData.questions.forEach((question) => {
      initialAnswers[question.questionId] = [];
    });
    setQuizAnswers(initialAnswers);
  };

  const loadQuizAttempts = async (targetQuizId: string) => {
    try {
      setLoadingMyAttempts(true);
      const attempts = await studentQuizService.getMyAttempts(targetQuizId);
      setMyAttempts(attempts);
    } catch {
      setMyAttempts([]);
    } finally {
      setLoadingMyAttempts(false);
    }
  };

  const loadQuizForTake = async (targetQuizId: string) => {
    try {
      setLoadingQuizTake(true);
      const takeData = await studentQuizService.getQuizForTake(targetQuizId);
      setQuizTakeData(takeData);
      initializeAnswers(takeData);
      setRemainingSeconds((takeData.durationMinutes || 30) * 60);
    } catch (error) {
      setQuizTakeData(null);
      const message = resolveApiErrorMessage(
        error,
        "Không thể tải đề quiz để làm bài.",
      );
      toast.error(message);
    } finally {
      setLoadingQuizTake(false);
    }
  };

  const loadAttemptReview = async (targetQuizId: string, attemptId: string) => {
    try {
      setLoadingAttemptReview(true);
      const review = await studentQuizService.getMyAttemptDetail(targetQuizId, attemptId);
      setAttemptReview(review);
    } catch (error) {
      setAttemptReview(null);
      const message = resolveApiErrorMessage(
        error,
        "Không thể tải chi tiết bài làm đã nộp.",
      );
      toast.error(message);
    } finally {
      setLoadingAttemptReview(false);
    }
  };

  useEffect(() => {
    if (!classId || !quizId) {
      return;
    }

    const initializePage = async () => {
      try {
        setCheckingAccess(true);
        const enrolled = await enrollmentService.checkEnrollment(classId);
        if (!enrolled) {
          toast.warning("Bạn chưa enroll lớp này.");
          navigate(`/classes/${classId}`);
          return;
        }

        if (attemptIdFromQuery) {
          await Promise.all([
            loadQuizAttempts(quizId),
            loadAttemptReview(quizId, attemptIdFromQuery),
          ]);
          return;
        }

        await Promise.all([loadQuizAttempts(quizId), loadQuizForTake(quizId)]);
      } finally {
        setCheckingAccess(false);
      }
    };

    initializePage();
  }, [classId, quizId, attemptIdFromQuery, navigate]);

  useEffect(() => {
    if (isReviewMode || quizSubmitResult || remainingSeconds === null) {
      return;
    }

    if (remainingSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isReviewMode, quizSubmitResult, remainingSeconds]);

  useEffect(() => {
    if (isReviewMode || quizSubmitResult || remainingSeconds !== 0) {
      return;
    }

    toast.warning("Hết thời gian làm bài. Hệ thống sẽ nộp bài tự động.");
    handleSubmitQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isReviewMode, quizSubmitResult]);

  useEffect(() => {
    if (!classId || !quizId || isReviewMode) {
      return;
    }

    const topic = `/topic/classes/${classId}/quiz-status`;
    const unsubscribe = websocketService.onTopicMessage(
      topic,
      (event: QuizStatusEvent) => {
        if (!event?.quizId || event.quizId !== quizId) {
          return;
        }

        setQuizOpenRealtime(Boolean(event.isOpen));
        if (!event.isOpen) {
          toast.warning("Giáo viên vừa đóng quiz này. Bạn không thể tiếp tục làm bài.");
        }
      },
    );

    return () => unsubscribe();
  }, [classId, quizId, isReviewMode]);

  const handleSelectAnswer = (
    questionId: string,
    optionId: string,
    questionType: StudentQuestionType,
  ) => {
    setQuizAnswers((prev) => {
      const current = prev[questionId] || [];

      if (questionType === "SINGLE_CHOICE") {
        return {
          ...prev,
          [questionId]: [optionId],
        };
      }

      const next = current.includes(optionId)
        ? current.filter((item) => item !== optionId)
        : [...current, optionId];

      return {
        ...prev,
        [questionId]: next,
      };
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizId || !quizTakeData) {
      return;
    }

    try {
      setSubmittingQuiz(true);
      const result = await studentQuizService.submitQuiz(quizId, {
        answers: quizTakeData.questions.map((question) => ({
          questionId: question.questionId,
          selectedOptionIds: quizAnswers[question.questionId] || [],
        })),
      });

      setQuizSubmitResult(result);
      setMyAttempts((prev) => [
        {
          quizAttemptId: result.quizAttemptId,
          score: result.score,
          correctCount: result.correctCount,
          totalQuestions: result.totalQuestions,
          submittedAt: result.submittedAt,
        },
        ...prev,
      ]);
      setQuizTakeData((prev) =>
        prev
          ? {
              ...prev,
              attemptsUsed: prev.attemptsUsed + 1,
              attemptsRemaining: Math.max(0, prev.attemptsRemaining - 1),
            }
          : prev,
      );
      toast.success("Nộp bài thành công.");
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Không thể nộp bài quiz.");
      toast.error(message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleRetryQuiz = async () => {
    if (!quizId) {
      return;
    }

    setQuizSubmitResult(null);
    await loadQuizForTake(quizId);
  };

  if (!classId || !quizId) {
    return <div className="max-w-6xl mx-auto p-6">Thiếu classId hoặc quizId trên URL.</div>;
  }

  if (checkingAccess) {
    return <div className="max-w-6xl mx-auto p-6">Đang kiểm tra quyền làm bài...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 p-5 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(`/classes/${classId}/learning`)}
          className="text-sm text-blue-600 hover:underline"
        >
          Quay lại lớp học
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          {attemptReview?.quizTitle || quizTakeData?.title || "Làm bài quiz"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {attemptReview?.quizDescription || quizTakeData?.description || "Hoàn thành bài quiz và nộp để xem kết quả."}
        </p>
        {isReviewMode && attemptReview ? (
          <p className="text-xs text-slate-500 mt-2">
            Bài làm đã nộp lúc: {new Date(attemptReview.submittedAt).toLocaleString("vi-VN")}
          </p>
        ) : null}
        {!isReviewMode && quizTakeData ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 font-semibold">
              Số lượt còn lại: {quizTakeData.attemptsRemaining}
            </span>
            <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 font-semibold">
              Thời gian: {remainingSeconds === null ? "--:--" : formatRemainingTime(remainingSeconds)}
            </span>
          </div>
        ) : null}
      </div>

      {loadingAttemptReview ? (
        <p className="text-sm text-slate-500">Đang tải chi tiết bài làm...</p>
      ) : null}

      {isReviewMode && attemptReview ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Chi tiết bài làm đã nộp</p>
            <p className="text-sm text-emerald-700 mt-1">
              Điểm: <span className="font-bold">{Number(attemptReview.score || 0).toFixed(2)}</span> - Đúng {attemptReview.correctCount}/{attemptReview.totalQuestions} câu.
            </p>
          </div>

          <div className="space-y-3">
            {attemptReview.questions
              .slice()
              .sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0))
              .map((question, questionIndex) => (
                <article
                  key={`${question.questionId}-history-review`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-xs font-semibold text-cyan-700">
                    Câu {questionIndex + 1} {question.correct ? "- Đúng" : "- Sai"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {question.questionText}
                  </p>
                  <div className="mt-3 space-y-2">
                    {question.options
                      .slice()
                      .sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0))
                      .map((option) => {
                        const className = option.correct
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : option.selected
                            ? "border-rose-300 bg-rose-50 text-rose-800"
                            : "border-slate-200 bg-white text-slate-700";

                        return (
                          <div
                            key={`${question.questionId}-${option.optionId}`}
                            className={`rounded-lg border px-3 py-2 text-sm ${className}`}
                          >
                            <span>{option.optionText}</span>
                            {option.correct ? (
                              <span className="ml-2 text-xs font-semibold">(Đáp án đúng)</span>
                            ) : null}
                            {!option.correct && option.selected ? (
                              <span className="ml-2 text-xs font-semibold">(Bạn chọn)</span>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                </article>
              ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/classes/${classId}/quizzes/${quizId}/attempt`)}
              className="rounded-lg border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
            >
              Làm bài mới
            </button>
            <button
              type="button"
              onClick={() => navigate(`/classes/${classId}/learning`)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại lớp học
            </button>
          </div>
        </div>
      ) : null}

      {!isReviewMode && !quizOpenRealtime ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Quiz này hiện đã bị giáo viên đóng. Vui lòng quay lại lớp học để theo dõi cập nhật.
        </div>
      ) : null}

      {loadingMyAttempts ? (
        <p className="text-xs text-slate-500">Đang tải lịch sử làm bài...</p>
      ) : myAttempts.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">Lịch sử làm bài của bạn</p>
          <div className="mt-2 space-y-2">
            {myAttempts.slice(0, 5).map((attempt, index) => (
              <div
                key={attempt.quizAttemptId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <span className="font-medium text-slate-700">Lần {myAttempts.length - index}</span>
                <span className="text-slate-600">
                  Điểm: {Number(attempt.score || 0).toFixed(2)} ({attempt.correctCount}/{attempt.totalQuestions})
                </span>
                <span className="text-slate-500">
                  {attempt.submittedAt
                    ? new Date(attempt.submittedAt).toLocaleString("vi-VN")
                    : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!isReviewMode && loadingQuizTake ? (
        <p className="text-sm text-slate-500">Đang tải đề quiz...</p>
      ) : null}

      {!isReviewMode && !loadingQuizTake && !quizTakeData ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Bạn hiện không thể làm quiz này (có thể đã hết lượt hoặc chưa có quyền truy cập).
        </div>
      ) : null}

      {!isReviewMode && quizOpenRealtime && !loadingQuizTake && quizTakeData && !quizSubmitResult ? (
        <div className="space-y-3">
          {sortedQuestions.map((question, questionIndex) => (
            <article
              key={question.questionId}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs text-cyan-700 font-semibold">Câu {questionIndex + 1}</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {question.questionText}
              </p>
              <div className="mt-3 space-y-2">
                {[...question.options]
                  .sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0))
                  .map((option) => {
                    const selected = (quizAnswers[question.questionId] || []).includes(
                      option.optionId,
                    );

                    return (
                      <label
                        key={option.optionId}
                        className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <input
                          type={question.questionType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                          name={`question-${question.questionId}`}
                          checked={selected}
                          onChange={() =>
                            handleSelectAnswer(
                              question.questionId,
                              option.optionId,
                              question.questionType,
                            )
                          }
                          className="mt-0.5"
                        />
                        <span>{option.optionText}</span>
                      </label>
                    );
                  })}
              </div>
            </article>
          ))}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={submittingQuiz}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {submittingQuiz ? "Đang nộp bài..." : "Nộp bài"}
            </button>
          </div>
        </div>
      ) : null}

      {!isReviewMode && quizOpenRealtime && !loadingQuizTake && quizTakeData && quizSubmitResult ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Bạn đã nộp bài thành công.</p>
            <p className="text-sm text-emerald-700 mt-1">
              Điểm: <span className="font-bold">{Number(quizSubmitResult.score || 0).toFixed(2)}</span> - Đúng {quizSubmitResult.correctCount}/{quizSubmitResult.totalQuestions} câu.
            </p>
          </div>

          <div className="space-y-3">
            {sortedQuestions.map((question, questionIndex) => {
              const detail = quizSubmitResult.details.find(
                (item) => item.questionId === question.questionId,
              );

              return (
                <article
                  key={`${question.questionId}-review`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-xs font-semibold text-cyan-700">
                    Câu {questionIndex + 1} {detail?.correct ? "- Đúng" : "- Sai"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {question.questionText}
                  </p>
                  <div className="mt-3 space-y-2">
                    {[...question.options]
                      .sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0))
                      .map((option) => {
                        const isSelected = Boolean(
                          detail?.selectedOptionIds.includes(option.optionId),
                        );
                        const isCorrect = Boolean(
                          detail?.correctOptionIds.includes(option.optionId),
                        );

                        const className = isCorrect
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : isSelected
                            ? "border-rose-300 bg-rose-50 text-rose-800"
                            : "border-slate-200 bg-white text-slate-700";

                        return (
                          <div
                            key={`${question.questionId}-${option.optionId}`}
                            className={`rounded-lg border px-3 py-2 text-sm ${className}`}
                          >
                            <span>{option.optionText}</span>
                            {isCorrect ? (
                              <span className="ml-2 text-xs font-semibold">(Đáp án đúng)</span>
                            ) : null}
                            {!isCorrect && isSelected ? (
                              <span className="ml-2 text-xs font-semibold">(Bạn chọn)</span>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {quizTakeData.attemptsRemaining > 0 ? (
              <button
                type="button"
                onClick={handleRetryQuiz}
                className="rounded-lg border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Làm lại
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(`/classes/${classId}/learning`)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại lớp học
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentQuizAttemptPage;



