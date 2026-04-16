import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  classRoomService,
  type ClassRoomDto,
} from "../../../services/classes/classRoomService";
import {
  courseService,
  type CourseDto,
} from "../../../services/courses/courseService";
import { quizService, type QuizDto } from "../../../services/quizzes/quizService";
import { enrollmentService } from "../../../services/classes/enrollmentService";
import RichTextContent from "../../../components/common/RichTextContent";
import { createJitsiRoom, type JitsiApi } from "../../../utils/jitsiHelper";

type StudentTab = "overview" | "courses" | "quizzes" | "online";

const StudentClassLearningPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<StudentTab>("overview");
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassRoomDto | null>(null);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [showOnlineClassModal, setShowOnlineClassModal] = useState(false);
  const [openingOnlineClass, setOpeningOnlineClass] = useState(false);
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

  const quizzesOfClass = useMemo(() => {
    const courseIds = new Set(courses.map((course) => course.courseId));
    return quizzes.filter((quiz) => courseIds.has(quiz.courseId));
  }, [courses, quizzes]);

  useEffect(() => {
    if (activeTab === "online") {
      setShowOnlineClassModal(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!showOnlineClassModal || !classId || !jitsiContainerRef.current) {
      return;
    }

    const mountJitsi = async () => {
      try {
        setOpeningOnlineClass(true);
        jitsiApiRef.current = await createJitsiRoom({
          classId,
          parentNode: jitsiContainerRef.current as HTMLElement,
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
  }, [showOnlineClassModal, classId]);

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
          Theo dõi nội dung bài học và làm quiz trong lớp đã enroll.
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Bài học</h2>
          {loadingCourses ? (
            <p className="text-slate-500 mt-3">Đang tải bài học...</p>
          ) : courses.length === 0 ? (
            <p className="text-slate-500 mt-3">Chưa có bài học.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {courses.map((course) => (
                <article
                  key={course.courseId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-semibold text-cyan-700">Bài {course.orderIndex}</p>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">{course.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {course.description || "Chưa có mô tả bài học."}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Tài liệu: {course.fileUrls.length} file
                  </p>
                </article>
              ))}
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
                  <h3 className="text-base font-semibold text-slate-900">{quiz.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {quiz.description || "Chưa có mô tả quiz."}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Số lần làm tối đa: {quiz.maxAttempts}
                  </p>
                </article>
              ))}
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
            onClick={() => setShowOnlineClassModal(true)}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold"
          >
            Mở lớp học trực tuyến
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

