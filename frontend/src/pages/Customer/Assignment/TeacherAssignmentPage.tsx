import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AxiosError } from "axios";
import { useAuth } from "../../../context/AuthContext";
import { classRoomService, type ClassRoomDto } from "../../../services/classes/classRoomService";
import assignmentService, {
  type Assignment,
  type AssignmentQuestionType,
  type CreateAssignmentPayload,
  type UpdateAssignmentPayload,
} from "../../../services/assignments/assignmentService";

type QuestionDraft = {
  questionOrder: number;
  questionType: AssignmentQuestionType;
  questionContent: string;
  options: string[];
  correctOptionIndexes: number[];
  maxScore: number;
};

const toLocalDateTime = (value?: string) => {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const optionLabel = (index: number) => String.fromCharCode(65 + (index % 26));

const normalizeIndexes = (indexes: number[]) =>
  Array.from(new Set(indexes.filter((item) => Number.isInteger(item) && item >= 0))).sort(
    (a, b) => a - b,
  );

const TeacherAssignmentPage = () => {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [noDeadline, setNoDeadline] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);
  const [active, setActive] = useState(true);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<ClassRoomDto[]>([]);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      questionOrder: 1,
      questionType: "TEXT",
      questionContent: "",
      options: ["", ""],
      correctOptionIndexes: [],
      maxScore: 10,
    },
  ]);

  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === "TEACHER";

  const loadAssignments = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const data = await assignmentService.getAssignments({
        page: 1,
        size: 20,
        teacherId: user.userId,
        active: true,
      });
      setItems(data.data || []);
    } catch (e) {
      console.error(e);
      setError("Khong the tai danh sach bai tap");
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  const loadClasses = async () => {
    try {
      const data = await classRoomService.getClasses(1, 100);
      setClassOptions(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    loadClasses();
  }, []);

  const totalScore = useMemo(
    () => questions.reduce((sum, item) => sum + Number(item.maxScore || 0), 0),
    [questions],
  );

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionOrder: prev.length + 1,
        questionType: "TEXT",
        questionContent: "",
        options: ["", ""],
        correctOptionIndexes: [],
        maxScore: 10,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, questionOrder: idx + 1 })),
    );
  };

  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === index ? { ...q, ...patch } : q)));
  };

  const addOption = (questionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question, idx) =>
        idx === questionIndex ? { ...question, options: [...question.options, ""] } : question,
      ),
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      }),
    );
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;
        if (question.options.length <= 2) return question;

        const nextOptions = question.options.filter((_, itemIndex) => itemIndex !== optionIndex);
        const nextCorrectOptionIndexes = question.correctOptionIndexes
          .filter((itemIndex) => itemIndex !== optionIndex)
          .map((itemIndex) => (itemIndex > optionIndex ? itemIndex - 1 : itemIndex));

        return {
          ...question,
          options: nextOptions,
          correctOptionIndexes: normalizeIndexes(nextCorrectOptionIndexes),
        };
      }),
    );
  };

  const toggleCorrectOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;

        const exists = question.correctOptionIndexes.includes(optionIndex);
        const nextCorrectOptionIndexes = exists
          ? question.correctOptionIndexes.filter((item) => item !== optionIndex)
          : [...question.correctOptionIndexes, optionIndex];

        return {
          ...question,
          correctOptionIndexes: normalizeIndexes(nextCorrectOptionIndexes),
        };
      }),
    );
  };

  const resetForm = () => {
    setEditingAssignmentId(null);
    setTitle("");
    setDescription("");
    setClassId("");
    setDeadline("");
    setNoDeadline(true);
    setPasswordEnabled(false);
    setAccessPassword("");
    setMaxAttempts(1);
    setTimeLimitEnabled(false);
    setTimeLimitMinutes(30);
    setActive(true);
    setQuestions([
      {
        questionOrder: 1,
        questionType: "TEXT",
        questionContent: "",
        options: ["", ""],
        correctOptionIndexes: [],
        maxScore: 10,
      },
    ]);
  };

  const handleSave = async () => {
    if (!canManage) return;

    if (!title.trim() || !classId.trim()) {
      setError("Vui long nhap classId va tieu de");
      return;
    }

    if (!UUID_REGEX.test(classId.trim())) {
      setError("classId khong dung dinh dang UUID.");
      return;
    }

    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
      setError("So lan lam toi da phai lon hon hoac bang 1.");
      return;
    }

    if (timeLimitEnabled && (!Number.isFinite(timeLimitMinutes) || timeLimitMinutes < 1)) {
      setError("Thoi gian lam bai phai lon hon hoac bang 1 phut.");
      return;
    }

    if (passwordEnabled && !editingAssignmentId && !accessPassword.trim()) {
      setError("Vui long nhap mat khau hoac tat yeu cau mat khau.");
      return;
    }

    const hasInvalidQuestion = questions.some((item) => {
      if (!item.questionContent.trim() || item.maxScore <= 0) return true;
      if (item.questionType !== "MULTIPLE_CHOICE") return false;

      const options = item.options.map((v) => v.trim());
      const hasBlankOption = options.some((value) => !value);
      if (hasBlankOption) return true;

      const correctOptionIndexes = normalizeIndexes(item.correctOptionIndexes);

      return (
        options.length < 2 ||
        correctOptionIndexes.length === 0 ||
        correctOptionIndexes.some((index) => index < 0 || index >= options.length)
      );
    });

    if (hasInvalidQuestion) {
      setError("Vui long kiem tra cau hoi, dap an va diem so hop le.");
      return;
    }

    const basePayload = {
      classId,
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: toLocalDateTime(deadline),
      accessPassword: accessPassword.trim() || undefined,
      maxAttempts,
      timeLimitMinutes: timeLimitEnabled ? timeLimitMinutes : undefined,
      questions: questions.map((item) => ({
        questionOrder: item.questionOrder,
        questionType: item.questionType,
        questionContent: item.questionContent.trim(),
        options:
          item.questionType === "MULTIPLE_CHOICE"
            ? item.options.map((v) => v.trim())
            : undefined,
        correctOptionIndex:
          item.questionType === "MULTIPLE_CHOICE"
            ? normalizeIndexes(item.correctOptionIndexes)[0]
            : undefined,
        correctOptionIndexes:
          item.questionType === "MULTIPLE_CHOICE"
            ? normalizeIndexes(item.correctOptionIndexes)
            : undefined,
        maxScore: item.maxScore,
      })),
    };

    setSaving(true);
    setError(null);
    try {
      if (editingAssignmentId) {
        const shouldClearDeadline = !deadline.trim();
        const updateAccessPassword = !passwordEnabled ? "" : basePayload.accessPassword;
        const payload: UpdateAssignmentPayload = {
          title: basePayload.title,
          description: basePayload.description,
          deadline: shouldClearDeadline ? undefined : basePayload.deadline,
          accessPassword: updateAccessPassword,
          maxAttempts: basePayload.maxAttempts,
          timeLimitMinutes: basePayload.timeLimitMinutes,
          clearTimeLimit: !timeLimitEnabled,
          active,
          questions: basePayload.questions,
        };
        await assignmentService.updateAssignment(editingAssignmentId, payload);
      } else {
        const payload: CreateAssignmentPayload = {
          classId: basePayload.classId,
          title: basePayload.title,
          description: basePayload.description,
          deadline: basePayload.deadline,
          accessPassword: passwordEnabled ? basePayload.accessPassword : undefined,
          maxAttempts: basePayload.maxAttempts,
          timeLimitMinutes: basePayload.timeLimitMinutes,
          questions: basePayload.questions,
        };
        await assignmentService.createAssignment(payload);
      }
      resetForm();
      await loadAssignments();
    } catch (e) {
      console.error(e);
      const apiError = e as AxiosError<{ message?: string }>;
      const message = apiError.response?.data?.message || "";
      if (message.includes("Malformed JSON request")) {
        setError("Du lieu gui len khong dung dinh dang (kiem tra classId/deadline).");
      } else {
        setError(message || "Luu bai tap that bai");
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: Assignment) => {
    setEditingAssignmentId(item.assignmentId);
    setTitle(item.title);
    setDescription(item.description || "");
    setClassId(item.classId);
    setDeadline(item.deadline ? item.deadline.slice(0, 16) : "");
    setNoDeadline(!item.deadline);
    setPasswordEnabled(item.passwordRequired);
    setAccessPassword("");
    setMaxAttempts(item.maxAttempts || 1);
    setTimeLimitEnabled((item.timeLimitMinutes || 0) > 0);
    setTimeLimitMinutes(item.timeLimitMinutes || 30);
    setActive(item.active);
    setQuestions(
      [...item.questions]
        .sort((a, b) => a.questionOrder - b.questionOrder)
        .map((question) => ({
          questionOrder: question.questionOrder,
          questionType: question.questionType,
          questionContent: question.questionContent,
          options:
            question.questionType === "MULTIPLE_CHOICE"
              ? (question.options && question.options.length > 0 ? question.options : ["", ""])
              : ["", ""],
          correctOptionIndexes:
            question.questionType === "MULTIPLE_CHOICE"
              ? normalizeIndexes(
                  question.correctOptionIndexes && question.correctOptionIndexes.length > 0
                    ? question.correctOptionIndexes
                    : question.correctOptionIndex !== undefined
                      ? [question.correctOptionIndex]
                      : [],
                )
              : [],
          maxScore: question.maxScore,
        })),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
      await loadAssignments();
    } catch (e) {
      console.error(e);
      setError("Xoa bai tap that bai");
    }
  };

  const totalAssignments = items.length;
  const totalQuestions = questions.length;
  const activeAssignments = items.filter((item) => item.active).length;

  const formatDeadline = (value?: string) => {
    if (!value) return "Khong co han nop";
    return new Date(value).toLocaleString("vi-VN");
  };

  if (!canManage) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Trang nay danh cho giao vien.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Quan ly bai tap</h1>
              <p className="mt-1 text-sm text-blue-100 md:text-base">
                Tao, cap nhat va theo doi assignment cho hoc vien theo phong cach trinh bay ro rang, hien dai.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/15 p-3 text-sm backdrop-blur">
              <div className="rounded-lg bg-white/10 px-3 py-2">
                <div className="text-blue-100">Tong bai tap</div>
                <div className="text-lg font-semibold">{totalAssignments}</div>
              </div>
              <div className="rounded-lg bg-white/10 px-3 py-2">
                <div className="text-blue-100">Dang mo</div>
                <div className="text-lg font-semibold">{activeAssignments}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <section className="xl:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingAssignmentId ? "Cap nhat bai tap" : "Tao bai tap moi"}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {editingAssignmentId ? "Editing" : "New assignment"}
                </span>
              </div>

              <div className="space-y-4">
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={!!editingAssignmentId}
                >
                  <option value="">Chon lop hoc</option>
                  {classOptions.map((item) => (
                    <option key={item.classId} value={item.classId}>
                      {item.className} ({item.classId})
                    </option>
                  ))}
                </select>

                {!editingAssignmentId && (
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Hoac nhap classId"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  />
                )}

                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Tieu de"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Mo ta"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-800">Han nop bai (tuy chon)</label>
                  <label className="mb-2 inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={noDeadline}
                      onChange={(e) => {
                        setNoDeadline(e.target.checked);
                        if (e.target.checked) {
                          setDeadline("");
                        }
                      }}
                    />
                    <span>Bai tap khong co han nop</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={deadline}
                    disabled={noDeadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      if (e.target.value) {
                        setNoDeadline(false);
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">Khong nhap = khong het han.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <h3 className="font-semibold text-slate-900">Cau hinh truy cap bai tap</h3>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={passwordEnabled}
                      onChange={(e) => setPasswordEnabled(e.target.checked)}
                    />
                    <span>Yeu cau hoc vien nhap mat khau khi lam bai</span>
                  </label>

                  {passwordEnabled ? (
                    <div className="space-y-1">
                      <label className="block text-sm text-slate-700">Mat khau bai tap</label>
                      <input
                        type="password"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder={editingAssignmentId ? "Nhap mat khau moi (de trong de giu nguyen mat khau cu)" : "Nhap mat khau bai tap"}
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Tat yeu cau mat khau: hoc vien co the vao lam bai truc tiep.</p>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm text-slate-700">So lan lam toi da</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(Number(e.target.value || 1))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={!timeLimitEnabled}
                          onChange={(e) => setTimeLimitEnabled(!e.target.checked)}
                        />
                        <span>Khong gioi han thoi gian</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        disabled={!timeLimitEnabled}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(Number(e.target.value || 1))}
                      />
                    </div>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <span>Kich hoat assignment</span>
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Danh sach cau hoi</h3>
                    <span className="text-sm text-slate-500">{totalQuestions} cau hoi</span>
                  </div>

                  {questions.map((question, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800">Cau {question.questionOrder}</h4>
                        {questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-sm font-medium text-red-600 transition hover:text-red-700"
                          >
                            Xoa
                          </button>
                        )}
                      </div>

                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={question.questionType}
                        onChange={(e) =>
                          updateQuestion(index, {
                            questionType: e.target.value as AssignmentQuestionType,
                            options: ["", ""],
                            correctOptionIndexes: [],
                          })
                        }
                      >
                        <option value="TEXT">TEXT</option>
                        <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                        <option value="AUDIO">AUDIO</option>
                      </select>

                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Noi dung cau hoi"
                        value={question.questionContent}
                        onChange={(e) => updateQuestion(index, { questionContent: e.target.value })}
                      />

                      {question.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500">
                            Chon mot hoac nhieu dap an dung. Ban co the them khong gioi han dap an.
                          </p>

                          {question.options.map((option, optionIndex) => (
                            <div
                              key={`${index}-${optionIndex}`}
                              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 md:flex-row md:items-center"
                            >
                              <label className="inline-flex items-center gap-2 text-sm text-slate-700 md:w-52">
                                <input
                                  type="checkbox"
                                  checked={question.correctOptionIndexes.includes(optionIndex)}
                                  onChange={() => toggleCorrectOption(index, optionIndex)}
                                />
                                <span>Dap an dung {optionLabel(optionIndex)}</span>
                              </label>

                              <input
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder={`Noi dung dap an ${optionLabel(optionIndex)}`}
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              />

                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                disabled={question.options.length <= 2}
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Xoa
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            + Them dap an
                          </button>
                        </div>
                      )}

                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={question.maxScore}
                        onChange={(e) => updateQuestion(index, { maxScore: Number(e.target.value) })}
                      />
                    </div>
                  ))}

                  <button
                    onClick={addQuestion}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Them cau hoi
                  </button>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  Tong diem hien tai: <span className="font-semibold">{totalScore}</span>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Dang luu..."
                      : editingAssignmentId
                        ? "Cap nhat bai tap"
                        : "Tao bai tap"}
                  </button>
                  {editingAssignmentId && (
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Huy chinh sua
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="xl:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Bai tap da tao</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {totalAssignments} bai tap
                </span>
              </div>

              {loading && <div className="text-sm text-slate-600">Dang tai...</div>}

              {!loading && items.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  Chua co bai tap nao.
                </div>
              )}

              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.assignmentId}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">Class: {item.classId}</div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.active ? "Dang mo" : "Da khoa"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div>Deadline: {formatDeadline(item.deadline)}</div>
                      <div>Mat khau: {item.passwordRequired ? "Co" : "Khong"}</div>
                      <div>So lan lam toi da: {item.maxAttempts || 1}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                      >
                        Sua
                      </button>
                      <Link
                        to={`/teacher/assignments/${item.assignmentId}/submissions`}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                      >
                        Xem bai nop
                      </Link>
                      <button
                        onClick={() => handleDelete(item.assignmentId)}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        Xoa
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentPage;

