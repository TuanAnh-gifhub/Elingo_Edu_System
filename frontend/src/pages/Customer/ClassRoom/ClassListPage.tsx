import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  classRoomService,
  type ClassRoomDto,
  type CreateClassRoomRequest,
} from "../../../services/classes/classRoomService";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import { reviewService } from "../../../services/reviews/reviewService";
import chatService from "../../../services/chats/chatService";
import { uploadToCloudinary } from "../../../services/upload/uploadService";
import { useAuth } from "../../../context/AuthContext";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { toast } from "react-toastify";

const MAX_POSTER_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CLASS_POSTER_UPLOAD_FOLDER = "class-posters";

const WEEKDAY_OPTIONS = [
  { value: "2", label: "Thứ 2", order: 2 },
  { value: "3", label: "Thứ 3", order: 3 },
  { value: "4", label: "Thứ 4", order: 4 },
  { value: "5", label: "Thứ 5", order: 5 },
  { value: "6", label: "Thứ 6", order: 6 },
  { value: "7", label: "Thứ 7", order: 7 },
  { value: "CN", label: "Chủ nhật", order: 8 },
];

const formatTimeToSchedule = (time: string): string => {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw || "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "";
  }

  if (minute === 0) {
    return `${hour}h`;
  }

  return `${hour}h${String(minute).padStart(2, "0")}`;
};

const buildScheduleText = (
  selectedDays: string[],
  startTime: string,
  endTime: string,
): string => {
  if (!selectedDays.length || !startTime || !endTime) {
    return "";
  }

  const dayLookup = new Map(WEEKDAY_OPTIONS.map((option) => [option.value, option]));
  const sortedDays = Array.from(new Set(selectedDays))
    .map((value) => dayLookup.get(value))
    .filter((value): value is (typeof WEEKDAY_OPTIONS)[number] => Boolean(value))
    .sort((first, second) => first.order - second.order)
    .map((day) => (day.value === "CN" ? "CN" : day.value));

  if (!sortedDays.length) {
    return "";
  }

  return `thứ ${sortedDays.join(" - ")} (${formatTimeToSchedule(startTime)}-${formatTimeToSchedule(endTime)})`;
};

const isTeacherRole = (role?: string): boolean => {
  if (!role) {
    return false;
  }

  const normalizedRole = role.toUpperCase();
  return (
    normalizedRole.includes("TEACHER") ||
    normalizedRole.includes("INSTRUCTOR") ||
    normalizedRole.includes("LECTURER")
  );
};

type ClassReviewSummary = {
  averageRating: number;
  totalReviews: number;
};

const renderRatingStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  for (let index = 0; index < 5; index += 1) {
    if (index < fullStars) {
      stars.push(<FaStar key={`full-${index}`} className="text-amber-400" />);
      continue;
    }

    if (index === fullStars && hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key={`half-${index}`} className="text-amber-400" />,
      );
      continue;
    }

    stars.push(<FaRegStar key={`empty-${index}`} className="text-slate-300" />);
  }

  return stars;
};

const formatClassDateTime = (dateValue?: string): string => {
  if (!dateValue) {
    return "Chưa cập nhật";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Chưa cập nhật";
  }

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isClassEnded = (endDate?: string): boolean => {
  if (!endDate) {
    return false;
  }

  const parsedDate = new Date(endDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return Date.now() > parsedDate.getTime();
};

const validatePosterFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return "Vui lòng chọn file ảnh hợp lệ (jpg, png, webp...).";
  }

  if (file.size > MAX_POSTER_FILE_SIZE_BYTES) {
    return "Ảnh poster không được vượt quá 5MB.";
  }

  return null;
};

const ClassListPage = () => {
  const [activeStudentTab, setActiveStudentTab] = useState<"all" | "enrolled">("all");
  const [classes, setClasses] = useState<ClassRoomDto[]>([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [studyDayInput, setStudyDayInput] = useState("");
  const [studyHourInput, setStudyHourInput] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [studyDay, setStudyDay] = useState("");
  const [studyHour, setStudyHour] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [openingChatClassId, setOpeningChatClassId] = useState<string | null>(null);
  const [classReviewSummaryById, setClassReviewSummaryById] = useState<
    Record<string, ClassReviewSummary>
  >({});
  const [posterFileName, setPosterFileName] = useState("");
  const [createScheduleDays, setCreateScheduleDays] = useState<string[]>([]);
  const [createScheduleStartTime, setCreateScheduleStartTime] = useState("");
  const [createScheduleEndTime, setCreateScheduleEndTime] = useState("");
  const [createForm, setCreateForm] = useState<CreateClassRoomRequest>({
    className: "",
    description: "",
    teacherId: "",
    price: 0,
    startDate: "",
    endDate: "",
    maxStudents: 20,
    schedule: "",
    poster: "",
  });
  const navigate = useNavigate();
  const posterInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  const isTeacher = isTeacherRole(user?.role);

  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    setCreateForm((prev) => ({ ...prev, teacherId: user.userId }));
  }, [user?.userId]);

  useEffect(() => {
    setCreateForm((prev) => ({
      ...prev,
      schedule: buildScheduleText(
        createScheduleDays,
        createScheduleStartTime,
        createScheduleEndTime,
      ),
    }));
  }, [createScheduleDays, createScheduleStartTime, createScheduleEndTime]);

  useEffect(() => {
    if (isTeacher || !user?.userId) {
      setEnrolledClassIds([]);
      return;
    }

    const loadMyEnrollments = async () => {
      try {
        const enrollments = await enrollmentService.getMyEnrollments();
        setEnrolledClassIds(enrollments.map((item) => item.classId));
      } catch {
        setEnrolledClassIds([]);
      }
    };

    loadMyEnrollments();
  }, [isTeacher, user?.userId]);

  const loadClasses = useCallback(
    async (
      searchKeyword: string,
      filters: {
        minPrice?: number;
        maxPrice?: number;
        studyDay?: string;
        studyHour?: string;
      },
    ) => {
      try {
        setLoading(true);
        setError(null);
        const page = await classRoomService.getClasses(1, 20, {
          keyword: searchKeyword || undefined,
          teacherId: isTeacher ? user?.userId : undefined,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          studyDay: filters.studyDay,
          studyHour: filters.studyHour,
        });
        setClasses(page.data || []);
      } catch (e) {
        console.error("Failed to load classes", e);
        setError("Không thể tải danh sách lớp học");
      } finally {
        setLoading(false);
      }
    },
    [isTeacher, user?.userId],
  );

  useEffect(() => {
    loadClasses(keyword, { minPrice, maxPrice, studyDay, studyHour });
  }, [loadClasses, keyword, minPrice, maxPrice, studyDay, studyHour]);

  useEffect(() => {
    if (!classes.length) {
      setClassReviewSummaryById({});
      return;
    }

    let isCancelled = false;
    const classIds = Array.from(new Set(classes.map((item) => item.classId)));

    const loadReviewSummaries = async () => {
      const settledResults = await Promise.allSettled(
        classIds.map((classId) => reviewService.getClassReviewSummary(classId)),
      );

      if (isCancelled) {
        return;
      }

      const nextSummaries: Record<string, ClassReviewSummary> = {};
      settledResults.forEach((result, index) => {
        const classId = classIds[index];
        if (result.status === "fulfilled") {
          nextSummaries[classId] = {
            averageRating: Number(result.value.averageRating || 0),
            totalReviews: Number(result.value.totalReviews || 0),
          };
          return;
        }

        nextSummaries[classId] = {
          averageRating: 0,
          totalReviews: 0,
        };
      });

      setClassReviewSummaryById(nextSummaries);
    };

    void loadReviewSummaries();

    return () => {
      isCancelled = true;
    };
  }, [classes]);

  const parsePriceInput = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    setMinPrice(parsePriceInput(minPriceInput));
    setMaxPrice(parsePriceInput(maxPriceInput));
    setStudyDay(studyDayInput.trim());
    setStudyHour(studyHourInput.trim());
  };

  const handleClearSearch = () => {
    setKeywordInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setStudyDayInput("");
    setStudyHourInput("");
    setKeyword("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setStudyDay("");
    setStudyHour("");
  };

  const classesForTeacher = useMemo(() => {
    if (!user?.userId) {
      return classes;
    }

    const ownClasses = classes.filter(
      (classItem) => classItem.teacherId === user.userId,
    );
    return ownClasses.length > 0 ? ownClasses : classes;
  }, [classes, user?.userId]);

  const enrolledClassIdSet = useMemo(
    () => new Set(enrolledClassIds),
    [enrolledClassIds],
  );

  const classesForStudentView = useMemo(() => {
    if (activeStudentTab === "enrolled") {
      return classes.filter((item) => enrolledClassIdSet.has(item.classId));
    }
    return classes;
  }, [activeStudentTab, classes, enrolledClassIdSet]);

  const handleCreateClass = async () => {
    if (!createForm.className.trim()) {
      setError("Vui lòng nhập tên lớp học.");
      return;
    }

    if (!createForm.teacherId) {
      setError("Không xác định được giáo viên hiện tại.");
      return;
    }

    if (!createForm.startDate || !createForm.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return;
    }

    if (createScheduleDays.length === 0) {
      setError("Vui lòng chọn ít nhất một thứ học.");
      return;
    }

    if (!createScheduleStartTime || !createScheduleEndTime) {
      setError("Vui lòng chọn giờ bắt đầu và giờ kết thúc.");
      return;
    }

    if (createScheduleStartTime >= createScheduleEndTime) {
      setError("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
      return;
    }

    try {
      setCreatingClass(true);
      setError(null);

      const payload: CreateClassRoomRequest = {
        ...createForm,
        className: createForm.className.trim(),
        description: createForm.description.trim(),
        schedule: createForm.schedule.trim(),
        price: Number(createForm.price) || 0,
        maxStudents: Number(createForm.maxStudents) || 1,
        startDate: new Date(createForm.startDate).toISOString(),
        endDate: new Date(createForm.endDate).toISOString(),
        poster: createForm.poster?.trim() || undefined,
      };

      const created = await classRoomService.createClass(payload);
      setClasses((prev) => [created, ...prev]);
      setShowCreateForm(false);
      setCreateForm((prev) => ({
        ...prev,
        className: "",
        description: "",
        price: 0,
        startDate: "",
        endDate: "",
        maxStudents: 20,
        schedule: "",
        poster: "",
      }));
      setPosterFileName("");
      setCreateScheduleDays([]);
      setCreateScheduleStartTime("");
      setCreateScheduleEndTime("");
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Không thể tạo lớp học";
      setError(message);
    } finally {
      setCreatingClass(false);
    }
  };

  const handleUploadPoster = async (file: File) => {
    const validationError = validatePosterFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploadingPoster(true);
      setError(null);

      const uploaded = await uploadToCloudinary(file, {
        folder: CLASS_POSTER_UPLOAD_FOLDER,
      });

      if (!uploaded.success || !uploaded.data.url) {
        setError(uploaded.error || "Upload ảnh poster thất bại.");
        return;
      }

      setCreateForm((prev) => ({ ...prev, poster: uploaded.data.url }));
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload ảnh poster thất bại.";
      setError(message);
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleOpenTeacherChat = async (
    classId: string,
    teacherId?: string,
    teacherName?: string,
  ) => {
    if (!teacherId) {
      toast.error("Không tìm thấy thông tin giáo viên để nhắn tin.");
      return;
    }

    if (!currentUserId) {
      toast.info("Vui lòng đăng nhập để nhắn tin giáo viên.");
      navigate("/");
      return;
    }

    if (teacherId === currentUserId) {
      toast.info("Đây là lớp của bạn.");
      return;
    }

    try {
      setOpeningChatClassId(classId);
      const response = await chatService.openDirectConversation(teacherId);
      window.dispatchEvent(
        new CustomEvent("OPEN_CHAT_WITH_USER", {
          detail: {
            userId: teacherId,
            userName: teacherName || "Giáo viên",
            conversationId: response.result?.conversationId || null,
          },
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể mở cuộc trò chuyện với giáo viên.";
      toast.error(message);
    } finally {
      setOpeningChatClassId(null);
    }
  };

  const toggleCreateScheduleDay = (dayValue: string) => {
    setCreateScheduleDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((value) => value !== dayValue)
        : [...prev, dayValue],
    );
  };

  const renderSearchBar = () => (
    <form
      onSubmit={handleSearchSubmit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="text"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          placeholder="Tìm lớp học theo tên, mô tả..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          min={0}
          value={minPriceInput}
          onChange={(event) => setMinPriceInput(event.target.value)}
          placeholder="Giá từ"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          min={0}
          value={maxPriceInput}
          onChange={(event) => setMaxPriceInput(event.target.value)}
          placeholder="Giá đến"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <select
          value={studyDayInput}
          onChange={(event) => setStudyDayInput(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">Tất cả thứ học</option>
          <option value="thứ 2">Thứ 2</option>
          <option value="thứ 3">Thứ 3</option>
          <option value="thứ 4">Thứ 4</option>
          <option value="thứ 5">Thứ 5</option>
          <option value="thứ 6">Thứ 6</option>
          <option value="thứ 7">Thứ 7</option>
          <option value="chủ nhật">Chủ nhật</option>
        </select>
        <input
          type="text"
          value={studyHourInput}
          onChange={(event) => setStudyHourInput(event.target.value)}
          placeholder="Giờ học (vd: 7h30-10h)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={handleClearSearch}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Xóa
        </button>
      </div>
    </form>
  );

  if (isTeacher) {
    if (loading) return <div className="p-6">Đang tải lớp học của bạn...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-cyan-50 to-blue-50 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 mb-3">
                Teacher Studio
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Lớp học của giáo viên
              </h1>
              <p className="text-slate-600 mt-1">
                Nhấn vào từng lớp để vào trang quản lý khóa học, học sinh và
                feedback.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold hover:brightness-105 transition shadow-md"
            >
              {showCreateForm ? "Đóng" : "Tạo lớp học"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500 mt-1">
              Tổng số lớp hiện có: {classesForTeacher.length}
            </p>
          </div>
        </div>

        {showCreateForm && (
          <div className="rounded-2xl border border-cyan-100 bg-linear-to-br from-white via-cyan-50/70 to-sky-50/70 p-4 md:p-5 space-y-3 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Tạo lớp học mới
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Tên lớp học</span>
                <input
                  value={createForm.className}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      className: event.target.value,
                    }))
                  }
                  placeholder="Nhập tên lớp học"
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Học phí (VNĐ)</span>
                <input
                  type="number"
                  min={0}
                  value={createForm.price}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      price: Number(event.target.value) || 0,
                    }))
                  }
                  placeholder="Nhập học phí"
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Lịch học</span>
                <div className="rounded-xl border border-slate-300 p-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map((option) => {
                      const selected = createScheduleDays.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleCreateScheduleDay(option.value)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            selected
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 text-xs text-slate-600">
                      <span>Giờ bắt đầu</span>
                      <input
                        type="time"
                        value={createScheduleStartTime}
                        onChange={(event) =>
                          setCreateScheduleStartTime(event.target.value)
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-slate-600">
                      <span>Giờ kết thúc</span>
                      <input
                        type="time"
                        value={createScheduleEndTime}
                        onChange={(event) =>
                          setCreateScheduleEndTime(event.target.value)
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    {createForm.schedule || "Chưa chọn lịch học."}
                  </p>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Số học sinh tối đa</span>
                <input
                  type="number"
                  min={1}
                  value={createForm.maxStudents}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      maxStudents: Number(event.target.value) || 1,
                    }))
                  }
                  placeholder="Nhập sĩ số tối đa"
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Ngày bắt đầu</span>
                <input
                  type="datetime-local"
                  value={createForm.startDate}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Ngày kết thúc</span>
                <input
                  type="datetime-local"
                  value={createForm.endDate}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-medium">Mô tả lớp học</span>
              <textarea
                rows={3}
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Nhập mô tả lớp học"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Ảnh poster lớp học
              </p>
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  setPosterFileName(file.name);
                  handleUploadPoster(file);
                  event.target.value = "";
                }}
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  disabled={uploadingPoster}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {uploadingPoster ? "Đang upload ảnh..." : "Chọn ảnh poster"}
                </button>

                {posterFileName ? (
                  <span className="text-sm text-slate-500">
                    {posterFileName}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Chưa chọn ảnh</span>
                )}
              </div>

              {createForm.poster ? (
                <div className="w-full max-w-xs rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={createForm.poster}
                    alt="Poster preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCreateClass}
                disabled={creatingClass}
                className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold hover:brightness-105 disabled:opacity-60"
              >
                {creatingClass ? "Đang tạo..." : "Xác nhận tạo lớp"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {classesForTeacher.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/40 p-8 text-center text-slate-500">
            Bạn chưa có lớp học nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {classesForTeacher.map((classItem) => {
              const summary = classReviewSummaryById[classItem.classId];
              const rating = Number((summary?.averageRating ?? 0).toFixed(1));
              const totalReviews = summary?.totalReviews ?? 0;
              const ended = isClassEnded(classItem.endDate);

              return (
                <button
                  key={classItem.classId}
                  type="button"
                  onClick={() =>
                    navigate(`/classes/${classItem.classId}/manage`)
                  }
                  className="group aspect-square text-left rounded-3xl border border-sky-100 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="relative h-1/2 w-full overflow-hidden bg-slate-100">
                    {classItem.poster ? (
                      <img
                        src={classItem.poster}
                        alt={classItem.className}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-blue-100 via-cyan-100 to-teal-100" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/25 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 inline-flex rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                      Lớp học
                    </span>
                    {ended ? (
                      <span className="absolute top-3 right-3 inline-flex rounded-full bg-slate-900/85 text-white px-2.5 py-1 text-[11px] font-semibold">
                        Đã kết thúc
                      </span>
                    ) : null}
                  </div>

                  <div className="h-1/2 p-4 md:p-5 flex flex-col justify-between bg-linear-to-br from-white via-sky-50/40 to-cyan-50/50">
                    <div>
                      <h2 className="text-lg md:text-xl font-extrabold text-slate-900 line-clamp-2 min-h-14 leading-snug">
                        {classItem.className}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                        {classItem.schedule || "Lớp học trực tuyến"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        Bắt đầu: {formatClassDateTime(classItem.startDate)}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        Kết thúc: {formatClassDateTime(classItem.endDate)}
                      </p>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          {renderRatingStars(rating)}
                        </div>
                        <span className="font-medium text-slate-700">
                          {totalReviews > 0 ? `${rating}/5 (${totalReviews})` : "Chưa có đánh giá"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          {classItem.currentStudents ?? 0}/
                          {classItem.maxStudents ?? 0} học sinh
                        </span>
                        <span className="text-white font-semibold bg-linear-to-r from-blue-600 to-cyan-500 rounded-full px-3 py-1">
                          {Number(classItem.price || 0).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="p-6">Đang tải danh sách lớp học…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách lớp học</h1>
      <div className="rounded-2xl border border-cyan-100 bg-white p-2 flex flex-wrap gap-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveStudentTab("all")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeStudentTab === "all"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
              : "bg-slate-100 text-slate-600 hover:bg-cyan-100"
          }`}
        >
          Lớp học tìm kiếm
        </button>
        <button
          type="button"
          onClick={() => setActiveStudentTab("enrolled")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeStudentTab === "enrolled"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
              : "bg-slate-100 text-slate-600 hover:bg-cyan-100"
          }`}
        >
          Lớp đã gia nhập
        </button>
      </div>
      {renderSearchBar()}
      {classesForStudentView.length === 0 ? (
        <div>Chưa có lớp học nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesForStudentView.map((classItem) => {
            const summary = classReviewSummaryById[classItem.classId];
            const rating = Number((summary?.averageRating ?? 0).toFixed(1));
            const totalReviews = summary?.totalReviews ?? 0;
            const ended = isClassEnded(classItem.endDate);

            return (
              <div
                key={classItem.classId}
                onClick={() =>
                  navigate(
                    enrolledClassIdSet.has(classItem.classId)
                      ? `/classes/${classItem.classId}/learning`
                      : `/classes/${classItem.classId}`,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(
                      enrolledClassIdSet.has(classItem.classId)
                        ? `/classes/${classItem.classId}/learning`
                        : `/classes/${classItem.classId}`,
                    );
                  }
                }}
                role="button"
                tabIndex={0}
                className="group text-left rounded-3xl border border-sky-100 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  {classItem.poster ? (
                    <img
                      src={classItem.poster}
                      alt={classItem.className}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-blue-100 via-cyan-100 to-teal-100" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/25 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 inline-flex rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                    Lớp học
                  </span>
                  {ended ? (
                    <span className="absolute top-3 right-3 inline-flex rounded-full bg-slate-900/85 text-white px-2.5 py-1 text-[11px] font-semibold">
                      Đã kết thúc
                    </span>
                  ) : null}
                </div>

                <div className="p-4 md:p-5 flex flex-col justify-between gap-3 bg-linear-to-br from-white via-sky-50/40 to-cyan-50/50 min-h-[190px]">
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {classItem.className}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2 min-h-10">
                      {classItem.schedule || "Lớp học trực tuyến"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      Bắt đầu: {formatClassDateTime(classItem.startDate)}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      Kết thúc: {formatClassDateTime(classItem.endDate)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        {renderRatingStars(rating)}
                      </div>
                      <span className="font-medium text-slate-700">
                        {totalReviews > 0 ? `${rating}/5 (${totalReviews})` : "Chưa có đánh giá"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600">
                        {classItem.currentStudents ?? 0}/{classItem.maxStudents ?? 0} học sinh
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenTeacherChat(
                              classItem.classId,
                              classItem.teacherId,
                              classItem.teacherName,
                            );
                          }}
                          disabled={openingChatClassId === classItem.classId}
                          className="rounded-full border border-cyan-300 px-3 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-60"
                        >
                          {openingChatClassId === classItem.classId
                            ? "Đang mở..."
                            : "Nhắn tin"}
                        </button>
                        <span className="text-white font-semibold bg-linear-to-r from-blue-600 to-cyan-500 rounded-full px-3 py-1">
                          {Number(classItem.price || 0).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassListPage;
