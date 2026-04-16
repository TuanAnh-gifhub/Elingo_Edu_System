import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  quizService,
  type QuizImportResult,
  type QuizDto,
} from "../../../services/quizzes/quizService";
import { classRoomService } from "../../../services/classes/classRoomService";
import { courseService } from "../../../services/courses/courseService";
import {
  questionService,
  type QuestionDto,
  type QuestionType,
} from "../../../services/questions/questionService";
import { questionOptionService } from "../../../services/question-options/questionOptionService";

interface OptionDraft {
  optionId?: string;
  optionText: string;
  isCorrect: boolean;
}

const INITIAL_OPTIONS: OptionDraft[] = [
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
];

const sortQuestionsByOrder = (questions: QuestionDto[]) => {
  return [...questions].sort(
    (first, second) => first.orderIndex - second.orderIndex,
  );
};

const LessonQuizPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { classId, lessonId } = useParams<{
    classId: string;
    lessonId: string;
  }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState<QuizDto | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDto | null>(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importResult, setImportResult] = useState<QuizImportResult | null>(
    null,
  );
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] =
    useState<QuestionType>("SINGLE_CHOICE");
  const [optionDrafts, setOptionDrafts] =
    useState<OptionDraft[]>(INITIAL_OPTIONS);
  const [quizQuestions, setQuizQuestions] = useState<QuestionDto[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionType, setEditQuestionType] =
    useState<QuestionType>("SINGLE_CHOICE");
  const [editOptionDrafts, setEditOptionDrafts] = useState<OptionDraft[]>([]);
  const [updatingQuestionId, setUpdatingQuestionId] = useState<string | null>(
    null,
  );
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );
  const [className, setClassName] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const importExcelInputRef = useRef<HTMLInputElement>(null);
  const selectedQuizId = searchParams.get("quizId");

  const pageTitle = useMemo(() => {
    if (!lessonTitle) {
      return "Bài kiểm tra";
    }

    return `Bài kiểm tra: ${lessonTitle}`;
  }, [lessonTitle]);

  const nextQuestionOrderIndex = useMemo(() => {
    if (quizQuestions.length === 0) {
      return 1;
    }

    return (
      Math.max(...quizQuestions.map((question) => question.orderIndex || 0)) + 1
    );
  }, [quizQuestions]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadClassName = async () => {
      try {
        const classInfo = await classRoomService.getClassById(classId);
        setClassName(classInfo.className || "");
      } catch {
        setClassName("");
      }
    };

    loadClassName();
  }, [classId]);

  useEffect(() => {
    if (!classId || !lessonId) {
      return;
    }

    const loadLessonName = async () => {
      try {
        const coursePage = await courseService.getCourses(1, 200, classId);
        const lesson = (coursePage.data || []).find(
          (course) => course.courseId === lessonId,
        );
        setLessonTitle(lesson?.title || "");
      } catch {
        setLessonTitle("");
      }
    };

    loadLessonName();
  }, [classId, lessonId]);

  useEffect(() => {
    if (!selectedQuizId) {
      setSelectedQuiz(null);
      setQuizQuestions([]);
      return;
    }

    const loadSelectedQuiz = async () => {
      try {
        const quiz = await quizService.getQuiz(selectedQuizId);
        setSelectedQuiz(quiz);
      } catch {
        setSelectedQuiz(null);
      }
    };

    loadSelectedQuiz();
  }, [selectedQuizId]);

  useEffect(() => {
    if (!selectedQuiz) {
      return;
    }

    setTitle(selectedQuiz.title || "");
    setDescription(selectedQuiz.description || "");
    setMaxAttempts(Number(selectedQuiz.maxAttempts) || 0);
  }, [selectedQuiz]);

  useEffect(() => {
    if (!selectedQuiz?.quizId) {
      setQuizQuestions([]);
      return;
    }

    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const questions = await questionService.getQuestions(
          selectedQuiz.quizId,
        );
        setQuizQuestions(sortQuestionsByOrder(questions || []));
      } catch {
        setQuizQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [selectedQuiz?.quizId]);

  const handleSaveQuiz = async () => {
    if (!lessonId) {
      toast.error("Thiếu lessonId để tạo bài kiểm tra.");
      return;
    }

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài kiểm tra.");
      return;
    }

    if (maxAttempts < 0) {
      toast.error("Số lần làm tối đa không hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedQuiz) {
        const updated = await quizService.updateQuiz(selectedQuiz.quizId, {
          title: title.trim(),
          description: description.trim(),
          maxAttempts: Number(maxAttempts) || 0,
        });

        setSelectedQuiz(updated);
        setCreatedQuiz(updated);
        toast.success("Cập nhật quiz thành công.");
      } else {
        const quiz = await quizService.createQuiz({
          courseId: lessonId,
          title: title.trim(),
          description: description.trim(),
          maxAttempts: Number(maxAttempts) || 0,
        });

        setCreatedQuiz(quiz);
        setSelectedQuiz(quiz);
        setSearchParams({ quizId: quiz.quizId });
        setImportResult(null);
        toast.success("Tạo bài kiểm tra thành công.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu thông tin bài kiểm tra.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportExcel = async (fileList: FileList | null) => {
    const targetQuiz = selectedQuiz || createdQuiz;
    if (!targetQuiz) {
      toast.error("Hãy tạo quiz trước khi import đề.");
      return;
    }

    if (!fileList || fileList.length === 0) {
      return;
    }

    const file = fileList[0];
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      toast.error("Vui lòng chọn file Excel (.xlsx hoặc .xls).");
      return;
    }

    try {
      setIsImportingExcel(true);
      const result = await quizService.importQuizExcel(targetQuiz.quizId, file);
      setImportResult(result);

      if (result.errors?.length) {
        toast.warning(
          `Import thành công ${result.importedCount}/${result.totalRows} dòng. Có ${result.errors.length} lỗi.`,
        );
      } else {
        toast.success(
          `Import đề thành công: ${result.importedCount}/${result.totalRows} dòng.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể import file Excel.";
      toast.error(message);
    } finally {
      setIsImportingExcel(false);
    }
  };

  const updateOptionDraft = (index: number, patch: Partial<OptionDraft>) => {
    setOptionDrafts((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleToggleCorrectOption = (index: number) => {
    setOptionDrafts((prev) => {
      if (questionType === "SINGLE_CHOICE") {
        return prev.map((item, itemIndex) => ({
          ...item,
          isCorrect: itemIndex === index,
        }));
      }

      return prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, isCorrect: !item.isCorrect } : item,
      );
    });
  };

  const handleAddOptionDraft = () => {
    setOptionDrafts((prev) => [...prev, { optionText: "", isCorrect: false }]);
  };

  const handleRemoveOptionDraft = (index: number) => {
    setOptionDrafts((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const updateEditOptionDraft = (
    index: number,
    patch: Partial<OptionDraft>,
  ) => {
    setEditOptionDrafts((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleToggleCorrectEditOption = (index: number) => {
    setEditOptionDrafts((prev) => {
      if (editQuestionType === "SINGLE_CHOICE") {
        return prev.map((item, itemIndex) => ({
          ...item,
          isCorrect: itemIndex === index,
        }));
      }

      return prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, isCorrect: !item.isCorrect } : item,
      );
    });
  };

  const handleAddEditOptionDraft = () => {
    setEditOptionDrafts((prev) => [
      ...prev,
      { optionText: "", isCorrect: false },
    ]);
  };

  const handleRemoveEditOptionDraft = (index: number) => {
    setEditOptionDrafts((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const normalizeQuestionOrder = async (questions: QuestionDto[]) => {
    const sorted = sortQuestionsByOrder(questions);

    const normalized = await Promise.all(
      sorted.map(async (question, index) => {
        const normalizedOrder = index + 1;
        if (question.orderIndex === normalizedOrder) {
          return question;
        }

        try {
          return await questionService.updateQuestion(question.questionId, {
            questionText: question.questionText,
            questionType: question.questionType,
            orderIndex: normalizedOrder,
          });
        } catch {
          return {
            ...question,
            orderIndex: normalizedOrder,
          };
        }
      }),
    );

    return sortQuestionsByOrder(normalized);
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setQuestionType("SINGLE_CHOICE");
    setOptionDrafts(INITIAL_OPTIONS);
  };

  const handleCreateQuestionManually = async () => {
    const targetQuiz = selectedQuiz || createdQuiz;
    if (!targetQuiz) {
      toast.error("Vui lòng chọn hoặc tạo quiz trước.");
      return;
    }

    if (!questionText.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    const validOptions = optionDrafts
      .map((option, index) => ({ ...option, orderIndex: index + 1 }))
      .filter((option) => option.optionText.trim().length > 0);

    if (validOptions.length < 2) {
      toast.error("Cần ít nhất 2 đáp án có nội dung.");
      return;
    }

    const correctCount = validOptions.filter(
      (option) => option.isCorrect,
    ).length;
    if (questionType === "SINGLE_CHOICE" && correctCount !== 1) {
      toast.error("Câu SINGLE_CHOICE phải có đúng 1 đáp án đúng.");
      return;
    }

    if (questionType === "MULTIPLE_CHOICE" && correctCount < 1) {
      toast.error("Câu MULTIPLE_CHOICE phải có ít nhất 1 đáp án đúng.");
      return;
    }

    try {
      setIsCreatingQuestion(true);

      const createdQuestion = await questionService.createQuestion({
        quizId: targetQuiz.quizId,
        questionText: questionText.trim(),
        questionType,
        orderIndex: nextQuestionOrderIndex,
      });

      const createdOptions = await Promise.all(
        validOptions.map((option, index) =>
          questionOptionService.createOption({
            questionId: createdQuestion.questionId,
            optionText: option.optionText.trim(),
            isCorrect: option.isCorrect,
            orderIndex: index + 1,
          }),
        ),
      );

      setQuizQuestions((prev) =>
        sortQuestionsByOrder([
          ...prev,
          {
            ...createdQuestion,
            options: createdOptions,
          },
        ]),
      );

      toast.success("Thêm câu hỏi và đáp án thành công.");
      resetQuestionForm();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể thêm câu hỏi thủ công.";
      toast.error(message);
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  const handleStartEditQuestion = (question: QuestionDto) => {
    setEditingQuestionId(question.questionId);
    setEditQuestionText(question.questionText || "");
    setEditQuestionType(question.questionType || "SINGLE_CHOICE");

    const options = (question.options || []).length
      ? (question.options || []).map((option) => ({
          optionId: option.optionId,
          optionText: option.optionText || "",
          isCorrect: Boolean(option.isCorrect),
        }))
      : [
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ];

    setEditOptionDrafts(options);
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditQuestionText("");
    setEditQuestionType("SINGLE_CHOICE");
    setEditOptionDrafts([]);
  };

  const handleUpdateQuestionWithOptions = async (question: QuestionDto) => {
    if (!editQuestionText.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    const validOptions = editOptionDrafts
      .map((option, index) => ({ ...option, orderIndex: index + 1 }))
      .filter((option) => option.optionText.trim().length > 0);

    if (validOptions.length < 2) {
      toast.error("Cần ít nhất 2 đáp án có nội dung.");
      return;
    }

    const correctCount = validOptions.filter(
      (option) => option.isCorrect,
    ).length;
    if (editQuestionType === "SINGLE_CHOICE" && correctCount !== 1) {
      toast.error("Câu SINGLE_CHOICE phải có đúng 1 đáp án đúng.");
      return;
    }

    if (editQuestionType === "MULTIPLE_CHOICE" && correctCount < 1) {
      toast.error("Câu MULTIPLE_CHOICE phải có ít nhất 1 đáp án đúng.");
      return;
    }

    try {
      setUpdatingQuestionId(question.questionId);

      const updatedQuestion = await questionService.updateQuestion(
        question.questionId,
        {
          questionText: editQuestionText.trim(),
          questionType: editQuestionType,
          orderIndex: question.orderIndex,
        },
      );

      const originalOptionIds = new Set(
        (question.options || []).map((option) => option.optionId),
      );
      const currentOptionIds = new Set(
        validOptions
          .filter((option) => Boolean(option.optionId))
          .map((option) => option.optionId as string),
      );

      const deletedOptionIds = [...originalOptionIds].filter(
        (optionId) => !currentOptionIds.has(optionId),
      );

      if (deletedOptionIds.length > 0) {
        await Promise.all(
          deletedOptionIds.map((optionId) =>
            questionOptionService.deleteOption(optionId),
          ),
        );
      }

      const finalOptions = await Promise.all(
        validOptions.map((option, index) => {
          const payload = {
            optionText: option.optionText.trim(),
            isCorrect: option.isCorrect,
            orderIndex: index + 1,
          };

          if (option.optionId) {
            return questionOptionService.updateOption(option.optionId, payload);
          }

          return questionOptionService.createOption({
            questionId: question.questionId,
            ...payload,
          });
        }),
      );

      setQuizQuestions((prev) =>
        sortQuestionsByOrder(
          prev.map((item) =>
            item.questionId === question.questionId
              ? {
                  ...updatedQuestion,
                  options: finalOptions,
                }
              : item,
          ),
        ),
      );

      toast.success("Cập nhật câu hỏi thành công.");
      handleCancelEditQuestion();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể cập nhật câu hỏi.";
      toast.error(message);
    } finally {
      setUpdatingQuestionId(null);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const shouldDelete = window.confirm("Bạn có chắc muốn xóa câu hỏi này?");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      await questionService.deleteQuestion(questionId);

      const remainingQuestions = quizQuestions.filter(
        (question) => question.questionId !== questionId,
      );
      const normalizedQuestions =
        await normalizeQuestionOrder(remainingQuestions);
      setQuizQuestions(normalizedQuestions);

      if (editingQuestionId === questionId) {
        handleCancelEditQuestion();
      }

      toast.success("Xóa câu hỏi thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa câu hỏi.";
      toast.error(message);
    } finally {
      setDeletingQuestionId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(`/classes/${classId}/manage`)}
        className="text-sm text-blue-600 hover:underline"
      >
        Quay lại trang chi tiết lớp học
      </button>

      <div className="mt-4 rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 to-white p-6 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {pageTitle}
        </h1>
        <p className="text-slate-600 mt-2">
          Tạo bài kiểm tra cho bài học và lưu trực tiếp vào hệ thống.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-sm text-slate-500">
            Lớp học:{" "}
            <span className="font-semibold text-slate-700">
              {className || "Không xác định"}
            </span>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Bài học:{" "}
            <span className="font-semibold text-slate-700">
              {lessonTitle || "Không xác định"}
            </span>
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-cyan-100 bg-white p-4 md:p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Thông tin bài kiểm tra
          </h2>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Tiêu đề</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ví dụ: Quiz bài 1 - Từ vựng cơ bản"
              className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Mô tả</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả nội dung bài kiểm tra"
              rows={4}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 max-w-xs">
            <span className="font-medium">Số lần làm tối đa</span>
            <input
              type="number"
              min={0}
              value={maxAttempts}
              onChange={(event) =>
                setMaxAttempts(Math.max(0, Number(event.target.value) || 0))
              }
              className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveQuiz}
              disabled={isSubmitting}
              className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold hover:brightness-105 disabled:opacity-60"
            >
              {isSubmitting
                ? "Đang lưu..."
                : selectedQuiz
                  ? "Lưu cập nhật quiz"
                  : "Tạo bài kiểm tra"}
            </button>

            {selectedQuiz || createdQuiz ? (
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setMaxAttempts(1);
                  setCreatedQuiz(null);
                  setSelectedQuiz(null);
                  setSearchParams({});
                  setQuizQuestions([]);
                  setImportResult(null);
                }}
                className="rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Tạo quiz mới
              </button>
            ) : null}
          </div>
        </div>

        {selectedQuiz || createdQuiz ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="font-semibold text-emerald-800">
              Quiz đang thao tác
            </h3>
            <p className="text-sm text-emerald-700 mt-1">
              Quiz ID: {(selectedQuiz || createdQuiz)?.quizId}
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Tiêu đề: {(selectedQuiz || createdQuiz)?.title}
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Số lần làm tối đa: {(selectedQuiz || createdQuiz)?.maxAttempts}
            </p>

            <div className="mt-4 rounded-lg border border-emerald-300 bg-white p-3">
              <input
                ref={importExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  handleImportExcel(event.target.files);
                  event.target.value = "";
                }}
              />

              <p className="text-sm font-semibold text-slate-800">
                Import đề từ file Excel
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tải file .xlsx hoặc .xls để import câu hỏi vào quiz này.
              </p>

              <button
                type="button"
                onClick={() => importExcelInputRef.current?.click()}
                disabled={isImportingExcel}
                className="mt-3 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                {isImportingExcel ? "Đang import..." : "Chọn file và import"}
              </button>

              {importResult ? (
                <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-2 text-xs text-emerald-800">
                  <p>
                    Kết quả import: {importResult.importedCount}/
                    {importResult.totalRows} dòng.
                  </p>
                  {importResult.errors?.length ? (
                    <div className="mt-1 text-rose-700">
                      <p>Lỗi ({importResult.errors.length}):</p>
                      <ul className="list-disc pl-5">
                        {importResult.errors
                          .slice(0, 5)
                          .map((errorItem, index) => (
                            <li key={`created-quiz-import-error-${index}`}>
                              {errorItem}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {selectedQuiz || createdQuiz ? (
          <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <h3 className="font-semibold text-indigo-800">
              Thêm câu hỏi thủ công
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Tạo câu hỏi qua /questions rồi tạo đáp án qua /question-options.
            </p>

            <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-medium">Dạng câu hỏi</span>
                  <select
                    value={questionType}
                    onChange={(event) => {
                      const nextType = event.target.value as QuestionType;
                      setQuestionType(nextType);
                      if (nextType === "SINGLE_CHOICE") {
                        setOptionDrafts((prev) => {
                          const firstCorrect = prev.findIndex(
                            (item) => item.isCorrect,
                          );
                          return prev.map((item, index) => ({
                            ...item,
                            isCorrect:
                              firstCorrect === -1
                                ? index === 0
                                : index === firstCorrect,
                          }));
                        });
                      }
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="SINGLE_CHOICE">
                      SINGLE_CHOICE (1 đáp án đúng)
                    </option>
                    <option value="MULTIPLE_CHOICE">
                      MULTIPLE_CHOICE (nhiều đáp án đúng)
                    </option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-medium">Thứ tự câu hỏi (tự động)</span>
                  <p className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    Câu tiếp theo sẽ là số {nextQuestionOrderIndex}
                  </p>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Nội dung câu hỏi</span>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder="Ví dụ: Từ nào dưới đây là danh từ?"
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Danh sách đáp án
                </p>
                {optionDrafts.map((option, index) => (
                  <div
                    key={`option-draft-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center"
                  >
                    <input
                      value={option.optionText}
                      onChange={(event) =>
                        updateOptionDraft(index, {
                          optionText: event.target.value,
                        })
                      }
                      placeholder={`Đáp án ${index + 1}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleCorrectOption(index)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        option.isCorrect
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 text-slate-700"
                      }`}
                    >
                      {questionType === "SINGLE_CHOICE"
                        ? "Đáp án đúng"
                        : "Đúng"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionDraft(index)}
                      disabled={optionDrafts.length <= 2}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddOptionDraft}
                  className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Thêm đáp án
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateQuestionManually}
                  disabled={isCreatingQuestion}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isCreatingQuestion ? "Đang thêm..." : "Lưu câu hỏi"}
                </button>
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset form
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Câu hỏi đã có trong quiz ({quizQuestions.length} câu)
              </h4>
              {loadingQuestions ? (
                <p className="text-sm text-slate-500 mt-2">
                  Đang tải câu hỏi...
                </p>
              ) : quizQuestions.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">
                  Quiz này chưa có câu hỏi nào.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {quizQuestions.map((question) => (
                    <div
                      key={question.questionId}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Câu {question.orderIndex}: {question.questionText}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Loại: {question.questionType}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditQuestion(question)}
                            className="rounded-md border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            Sửa câu hỏi
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteQuestion(question.questionId)
                            }
                            disabled={
                              deletingQuestionId === question.questionId
                            }
                            className="rounded-md border border-rose-300 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            {deletingQuestionId === question.questionId
                              ? "Đang xóa..."
                              : "Xóa câu hỏi"}
                          </button>
                        </div>
                      </div>

                      {editingQuestionId === question.questionId ? (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1 text-sm text-slate-700">
                              <span className="font-medium">Dạng câu hỏi</span>
                              <select
                                value={editQuestionType}
                                onChange={(event) => {
                                  const nextType = event.target
                                    .value as QuestionType;
                                  setEditQuestionType(nextType);
                                  if (nextType === "SINGLE_CHOICE") {
                                    setEditOptionDrafts((prev) => {
                                      const firstCorrect = prev.findIndex(
                                        (item) => item.isCorrect,
                                      );
                                      return prev.map((item, index) => ({
                                        ...item,
                                        isCorrect:
                                          firstCorrect === -1
                                            ? index === 0
                                            : index === firstCorrect,
                                      }));
                                    });
                                  }
                                }}
                                className="rounded-lg border border-slate-300 px-3 py-2"
                              >
                                <option value="SINGLE_CHOICE">
                                  SINGLE_CHOICE
                                </option>
                                <option value="MULTIPLE_CHOICE">
                                  MULTIPLE_CHOICE
                                </option>
                              </select>
                            </label>

                            <label className="flex flex-col gap-1 text-sm text-slate-700">
                              <span className="font-medium">
                                Thứ tự câu hỏi
                              </span>
                              <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                Câu số {question.orderIndex} (tự động)
                              </p>
                            </label>
                          </div>

                          <label className="flex flex-col gap-1 text-sm text-slate-700">
                            <span className="font-medium">
                              Nội dung câu hỏi
                            </span>
                            <textarea
                              rows={3}
                              value={editQuestionText}
                              onChange={(event) =>
                                setEditQuestionText(event.target.value)
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </label>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">
                              Đáp án
                            </p>
                            {editOptionDrafts.map((option, optionIndex) => (
                              <div
                                key={
                                  option.optionId ||
                                  `edit-option-${optionIndex}`
                                }
                                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center"
                              >
                                <input
                                  value={option.optionText}
                                  onChange={(event) =>
                                    updateEditOptionDraft(optionIndex, {
                                      optionText: event.target.value,
                                    })
                                  }
                                  placeholder={`Đáp án ${optionIndex + 1}`}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleCorrectEditOption(optionIndex)
                                  }
                                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                    option.isCorrect
                                      ? "bg-emerald-600 text-white"
                                      : "border border-slate-300 text-slate-700"
                                  }`}
                                >
                                  {editQuestionType === "SINGLE_CHOICE"
                                    ? "Đáp án đúng"
                                    : "Đúng"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveEditOptionDraft(optionIndex)
                                  }
                                  disabled={editOptionDrafts.length <= 2}
                                  className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
                                >
                                  Xóa
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddEditOptionDraft}
                              className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              Thêm đáp án
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuestionWithOptions(question)
                              }
                              disabled={
                                updatingQuestionId === question.questionId
                              }
                              className="rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                            >
                              {updatingQuestionId === question.questionId
                                ? "Đang lưu..."
                                : "Lưu cập nhật"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditQuestion}
                              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {(question.options || []).length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {(question.options || []).map((option) => (
                            <li
                              key={option.optionId}
                              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1"
                            >
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  option.isCorrect
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {option.isCorrect ? "ĐÚNG" : "SAI"}
                              </span>
                              <span className="text-slate-700">
                                {option.optionText}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LessonQuizPage;
