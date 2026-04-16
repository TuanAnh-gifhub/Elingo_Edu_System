import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { IconType } from "react-icons";
import {
  FiChevronDown,
  FiChevronUp,
  FiFile,
  FiFileText,
  FiImage,
  FiMusic,
  FiVideo,
} from "react-icons/fi";
import { FaFilePowerpoint } from "react-icons/fa";
import {
  classRoomService,
  type ClassRoomDto,
  type OnlineClassAccessDto,
} from "../../../services/classes/classRoomService";
import {
  courseService,
  type CourseDto,
} from "../../../services/courses/courseService";
import { quizService, type QuizDto } from "../../../services/quizzes/quizService";
import {
  studentQuizService,
  type QuizAttemptSummary,
} from "../../../services/quizzes/studentQuizService";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import type { EnrollmentResponse } from "../../../services/classes/enrollmentService";
import RichTextContent from "../../../components/common/RichTextContent";
import { createJitsiRoom, type JitsiApi } from "../../../utils/jitsiHelper";
import websocketService from "../../../services/chats/websocketService";

type StudentTab = "overview" | "courses" | "quizzes" | "students" | "online";

interface QuizStatusEvent {
  classId: string;
  courseId: string;
  quizId: string;
  title?: string;
  isOpen: boolean;
  maxAttempts?: number;
  durationMinutes?: number;
}

interface ClassLiveStatusEvent {
  classId: string;
  onlineOpen: boolean;
}

const getExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
};

const getFileNameFromUrl = (fileUrl: string, index: number): string => {
  try {
    const url = new URL(fileUrl);
    const fileName = decodeURIComponent(
      url.pathname.split("/").pop() || "",
    ).trim();
    return fileName || `tep-dinh-kem-${index + 1}`;
  } catch {
    const fallback = decodeURIComponent(fileUrl.split("/").pop() || "").trim();
    return fallback || `tep-dinh-kem-${index + 1}`;
  }
};

const getFileTypeBadge = (extension: string) => {
  switch (extension) {
    case "pdf":
      return { label: "PDF", className: "bg-rose-100 text-rose-700" };
    case "doc":
    case "docx":
      return { label: "WORD", className: "bg-blue-100 text-blue-700" };
    case "xls":
    case "xlsx":
      return { label: "EXCEL", className: "bg-emerald-100 text-emerald-700" };
    case "ppt":
    case "pptx":
      return { label: "PPT", className: "bg-amber-100 text-amber-700" };
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
    case "aac":
    case "flac":
      return { label: "AUDIO", className: "bg-violet-100 text-violet-700" };
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif":
    case "bmp":
    case "svg":
      return { label: "IMAGE", className: "bg-cyan-100 text-cyan-700" };
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":
      return { label: "VIDEO", className: "bg-fuchsia-100 text-fuchsia-700" };
    default:
      return {
        label: extension ? extension.toUpperCase() : "FILE",
        className: "bg-slate-100 text-slate-700",
      };
  }
};

const getFileIcon = (
  extension: string,
): { icon: IconType; className: string } => {
  switch (extension) {
    case "ppt":
    case "pptx":
      return { icon: FaFilePowerpoint, className: "text-amber-600" };
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":
      return { icon: FiVideo, className: "text-fuchsia-600" };
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
    case "aac":
    case "flac":
      return { icon: FiMusic, className: "text-violet-600" };
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif":
    case "bmp":
    case "svg":
      return { icon: FiImage, className: "text-cyan-600" };
    case "pdf":
    case "doc":
    case "docx":
    case "xls":
    case "xlsx":
      return { icon: FiFileText, className: "text-slate-600" };
    default:
      return { icon: FiFile, className: "text-slate-500" };
  }
};

const formatAttemptTime = (submittedAt?: string): string => {
  if (!submittedAt) {
    return "-";
  }

  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("vi-VN");
};

const StudentClassLearningPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<StudentTab>("overview");
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassRoomDto | null>(null);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [classEnrollments, setClassEnrollments] = useState<EnrollmentResponse[]>([]);
  const [attemptsByQuizId, setAttemptsByQuizId] = useState<
    Record<string, QuizAttemptSummary[]>
  >({});
  const [loadingAttemptQuizIds, setLoadingAttemptQuizIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showOnlineClassModal, setShowOnlineClassModal] = useState(false);
  const [openingOnlineClass, setOpeningOnlineClass] = useState(false);
  const [onlineClassAccess, setOnlineClassAccess] = useState<OnlineClassAccessDto | null>(null);
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<JitsiApi | null>(null);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadAccessAndClass = async () => {
      try {
        setLoading(true);
        const enrolled = await enrollmentService.checkEnrollment(classId);
        if (!enrolled) {
          toast.warning("Bạn chưa enroll lớp này.");
          navigate(`/classes/${classId}`);
          return;
        }

        const classData = await classRoomService.getClassById(classId);
        setClassInfo(classData);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải lớp học.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadAccessAndClass();
  }, [classId, navigate]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await courseService.getCourses(1, 200, classId);
        setCourses(
          [...(response.data || [])].sort(
            (first, second) => first.orderIndex - second.orderIndex,
          ),
        );
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadQuizzes = async () => {
      try {
        setLoadingQuizzes(true);
        const firstPage = await quizService.getQuizzes(1, 100);
        let allQuizzes = firstPage.data || [];

        if (firstPage.totalPages > 1) {
          for (let page = 2; page <= firstPage.totalPages; page += 1) {
            const nextPage = await quizService.getQuizzes(page, 100);
            allQuizzes = [...allQuizzes, ...(nextPage.data || [])];
          }
        }

        setQuizzes(allQuizzes);
      } catch {
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    loadQuizzes();
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadClassStudents = async () => {
      try {
        setLoadingStudents(true);
        const enrollments = await enrollmentService.getClassEnrollments(classId);
        const sorted = [...enrollments].sort((first, second) => {
          const firstTime = new Date(first.enrollmentDate || first.createdAt || 0).getTime();
          const secondTime = new Date(second.enrollmentDate || second.createdAt || 0).getTime();
          return firstTime - secondTime;
        });
        setClassEnrollments(sorted);
      } catch {
        setClassEnrollments([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadClassStudents();
  }, [classId]);

  const quizzesOfClass = useMemo(() => {
    const courseIds = new Set(courses.map((course) => course.courseId));
    return quizzes.filter((quiz) => courseIds.has(quiz.courseId));
  }, [courses, quizzes]);

  useEffect(() => {
    if (activeTab !== "quizzes" || quizzesOfClass.length === 0) {
      return;
    }

    const loadAttempts = async (quizId: string) => {
      setLoadingAttemptQuizIds((prev) => {
        const next = new Set(prev);
        next.add(quizId);
        return next;
      });

      try {
        const attempts = await studentQuizService.getMyAttempts(quizId);
        setAttemptsByQuizId((prev) => ({
          ...prev,
          [quizId]: attempts,
        }));
      } catch {
        setAttemptsByQuizId((prev) => ({
          ...prev,
          [quizId]: [],
        }));
      } finally {
        setLoadingAttemptQuizIds((prev) => {
          const next = new Set(prev);
          next.delete(quizId);
          return next;
        });
      }
    };

    quizzesOfClass.forEach((quiz) => {
      if (attemptsByQuizId[quiz.quizId]) {
        return;
      }

      loadAttempts(quiz.quizId);
    });
  }, [activeTab, quizzesOfClass, attemptsByQuizId]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const topic = `/topic/classes/${classId}/quiz-status`;
    const unsubscribe = websocketService.onTopicMessage(
      topic,
      (event: QuizStatusEvent) => {
        if (!event?.quizId) {
          return;
        }

        setQuizzes((prev) =>
          prev.map((quiz) =>
            quiz.quizId === event.quizId
              ? {
                  ...quiz,
                  isOpen: Boolean(event.isOpen),
                  maxAttempts:
                    typeof event.maxAttempts === "number"
                      ? event.maxAttempts
                      : quiz.maxAttempts,
                  durationMinutes:
                    typeof event.durationMinutes === "number"
                      ? event.durationMinutes
                      : quiz.durationMinutes,
                }
              : quiz,
          ),
        );
      },
    );

    return () => unsubscribe();
  }, [classId]);

  const toggleCourseFiles = (courseId: string) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }

      return next;
    });
  };

  useEffect(() => {
    if (!classId) {
      return;
    }

    const topic = `/topic/classes/${classId}/live-status`;
    const unsubscribe = websocketService.onTopicMessage(
      topic,
      (event: ClassLiveStatusEvent) => {
        if (!event || event.classId !== classId) {
          return;
        }

        setClassInfo((prev) =>
          prev
            ? {
                ...prev,
                onlineOpen: Boolean(event.onlineOpen),
              }
            : prev,
        );

        if (!event.onlineOpen) {
          setShowOnlineClassModal(false);
          setOnlineClassAccess(null);
        }
      },
    );

    return () => unsubscribe();
  }, [classId]);

  const handleJoinOnlineClass = async () => {
    if (!classId) {
      return;
    }

    if (!classInfo?.onlineOpen) {
      toast.info("Giáo viên chưa mở lớp trực tuyến.");
      return;
    }

    try {
      setOpeningOnlineClass(true);
      const access = await classRoomService.getOnlineAccess(classId);
      setOnlineClassAccess(access);
      setShowOnlineClassModal(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bạn không có quyền tham gia phòng học trực tuyến này.";
      toast.error(message);
    } finally {
      setOpeningOnlineClass(false);
    }
  };

  useEffect(() => {
    if (!showOnlineClassModal || !onlineClassAccess || !jitsiContainerRef.current) {
      return;
    }

    const mountJitsi = async () => {
      try {
        jitsiApiRef.current = await createJitsiRoom({
          roomName: onlineClassAccess.roomName,
          roomPassword: onlineClassAccess.roomPassword,
          jwt: onlineClassAccess.jwt,
          parentNode: jitsiContainerRef.current as HTMLElement,
          isModerator: false,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể mở lớp học trực tuyến.";
        toast.error(message);
        setShowOnlineClassModal(false);
      } finally {
        setOpeningOnlineClass(false);
      }
    };

    mountJitsi();

    return () => {
      if (jitsiApiRef.current?.dispose) {
        jitsiApiRef.current.dispose();
      }
      jitsiApiRef.current = null;
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = "";
      }
    };
  }, [showOnlineClassModal, onlineClassAccess]);

  if (!classId) {
    return <div className="max-w-6xl mx-auto p-6">Thiếu classId trên URL.</div>;
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Đang tải lớp học...</div>;
  }

  if (!classInfo) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-red-500">
        Không thể tải dữ liệu lớp học.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 p-5 md:p-6 shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/classes")}
          className="text-sm text-blue-600 hover:underline"
        >
          Quay lại danh sách lớp học
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
          Lớp học của tôi: {classInfo.className}
        </h1>
        <p className="text-slate-600 mt-1">
          Theo dõi nội dung bài học và làm quiz trong lớp đã gia nhập.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/classes/${classId}/reviews`)}
          className="mt-3 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700"
        >
          Đánh giá lớp học
        </button>
      </div>

      <div className="rounded-2xl border border-cyan-100 bg-white p-2 flex flex-wrap gap-2 shadow-sm">
        {[
          { key: "overview", label: "Tổng quan" },
          { key: "courses", label: "Bài học" },
          { key: "quizzes", label: "Quiz" },
          { key: "students", label: "Học sinh" },
          { key: "online", label: "Lớp trực tuyến" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key as StudentTab)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === item.key
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-cyan-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Thông tin lớp học</h2>
          <RichTextContent
            content={classInfo.description}
            emptyFallback="Chưa có mô tả lớp học."
            className="text-slate-600 wrap-break-word [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1">
              Lịch học: {classInfo.schedule || "Chưa cập nhật"}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">
              Giảng viên: {classInfo.teacherName || "Đang cập nhật"}
            </span>
          </div>
        </section>
      ) : null}

      {activeTab === "courses" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Danh sách bài học</h2>
          {loadingCourses ? (
            <p className="text-slate-500 mt-3">Đang tải bài học...</p>
          ) : courses.length === 0 ? (
            <p className="text-slate-500 mt-3">Chưa có bài học.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {courses.map((course) => {
                const isExpanded = expandedCourseIds.has(course.courseId);

                return (
                  <article
                    key={course.courseId}
                    className="rounded-2xl border border-fuchsia-100 bg-linear-to-br from-rose-50 via-white to-cyan-50 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-100 to-cyan-100 border border-fuchsia-200 px-2.5 py-1 mb-2">
                          <span className="text-[10px] font-semibold tracking-wide text-fuchsia-700 uppercase">
                            Bài {course.orderIndex}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {course.description || "Chưa có mô tả bài học."}
                        </p>
                      </div>

                      {course.fileUrls.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleCourseFiles(course.courseId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
                        >
                          {isExpanded ? "Ẩn tài liệu" : "Mở tài liệu"}
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-500 mt-3">
                      {course.fileUrls.length} tài liệu đính kèm
                    </p>

                    {isExpanded && course.fileUrls.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        {course.fileUrls.map((fileUrl, index) => {
                          const fileName = getFileNameFromUrl(fileUrl, index);
                          const extension = getExtension(fileName);
                          const badge = getFileTypeBadge(extension);
                          const { icon: FileIcon, className } =
                            getFileIcon(extension);

                          return (
                            <div
                              key={`${course.courseId}-${fileUrl}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <FileIcon className={className} />
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 hover:underline truncate"
                              >
                                {fileName}
                              </a>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "quizzes" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quiz trong lớp</h2>
          {loadingQuizzes ? (
            <p className="text-slate-500 mt-3">Đang tải quiz...</p>
          ) : quizzesOfClass.length === 0 ? (
            <p className="text-slate-500 mt-3">Chưa có quiz.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {quizzesOfClass.map((quiz) => (
                <article
                  key={quiz.quizId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{quiz.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {quiz.description || "Chưa có mô tả quiz."}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Số lần làm tối đa: {quiz.maxAttempts}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Thời gian làm bài: {quiz.durationMinutes || 30} phút
                      </p>
                      <p className="text-xs mt-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${
                            quiz.isOpen
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {quiz.isOpen ? "Đang mở" : "Đang khóa"}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!quiz.isOpen}
                      onClick={() =>
                        navigate(`/classes/${classId}/quizzes/${quiz.quizId}/attempt`)
                      }
                      className="inline-flex items-center rounded-lg border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {quiz.isOpen ? "Bắt đầu làm bài" : "Quiz đang khóa"}
                    </button>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">
                      Lịch sử làm bài
                    </p>
                    {loadingAttemptQuizIds.has(quiz.quizId) ? (
                      <p className="text-xs text-slate-500 mt-2">
                        Đang tải lịch sử...
                      </p>
                    ) : attemptsByQuizId[quiz.quizId]?.length ? (
                      <div className="mt-2 space-y-2">
                        {attemptsByQuizId[quiz.quizId].slice(0, 5).map((attempt, index) => (
                          <div
                            key={attempt.quizAttemptId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs"
                          >
                            <span className="font-medium text-slate-700">
                              Lần {attemptsByQuizId[quiz.quizId].length - index}
                            </span>
                            <span className="text-slate-600">
                              Điểm: {Number(attempt.score || 0).toFixed(2)} ({attempt.correctCount}/{attempt.totalQuestions})
                            </span>
                            <span className="text-slate-500">
                              {formatAttemptTime(attempt.submittedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/classes/${classId}/quizzes/${quiz.quizId}/attempt?attemptId=${attempt.quizAttemptId}`,
                                )
                              }
                              className="rounded-md border border-blue-300 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Xem lại
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">
                        Bạn chưa làm quiz này.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "students" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Danh sách học sinh lớp</h2>
          {loadingStudents ? (
            <p className="text-slate-500 mt-3">Đang tải danh sách học sinh...</p>
          ) : classEnrollments.length === 0 ? (
            <p className="text-slate-500 mt-3">Chưa có học sinh nào trong lớp.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2">STT</th>
                    <th className="pb-2">Tên học sinh</th>
                    <th className="pb-2">Thời gian nhập học</th>
                    <th className="pb-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {classEnrollments.map((enrollment, index) => (
                    <tr
                      key={enrollment.enrollmentId}
                      className="border-b border-slate-100"
                    >
                      <td className="py-3 pr-2 text-slate-900 font-medium">{index + 1}</td>
                      <td className="py-3 pr-2 text-slate-900">
                        {enrollment.studentName || "Học sinh"}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {enrollment.enrollmentDate
                          ? new Date(enrollment.enrollmentDate).toLocaleString("vi-VN")
                          : enrollment.createdAt
                            ? new Date(enrollment.createdAt).toLocaleString("vi-VN")
                            : "-"}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                          Đang học
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "online" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Lớp học trực tuyến</h2>
          <p className="text-sm text-slate-600">
            Bấm mở phòng học trực tuyến để tham gia buổi học Jitsi.
          </p>
          <button
            type="button"
            onClick={handleJoinOnlineClass}
            disabled={!classInfo.onlineOpen || openingOnlineClass}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {openingOnlineClass
              ? "Đang vào lớp..."
              : classInfo.onlineOpen
                ? "Tham gia lớp học trực tuyến"
                : "Giáo viên chưa mở lớp"}
          </button>
        </section>
      ) : null}

      {showOnlineClassModal ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Lớp học trực tuyến</h3>
              <button
                type="button"
                onClick={() => setShowOnlineClassModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Đóng
              </button>
            </div>
            <div className="relative">
              {openingOnlineClass ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-sm text-slate-600">
                  Đang mở lớp học trực tuyến...
                </div>
              ) : null}
              <div ref={jitsiContainerRef} className="w-full h-[70vh] min-h-[420px]" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentClassLearningPage;

