import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { subscriptionService } from "../../../services/subscription/subscriptionService";
import {
  meetingRecordingService,
  type MeetingRecordingDto,
} from "../../../services/recordings/meetingRecordingService";
import { reviewService, type ReviewSummaryDto } from "../../../services/reviews/reviewService";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import type {
  EnrollmentResponse,
  QuizScoreColumn,
  StudentQuizScoreRow,
} from "../../../services/classes/enrollmentService";
import {
  classAiService,
  type ClassAiHistoryMessageResponse,
} from "../../../services/classes/classAiService";
import RichTextContent from "../../../components/common/RichTextContent";
import { createJitsiRoom, type JitsiApi } from "../../../utils/jitsiHelper";
import websocketService from "../../../services/chats/websocketService";

type StudentTab = "overview" | "courses" | "quizzes" | "students" | "online" | "ai";

interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

type LessonCardColorVariant = {
  card: string;
  badge: string;
  badgeText: string;
};

const LESSON_CARD_COLOR_VARIANTS: LessonCardColorVariant[] = [
  {
    card: "rounded-2xl border border-fuchsia-100 bg-linear-to-br from-rose-50 via-white to-cyan-50 p-4 shadow-sm",
    badge:
      "inline-flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-100 to-cyan-100 border border-fuchsia-200 px-2.5 py-1 mb-2",
    badgeText: "text-[10px] font-semibold tracking-wide text-fuchsia-700 uppercase",
  },
  {
    card: "rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-sm",
    badge:
      "inline-flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-100 to-lime-100 border border-emerald-200 px-2.5 py-1 mb-2",
    badgeText: "text-[10px] font-semibold tracking-wide text-emerald-700 uppercase",
  },
  {
    card: "rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-indigo-50 p-4 shadow-sm",
    badge:
      "inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-100 to-indigo-100 border border-violet-200 px-2.5 py-1 mb-2",
    badgeText: "text-[10px] font-semibold tracking-wide text-violet-700 uppercase",
  },
  {
    card: "rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm",
    badge:
      "inline-flex items-center gap-2 rounded-full bg-linear-to-r from-amber-100 to-orange-100 border border-amber-200 px-2.5 py-1 mb-2",
    badgeText: "text-[10px] font-semibold tracking-wide text-amber-700 uppercase",
  },
  {
    card: "rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-blue-50 p-4 shadow-sm",
    badge:
      "inline-flex items-center gap-2 rounded-full bg-linear-to-r from-sky-100 to-blue-100 border border-sky-200 px-2.5 py-1 mb-2",
    badgeText: "text-[10px] font-semibold tracking-wide text-sky-700 uppercase",
  },
];

const getStableLessonColorVariant = (courseId: string): LessonCardColorVariant => {
  let hash = 0;
  for (let index = 0; index < courseId.length; index += 1) {
    hash = (hash * 31 + courseId.charCodeAt(index)) >>> 0;
  }

  return LESSON_CARD_COLOR_VARIANTS[hash % LESSON_CARD_COLOR_VARIANTS.length];
};

const DEFAULT_AI_MESSAGE =
  "Chào bạn, tôi là AI trợ giảng của lớp học này. Bạn có thể hỏi về chủ đề lớp, bài học, tài liệu và quiz đã làm.";

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

const formatRecordingDuration = (durationSeconds?: number): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return "-";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const getRecordingStatusBadge = (status?: string) => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "READY") {
    return {
      label: "Sẵn sàng",
      className: "bg-emerald-100 text-emerald-700",
    };
  }
  if (normalized === "FAILED") {
    return {
      label: "Thất bại",
      className: "bg-rose-100 text-rose-700",
    };
  }

  return {
    label: "Đang xử lý",
    className: "bg-amber-100 text-amber-700",
  };
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
  const [scoreColumns, setScoreColumns] = useState<QuizScoreColumn[]>([]);
  const [studentScoreRows, setStudentScoreRows] = useState<StudentQuizScoreRow[]>([]);
  const [loadingScoreMatrix, setLoadingScoreMatrix] = useState(true);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryDto | null>(null);
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
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [canUseMeetingRecording, setCanUseMeetingRecording] = useState(false);
  const [recordings, setRecordings] = useState<MeetingRecordingDto[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [recordingSearch, setRecordingSearch] = useState("");
  const [onlineClassAccess, setOnlineClassAccess] = useState<OnlineClassAccessDto | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: DEFAULT_AI_MESSAGE,
    },
  ]);
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<JitsiApi | null>(null);
  const aiChatScrollRef = useRef<HTMLDivElement | null>(null);
  const aiMessageEndRef = useRef<HTMLDivElement | null>(null);

  const loadRecordings = useCallback(async () => {
    if (!classId || !canUseMeetingRecording) {
      setRecordings([]);
      return;
    }

    try {
      setLoadingRecordings(true);
      const data = await meetingRecordingService.getStudentRecordings(classId);
      setRecordings(data);
    } catch {
      setRecordings([]);
    } finally {
      setLoadingRecordings(false);
    }
  }, [classId, canUseMeetingRecording]);

  const renderRatingStars = (rating: number) => {
    const rounded = Math.max(0, Math.min(5, Math.round(rating)));
    return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
  };

  const hasActiveSubscription = (endDate?: string) => {
    if (!endDate) {
      return true;
    }
    const parsedDate = new Date(endDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }
    return parsedDate.getTime() >= Date.now();
  };

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setLoadingSubscription(true);
        const response = await subscriptionService.getMyActiveSubscription();
        const active = response.data.result;
        const canRecord = active
          ? active.status === "ACTIVE" && hasActiveSubscription(active.endDate)
          : false;
        setCanUseMeetingRecording(canRecord);
      } catch {
        setCanUseMeetingRecording(false);
      } finally {
        setLoadingSubscription(false);
      }
    };

    void loadSubscription();
  }, []);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

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

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadScoreMatrix = async () => {
      try {
        setLoadingScoreMatrix(true);
        const matrix = await enrollmentService.getClassQuizScoreMatrix(classId);
        setScoreColumns(matrix.columns || []);
        setStudentScoreRows(matrix.rows || []);
      } catch {
        setScoreColumns([]);
        setStudentScoreRows([]);
      } finally {
        setLoadingScoreMatrix(false);
      }
    };

    void loadScoreMatrix();
  }, [classId]);

  const studentScoreRowByStudentId = useMemo(() => {
    const map = new Map<string, StudentQuizScoreRow>();
    studentScoreRows.forEach((row) => {
      if (row.studentId) {
        map.set(row.studentId, row);
      }
    });
    return map;
  }, [studentScoreRows]);

  useEffect(() => {
    if (!classId) {
      setReviewSummary(null);
      return;
    }

    const loadReviewSummary = async () => {
      try {
        const summary = await reviewService.getClassReviewSummary(classId);
        setReviewSummary(summary);
      } catch {
        setReviewSummary(null);
      }
    };

    void loadReviewSummary();
  }, [classId]);

  useEffect(() => {
    if (!classId || !classInfo) {
      return;
    }

    const mapHistoryMessage = (
      item: ClassAiHistoryMessageResponse,
    ): AiChatMessage | null => {
      if (item.role !== "user" && item.role !== "assistant") {
        return null;
      }

      const content = (item.content || "").trim();
      if (!content) {
        return null;
      }

      return {
        role: item.role,
        content,
      };
    };

    const loadAiHistory = async () => {
      try {
        const history = await classAiService.getHistory(classId);
        const normalized = history
          .map(mapHistoryMessage)
          .filter((item): item is AiChatMessage => item !== null);

        if (normalized.length > 0) {
          setAiMessages(normalized);
          return;
        }

        setAiMessages([{ role: "assistant", content: DEFAULT_AI_MESSAGE }]);
      } catch {
        setAiMessages([{ role: "assistant", content: DEFAULT_AI_MESSAGE }]);
      }
    };

    void loadAiHistory();
  }, [classId, classInfo]);

  const quizzesOfClass = useMemo(() => {
    const courseIds = new Set(courses.map((course) => course.courseId));
    return quizzes.filter((quiz) => courseIds.has(quiz.courseId));
  }, [courses, quizzes]);

  const filteredRecordings = useMemo(() => {
    const keyword = recordingSearch.trim().toLowerCase();
    if (!keyword) {
      return recordings;
    }

    return recordings.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const roomName = (item.roomName || "").toLowerCase();
      const createdAt = item.createdAt
        ? new Date(item.createdAt).toLocaleString("vi-VN").toLowerCase()
        : "";

      return (
        title.includes(keyword) ||
        roomName.includes(keyword) ||
        createdAt.includes(keyword)
      );
    });
  }, [recordings, recordingSearch]);

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
      (data) => {
        const event = data as Partial<QuizStatusEvent>;
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
      (data) => {
        const event = data as Partial<ClassLiveStatusEvent>;
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

  const handleSendAiMessage = async () => {
    const message = aiInput.trim();
    if (!message || !classId || aiLoading) {
      return;
    }

    setAiMessages((prev) => [...prev, { role: "user", content: message }]);
    setAiInput("");

    try {
      setAiLoading(true);
      const response = await classAiService.chat(classId, message);
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            response.answer ||
            "Tôi chỉ có thể trả lời những nội dung liên quan đến chủ đề lớp học này.",
        },
      ]);
    } catch (error) {
      const messageError =
        error instanceof Error
          ? error.message
          : "AI local đang tạm thời không khả dụng. Bạn thử lại sau.";
      setAiMessages((prev) => [...prev, { role: "assistant", content: messageError }]);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (showOnlineClassModal && onlineClassAccess && jitsiContainerRef.current) {
      const mountJitsi = async () => {
        try {
          jitsiApiRef.current = await createJitsiRoom({
            roomName: onlineClassAccess.roomName,
            roomPassword: onlineClassAccess.roomPassword,
            jwt: onlineClassAccess.jwt,
            parentNode: jitsiContainerRef.current as HTMLElement,
            isModerator: false,
            canUseRecording: canUseMeetingRecording,
            onRecordingEvent: (status) => {
              if (status === "ready" || status === "processing") {
                void loadRecordings();
              }
            },
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
    }
  }, [showOnlineClassModal, onlineClassAccess, canUseMeetingRecording, loadRecordings]);

  useEffect(() => {
    if (activeTab !== "ai") {
      return;
    }

    const scrollToBottom = () => {
      aiMessageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    const frame = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(frame);
  }, [aiMessages, aiLoading, activeTab]);

  if (!classId) {
    return <div className="max-w-6xl mx-auto p-6">Thiếu classId trên URL.</div>;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center gap-3 text-slate-700">
        <span
          aria-hidden="true"
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#4da6ff]/30 border-t-[#4da6ff]"
        />
        <span>Đang tải lớp học...</span>
      </div>
    );
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
        <p className="mt-2 text-sm text-amber-600">
          {reviewSummary && reviewSummary.totalReviews > 0
            ? `${renderRatingStars(reviewSummary.averageRating)} ${reviewSummary.averageRating.toFixed(1)}/5 (${reviewSummary.totalReviews} đánh giá)`
            : "Chưa có đánh giá lớp học"}
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
          { key: "ai", label: "AI trợ giảng" },
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
                const lessonColorVariant = getStableLessonColorVariant(course.courseId);

                return (
                  <article
                    key={course.courseId}
                    className={lessonColorVariant.card}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={lessonColorVariant.badge}>
                          <span className={lessonColorVariant.badgeText}>
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
          ) : loadingScoreMatrix ? (
            <p className="text-slate-500 mt-3">Đang tải bảng điểm quiz...</p>
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
                    {scoreColumns.map((column) => (
                      <th key={column.columnId} className="pb-2">
                        {column.columnName}
                      </th>
                    ))}
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
                      {scoreColumns.map((column) => {
                        const scoreRow = studentScoreRowByStudentId.get(
                          enrollment.studentId,
                        );
                        const scoreValue = scoreRow?.quizScores?.[column.columnId];
                        return (
                          <td key={column.columnId} className="py-3 pr-2 text-slate-700">
                            {typeof scoreValue === "number"
                              ? Number(scoreValue).toFixed(2)
                              : "-"}
                          </td>
                        );
                      })}
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
          {loadingSubscription ? (
            <p className="text-xs text-slate-500">Đang kiểm tra quyền dùng tính năng record...</p>
          ) : canUseMeetingRecording ? (
            <div className="space-y-3">
              <p className="text-xs text-emerald-700">
                Bạn đang có gói hoạt động, có thể sử dụng tính năng record meeting.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">Video meeting đã lưu</p>
                  <input
                    type="text"
                    value={recordingSearch}
                    onChange={(event) => setRecordingSearch(event.target.value)}
                    placeholder="Tìm video theo tên/phòng/thời gian"
                    className="w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>

                {loadingRecordings ? (
                  <p className="text-xs text-slate-500">Đang tải video meeting...</p>
                ) : filteredRecordings.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có video meeting phù hợp.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {filteredRecordings.map((item) => (
                      <div key={item.recordingId} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-800 truncate">
                            {item.title || "Bản ghi bài giảng"}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRecordingStatusBadge(item.status).className}`}
                          >
                            {getRecordingStatusBadge(item.status).label}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1">
                          Thời lượng: {formatRecordingDuration(item.durationSeconds)}
                        </p>
                        <p className="text-slate-500">
                          Tạo lúc: {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "-"}
                        </p>
                        <div className="mt-2">
                          {item.recordingUrl ? (
                            <a
                              href={item.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-md border border-blue-300 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Xem lại bài giảng
                            </a>
                          ) : (
                            <span className="inline-flex rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-slate-500">
                              Video chưa sẵn sàng
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-2">
              <p>Bạn cần phải mua gói để sử dụng tính năng này.</p>
              <button
                type="button"
                onClick={() => navigate("/subscription")}
                className="rounded-md border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-700 hover:bg-amber-100"
              >
                Mua gói ngay
              </button>
            </div>
          )}
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

      {activeTab === "ai" ? (
        <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-cyan-50/70 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI trợ giảng</h2>
              <p className="text-sm text-slate-600 mt-1">
                AI chỉ trả lời các câu hỏi liên quan đến lớp học, bài học, tài liệu và quiz đã học.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              Hỗ trợ 24/7
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 md:p-4 shadow-inner">
            <div
              ref={aiChatScrollRef}
              className="h-[430px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-3 md:p-4 space-y-3"
            >
              {aiMessages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[88%] md:max-w-[78%] space-y-1 ${item.role === "user" ? "items-end" : "items-start"}`}>
                    <p className={`text-[11px] font-semibold ${item.role === "user" ? "text-blue-600 text-right" : "text-slate-500"}`}>
                      {item.role === "user" ? "Bạn" : "AI trợ giảng"}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        item.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {item.content}
                    </div>
                  </div>
                </div>
              ))}

              {aiLoading ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] md:max-w-[78%] space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">AI trợ giảng</p>
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-sm">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                      <span>AI đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              ) : null}
              <div ref={aiMessageEndRef} />
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <textarea
                 value={aiInput}
                 onChange={(event) => setAiInput(event.target.value)}
                 onKeyDown={(event) => {
                   if (event.key === "Enter" && !event.shiftKey) {
                     event.preventDefault();
                     void handleSendAiMessage();
                   }
                 }}
                 placeholder="Nhập câu hỏi liên quan đến bài học..."
                 rows={2}
                 className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
               />
              <button
                type="button"
                onClick={() => void handleSendAiMessage()}
                disabled={aiLoading || !aiInput.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                Gửi
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {showOnlineClassModal ? (
        <div className="fixed inset-0 z-[1200] bg-black/40 p-4 flex items-center justify-center">
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
            {!canUseMeetingRecording ? (
              <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Bạn cần phải mua gói để sử dụng tính năng record meeting.
              </div>
            ) : null}
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

