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
  optionsText: string;
  correctOptionIndex?: number;
  maxScore: number;
};

const toLocalDateTime = (value?: string) => {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      optionsText: "",
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
        optionsText: "",
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
        optionsText: "",
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
      const options = item.optionsText
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
      return (
        options.length < 2 ||
        item.correctOptionIndex === undefined ||
        item.correctOptionIndex < 0 ||
        item.correctOptionIndex >= options.length
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
            ? item.optionsText
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean)
            : undefined,
        correctOptionIndex:
          item.questionType === "MULTIPLE_CHOICE" ? item.correctOptionIndex : undefined,
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
          clearDeadline: shouldClearDeadline,
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
          optionsText: (question.options || []).join("\n"),
          correctOptionIndex: question.correctOptionIndex,
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

  if (!canManage) {
    return <div className="max-w-4xl mx-auto p-6">Trang nay danh cho giao vien.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quan ly bai tap</h1>

      <div className="border rounded p-4 bg-white shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">
          {editingAssignmentId ? "Cap nhat bai tap" : "Tao bai tap moi"}
        </h2>

        <select
          className="w-full border rounded px-3 py-2"
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
            className="w-full border rounded px-3 py-2"
            placeholder="Hoac nhap classId"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
        )}

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Tieu de"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded px-3 py-2 min-h-[100px]"
          placeholder="Mo ta"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="space-y-1">
          <label className="text-sm text-gray-700 block">Han nop bai (tuy chon)</label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
            className="border rounded px-3 py-2"
            value={deadline}
            disabled={noDeadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              if (e.target.value) {
                setNoDeadline(false);
              }
            }}
          />
          <p className="text-xs text-gray-500">Khong nhap = khong het han.</p>
        </div>

        <div className="border rounded p-3 bg-gray-50 space-y-3">
          <h3 className="font-semibold">Cau hinh truy cap bai tap</h3>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={passwordEnabled}
              onChange={(e) => setPasswordEnabled(e.target.checked)}
            />
            <span>Yeu cau hoc vien nhap mat khau khi lam bai</span>
          </label>

          {passwordEnabled ? (
            <div className="space-y-1">
              <label className="text-sm text-gray-700 block">Mat khau bai tap</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                placeholder={editingAssignmentId ? "Nhap mat khau moi (de trong de giu nguyen mat khau cu)" : "Nhap mat khau bai tap"}
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600">Tat yeu cau mat khau: hoc vien co the vao lam bai truc tiep.</p>
          )}

          <div className="space-y-1">
            <label className="text-sm text-gray-700 block">So lan lam toi da cho moi hoc vien</label>
            <input
              type="number"
              min={1}
              className="border rounded px-3 py-2"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value || 1))}
            />
            <p className="text-xs text-gray-500">Vi du: 1 = moi hoc vien chi duoc nop 1 lan.</p>
          </div>

          <div className="space-y-1">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!timeLimitEnabled}
                onChange={(e) => setTimeLimitEnabled(!e.target.checked)}
              />
              <span>Khong gioi han thoi gian lam bai</span>
            </label>
            <label className="text-sm text-gray-700 block">Thoi gian lam bai (phut)</label>
            <input
              type="number"
              min={1}
              disabled={!timeLimitEnabled}
              className="border rounded px-3 py-2"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Number(e.target.value || 1))}
            />
            <p className="text-xs text-gray-500">Het thoi gian se tu dong nop bai.</p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span>Kich hoat assignment</span>
        </label>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Cau {question.questionOrder}</h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 text-sm"
                  >
                    Xoa
                  </button>
                )}
              </div>

              <select
                className="border rounded px-3 py-2"
                value={question.questionType}
                onChange={(e) =>
                  updateQuestion(index, {
                    questionType: e.target.value as AssignmentQuestionType,
                    optionsText: "",
                    correctOptionIndex: undefined,
                  })
                }
              >
                <option value="TEXT">TEXT</option>
                <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                <option value="AUDIO">AUDIO</option>
              </select>

              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Noi dung cau hoi"
                value={question.questionContent}
                onChange={(e) => updateQuestion(index, { questionContent: e.target.value })}
              />

              {question.questionType === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder="Moi dong la 1 dap an"
                    value={question.optionsText}
                    onChange={(e) => updateQuestion(index, { optionsText: e.target.value })}
                  />
                  <input
                    type="number"
                    className="border rounded px-3 py-2"
                    placeholder="Vi tri dap an dung (bat dau tu 0)"
                    value={question.correctOptionIndex ?? ""}
                    onChange={(e) =>
                      updateQuestion(index, {
                        correctOptionIndex:
                          e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}

              <input
                type="number"
                className="border rounded px-3 py-2"
                value={question.maxScore}
                onChange={(e) => updateQuestion(index, { maxScore: Number(e.target.value) })}
              />
            </div>
          ))}

          <button onClick={addQuestion} className="px-3 py-2 rounded border">
            Them cau hoi
          </button>
        </div>

        <div>Tong diem: {totalScore}</div>

        {error && <div className="text-red-500">{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {saving
            ? "Dang luu..."
            : editingAssignmentId
              ? "Cap nhat bai tap"
              : "Tao bai tap"}
        </button>
        {editingAssignmentId && (
          <button onClick={resetForm} className="ml-2 px-4 py-2 rounded border">
            Huy chinh sua
          </button>
        )}
      </div>

      <div className="border rounded p-4 bg-white shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Bai tap da tao</h2>
        {loading && <div>Dang tai...</div>}
        {!loading && items.length === 0 && <div>Chua co bai tap nao.</div>}
        {items.map((item) => (
          <div key={item.assignmentId} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-gray-600">Class: {item.classId}</div>
              <div className="text-sm text-gray-600">
                Trang thai: {item.active ? "Dang mo" : "Da khoa"}
              </div>
              <div className="text-sm text-gray-600">
                Mat khau: {item.passwordRequired ? "Co" : "Khong"} | So lan lam toi da: {item.maxAttempts || 1}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(item)}
                className="px-3 py-2 rounded bg-amber-500 text-white"
              >
                Sua
              </button>
              <Link
                to={`/teacher/assignments/${item.assignmentId}/submissions`}
                className="px-3 py-2 rounded bg-green-600 text-white"
              >
                Xem bai nop
              </Link>
              <button
                onClick={() => handleDelete(item.assignmentId)}
                className="px-3 py-2 rounded bg-red-600 text-white"
              >
                Xoa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherAssignmentPage;

