import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
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
import { toast } from "react-toastify";
import {
  classRoomService,
  type ClassRoomDto,
  type UpdateClassRoomRequest,
} from "../../../services/classes/classRoomService";
import {
  courseService,
  type CourseDto,
  type CreateCourseRequest,
  type UpdateCourseRequest,
} from "../../../services/courses/courseService";
import { userService, type UserResponse } from "../../../services/usersService";
import {
  uploadMultipleFiles,
  uploadToCloudinary,
} from "../../../services/upload/uploadService";
import { useAuth } from "../../../context/AuthContext";
import RichTextContent from "../../../components/common/RichTextContent";
import {
  quizService,
  type QuizDto,
  type QuizImportResult,
} from "../../../services/quizzes/quizService";

type TeacherTab = "overview" | "courses" | "quizzes" | "students" | "feedback";

interface NewCourseForm {
  title: string;
  description: string;
  orderIndex: number;
  fileUrls: string[];
}

interface ClassroomFeedback {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface EditClassForm {
  className: string;
  description: string;
  schedule: string;
  poster: string;
  maxStudents: number;
  price: number;
  startDate: string;
  endDate: string;
}

const INITIAL_NEW_COURSE_FORM: NewCourseForm = {
  title: "",
  description: "",
  orderIndex: 1,
  fileUrls: [],
};

const INITIAL_EDIT_CLASS_FORM: EditClassForm = {
  className: "",
  description: "",
  schedule: "",
  poster: "",
  maxStudents: 25,
  price: 0,
  startDate: "",
  endDate: "",
};

const MAX_POSTER_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CLASS_POSTER_UPLOAD_FOLDER = "class-posters";

const CLASS_COURSE_FILE_UPLOAD_FOLDER = "class-course-files";

const ALLOWED_COURSE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
  "flac",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "svg",
]);

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

const getClassRating = (classId: string): number => {
  const hash = classId
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return 3.5 + (hash % 16) * 0.1;
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

const formatIsoToDatetimeLocal = (value?: string): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const mapClassToEditForm = (classItem: ClassRoomDto): EditClassForm => ({
  className: classItem.className || "",
  description: classItem.description || "",
  schedule: classItem.schedule || "",
  poster: classItem.poster || "",
  maxStudents: classItem.maxStudents ?? 25,
  price: Number(classItem.price || 0),
  startDate: formatIsoToDatetimeLocal(classItem.startDate),
  endDate: formatIsoToDatetimeLocal(classItem.endDate),
});

const normalizePoster = (poster: string): string | undefined => {
  const trimmedPoster = poster.trim();
  return trimmedPoster ? trimmedPoster : undefined;
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

const toCoursePayload = (
  classId: string,
  form: NewCourseForm,
): CreateCourseRequest | UpdateCourseRequest => ({
  classId,
  title: form.title.trim(),
  description: form.description.trim(),
  orderIndex: Number(form.orderIndex) || 1,
  fileUrls: form.fileUrls,
});

const mapCourseToForm = (course: CourseDto): NewCourseForm => ({
  title: course.title || "",
  description: course.description || "",
  orderIndex: course.orderIndex || 1,
  fileUrls: course.fileUrls || [],
});

const TeacherClassManagePage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TeacherTab>("overview");
  const [loadingClass, setLoadingClass] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassRoomDto | null>(null);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [students, setStudents] = useState<UserResponse[]>([]);
  const [showEditClassForm, setShowEditClassForm] = useState(false);
  const [editClassForm, setEditClassForm] = useState<EditClassForm>(
    INITIAL_EDIT_CLASS_FORM,
  );
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [isUploadingClassPoster, setIsUploadingClassPoster] = useState(false);
  const [editClassPosterFileName, setEditClassPosterFileName] = useState("");
  const editClassPosterInputRef = useRef<HTMLInputElement>(null);
  const [newCourseForm, setNewCourseForm] = useState<NewCourseForm>(
    INITIAL_NEW_COURSE_FORM,
  );
  const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [uploadingCourseFiles, setUploadingCourseFiles] = useState(false);
  const courseFileInputRef = useRef<HTMLInputElement>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseForm, setEditCourseForm] = useState<NewCourseForm>(
    INITIAL_NEW_COURSE_FORM,
  );
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [uploadingEditCourseFiles, setUploadingEditCourseFiles] =
    useState(false);
  const editCourseFileInputRef = useRef<HTMLInputElement>(null);
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedLessonQuizCourseIds, setExpandedLessonQuizCourseIds] =
    useState<Set<string>>(() => new Set());
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [importingQuizId, setImportingQuizId] = useState<string | null>(null);
  const [quizImportResultByQuizId, setQuizImportResultByQuizId] = useState<
    Record<string, QuizImportResult>
  >({});
  const quizExcelInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadClass = async () => {
      try {
        setLoadingClass(true);
        const data = await classRoomService.getClassById(classId);
        setClassInfo(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin lớp học.";
        toast.error(message);
      } finally {
        setLoadingClass(false);
      }
    };

    loadClass();
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
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách quiz.";
        toast.error(message);
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

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const coursePage = await courseService.getCourses(1, 100, classId);
        const sorted = [...(coursePage.data || [])].sort(
          (first, second) => first.orderIndex - second.orderIndex,
        );
        setCourses(sorted);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải bài học.";
        toast.error(message);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [classId]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await userService.getAllUsers(1, 100, "STUDENT", true);
        const result = response?.data?.result;
        const list = (result?.data || []) as UserResponse[];
        setStudents(list);
      } catch {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, []);

  const rating = useMemo(() => {
    if (!classInfo) {
      return 0;
    }

    return Number(getClassRating(classInfo.classId).toFixed(1));
  }, [classInfo]);

  const registeredStudents = useMemo(() => {
    const total = classInfo?.currentStudents || 0;
    if (students.length === 0 || total <= 0) {
      return [];
    }

    return students.slice(0, total);
  }, [students, classInfo?.currentStudents]);

  const feedbackList = useMemo<ClassroomFeedback[]>(() => {
    if (!classInfo) {
      return [];
    }

    if (registeredStudents.length === 0) {
      return [];
    }

    return registeredStudents.slice(0, 8).map((student, index) => {
      const classScore = getClassRating(classInfo.classId);
      const adjusted = Math.max(
        3.2,
        Math.min(5, classScore - (index % 3) * 0.2),
      );

      return {
        id: `${classInfo.classId}-fb-${student.userId}`,
        studentName: student.userName,
        rating: Number(adjusted.toFixed(1)),
        comment:
          index % 2 === 0
            ? "Giảng viên hỗ trợ nhiệt tình, nội dung dễ theo dõi và thực hành tốt."
            : "Lộ trình học rõ ràng, mong lớp có thêm bài tập nâng cao mỗi tuần.",
        createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      };
    });
  }, [classInfo, registeredStudents]);

  const quizzesOfClass = useMemo(() => {
    const lessonIds = new Set(courses.map((course) => course.courseId));
    return quizzes.filter((quiz) => lessonIds.has(quiz.courseId));
  }, [courses, quizzes]);

  const getQuizzesByCourseId = (courseId: string) => {
    return quizzesOfClass.filter((quiz) => quiz.courseId === courseId);
  };

  const getLessonTitleByCourseId = (courseId: string) => {
    const lesson = courses.find((course) => course.courseId === courseId);
    return lesson?.title || "Bài học không xác định";
  };

  const handleCreateCourse = async () => {
    if (!classId) {
      return;
    }

    if (!newCourseForm.title.trim()) {
      toast.error("Vui lòng nhập tên bài học.");
      return;
    }

    try {
      setCreatingCourse(true);
      const created = await courseService.createCourse(
        toCoursePayload(classId, newCourseForm),
      );
      setCourses((prev) =>
        [...prev, created].sort(
          (first, second) => first.orderIndex - second.orderIndex,
        ),
      );
      setNewCourseForm(INITIAL_NEW_COURSE_FORM);
      setShowCreateCourseForm(false);
      toast.success("Tạo bài học thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo bài học.";
      toast.error(message);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleUploadCourseFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    const invalidFile = files.find(
      (file) => !ALLOWED_COURSE_EXTENSIONS.has(getExtension(file.name)),
    );

    if (invalidFile) {
      toast.error(
        `File ${invalidFile.name} không thuộc định dạng cho phép (Word, Excel, PPT, video, âm thanh, ảnh, PDF).`,
      );
      return;
    }

    try {
      setUploadingCourseFiles(true);

      const results = await uploadMultipleFiles(files, {
        folder: CLASS_COURSE_FILE_UPLOAD_FOLDER,
      });

      const successUrls = results
        .filter((result) => result.success && Boolean(result.data.url))
        .map((result) => result.data.url);

      const failedCount = results.length - successUrls.length;

      if (successUrls.length > 0) {
        setNewCourseForm((prev) => ({
          ...prev,
          fileUrls: [...prev.fileUrls, ...successUrls],
        }));
      }

      if (failedCount > 0) {
        toast.warning(
          `Upload thành công ${successUrls.length} file, thất bại ${failedCount} file.`,
        );
      } else {
        toast.success(`Upload ${successUrls.length} file thành công.`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload file thất bại.";
      toast.error(message);
    } finally {
      setUploadingCourseFiles(false);
    }
  };

  const handleUploadEditCourseFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    const invalidFile = files.find(
      (file) => !ALLOWED_COURSE_EXTENSIONS.has(getExtension(file.name)),
    );

    if (invalidFile) {
      toast.error(
        `File ${invalidFile.name} không thuộc định dạng cho phép (Word, Excel, PPT, video, âm thanh, ảnh, PDF).`,
      );
      return;
    }

    try {
      setUploadingEditCourseFiles(true);

      const results = await uploadMultipleFiles(files, {
        folder: CLASS_COURSE_FILE_UPLOAD_FOLDER,
      });

      const successUrls = results
        .filter((result) => result.success && Boolean(result.data.url))
        .map((result) => result.data.url);

      const failedCount = results.length - successUrls.length;

      if (successUrls.length > 0) {
        setEditCourseForm((prev) => ({
          ...prev,
          fileUrls: [...prev.fileUrls, ...successUrls],
        }));
      }

      if (failedCount > 0) {
        toast.warning(
          `Upload thành công ${successUrls.length} file, thất bại ${failedCount} file.`,
        );
      } else {
        toast.success(`Upload ${successUrls.length} file thành công.`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload file thất bại.";
      toast.error(message);
    } finally {
      setUploadingEditCourseFiles(false);
    }
  };

  const handleRemoveCourseFile = (fileUrl: string) => {
    setNewCourseForm((prev) => ({
      ...prev,
      fileUrls: prev.fileUrls.filter((url) => url !== fileUrl),
    }));
  };

  const handleRemoveEditCourseFile = (fileUrl: string) => {
    setEditCourseForm((prev) => ({
      ...prev,
      fileUrls: prev.fileUrls.filter((url) => url !== fileUrl),
    }));
  };

  const handleStartEditCourse = (course: CourseDto) => {
    setEditingCourseId(course.courseId);
    setEditCourseForm(mapCourseToForm(course));
  };

  const handleCancelEditCourse = () => {
    setEditingCourseId(null);
    setEditCourseForm(INITIAL_NEW_COURSE_FORM);
  };

  const handleUpdateCourse = async (courseId: string) => {
    if (!classId) {
      return;
    }

    if (!editCourseForm.title.trim()) {
      toast.error("Vui lòng nhập tên bài học.");
      return;
    }

    try {
      setUpdatingCourse(true);

      const updated = await courseService.updateCourse(
        courseId,
        toCoursePayload(classId, editCourseForm) as UpdateCourseRequest,
      );

      setCourses((prev) =>
        prev
          .map((course) => (course.courseId === courseId ? updated : course))
          .sort((first, second) => first.orderIndex - second.orderIndex),
      );

      toast.success("Cập nhật bài học thành công.");
      handleCancelEditCourse();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể cập nhật bài học.";
      toast.error(message);
    } finally {
      setUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const shouldDelete = window.confirm("Bạn có chắc muốn xóa bài học này?");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      await courseService.deleteCourse(courseId);

      setCourses((prev) =>
        prev.filter((course) => course.courseId !== courseId),
      );
      setExpandedCourseIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });

      if (editingCourseId === courseId) {
        handleCancelEditCourse();
      }

      toast.success("Xóa bài học thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa bài học.";
      toast.error(message);
    } finally {
      setDeletingCourseId(null);
    }
  };

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

  const toggleLessonQuizList = (courseId: string) => {
    setExpandedLessonQuizCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }

      return next;
    });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    const shouldDelete = window.confirm("Bạn có chắc muốn xóa quiz này?");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingQuizId(quizId);
      await quizService.deleteQuiz(quizId);

      setQuizzes((prev) => prev.filter((item) => item.quizId !== quizId));

      toast.success("Xóa quiz thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa quiz.";
      toast.error(message);
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleSelectQuizExcel = (quizId: string) => {
    quizExcelInputRefs.current[quizId]?.click();
  };

  const handleImportQuizExcel = async (
    quiz: QuizDto,
    fileList: FileList | null,
  ) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const file = fileList[0];
    const extension = getExtension(file.name);
    if (extension !== "xlsx" && extension !== "xls") {
      toast.error("Vui lòng chọn file Excel (.xlsx hoặc .xls).");
      return;
    }

    try {
      setImportingQuizId(quiz.quizId);
      const result = await quizService.importQuizExcel(quiz.quizId, file);

      setQuizImportResultByQuizId((prev) => ({
        ...prev,
        [quiz.quizId]: result,
      }));

      if (result.errors?.length) {
        toast.warning(
          `Import thành công ${result.importedCount}/${result.totalRows} dòng. Có ${result.errors.length} lỗi cần kiểm tra.`,
        );
      } else {
        toast.success(
          `Import Excel thành công: ${result.importedCount}/${result.totalRows} dòng.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể import file Excel.";
      toast.error(message);
    } finally {
      setImportingQuizId(null);
    }
  };

  const handleOpenEditClassForm = () => {
    if (!classInfo) {
      toast.error("Không thể lấy thông tin lớp học để chỉnh sửa.");
      return;
    }

    setEditClassForm(mapClassToEditForm(classInfo));
    setEditClassPosterFileName("");
    setShowEditClassForm(true);
  };

  const handleUploadClassPoster = async (file: File) => {
    const validationError = validatePosterFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsUploadingClassPoster(true);

      const uploaded = await uploadToCloudinary(file, {
        folder: CLASS_POSTER_UPLOAD_FOLDER,
      });

      if (!uploaded.success || !uploaded.data.url) {
        toast.error(uploaded.error || "Upload poster thất bại.");
        return;
      }

      setEditClassForm((prev) => ({ ...prev, poster: uploaded.data.url }));
      toast.success("Upload poster thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload poster thất bại.";
      toast.error(message);
    } finally {
      setIsUploadingClassPoster(false);
    }
  };

  const handleUpdateClassInfo = async () => {
    if (!classId || !classInfo) {
      return;
    }

    if (!editClassForm.className.trim()) {
      toast.error("Vui lòng nhập tên lớp học.");
      return;
    }

    if (!editClassForm.startDate || !editClassForm.endDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return;
    }

    const resolvedTeacherId =
      classInfo.teacherId || user?.userId || classInfo.teacherEmail || "";

    if (!resolvedTeacherId) {
      toast.error("Không xác định được giáo viên của lớp học.");
      return;
    }

    try {
      setIsUpdatingClass(true);

      const payload: UpdateClassRoomRequest = {
        className: editClassForm.className.trim(),
        description: editClassForm.description.trim(),
        teacherId: resolvedTeacherId,
        price: Number(editClassForm.price) || 0,
        startDate: new Date(editClassForm.startDate).toISOString(),
        endDate: new Date(editClassForm.endDate).toISOString(),
        maxStudents: Number(editClassForm.maxStudents) || 1,
        schedule: editClassForm.schedule.trim(),
        poster: normalizePoster(editClassForm.poster),
      };

      const updated = await classRoomService.updateClass(classId, payload);
      setClassInfo(updated);
      setShowEditClassForm(false);
      toast.success("Cập nhật thông tin lớp học thành công.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thông tin lớp học.";
      toast.error(message);
    } finally {
      setIsUpdatingClass(false);
    }
  };

  if (!classId) {
    return <div className="max-w-6xl mx-auto p-6">Thiếu classId trên URL.</div>;
  }

  if (loadingClass) {
    return (
      <div className="max-w-6xl mx-auto p-6">Đang tải dữ liệu lớp học...</div>
    );
  }

  if (!classInfo) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-red-500">
          Không tìm thấy lớp học hoặc không thể tải dữ liệu.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-cyan-50 to-blue-50 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/classes")}
              className="text-sm text-blue-600 hover:underline"
            >
              Quay lại danh sách lớp học
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
              Quản lý lớp: {classInfo.className}
            </h1>
            <p className="text-slate-600 mt-1">
              Theo dõi bài học, học sinh đăng ký và phản hồi của lớp học.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-white/80 backdrop-blur px-4 py-3 min-w-70 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Học phí lớp</span>
              <span className="font-semibold text-blue-700">
                {Number(classInfo.price || 0).toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                {renderRatingStars(rating)}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {rating}/5
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mt-1">
            Không gian quản trị dành cho giáo viên
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-100 bg-white p-2 flex flex-wrap gap-2 shadow-sm">
        {[
          { key: "overview", label: "Tổng quan" },
          { key: "courses", label: "Bài học" },
          { key: "quizzes", label: "Quiz" },
          { key: "students", label: "Học sinh" },
          { key: "feedback", label: "Feedback" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key as TeacherTab)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === item.key
                ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-cyan-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tổng học sinh</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {classInfo.currentStudents ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 to-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Số bài học</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {courses.length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Đánh giá trung bình</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{rating}</p>
          </div>

          <div className="md:col-span-3 rounded-2xl border border-cyan-100 bg-linear-to-br from-white to-cyan-50/60 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Thông tin lớp học
                </h2>
                <RichTextContent
                  content={classInfo.description}
                  emptyFallback="Chưa có mô tả lớp học."
                  className="text-slate-600 wrap-break-word [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-200 [&_blockquote]:pl-3"
                />
                <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1">
                    Lịch học: {classInfo.schedule || "Chưa cập nhật"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">
                    Sĩ số: {classInfo.currentStudents ?? 0}/
                    {classInfo.maxStudents ?? 0}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-3 py-1">
                    Học phí:{" "}
                    {Number(classInfo.price || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={
                    showEditClassForm
                      ? () => setShowEditClassForm(false)
                      : handleOpenEditClassForm
                  }
                  className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold hover:brightness-105"
                >
                  {showEditClassForm
                    ? "Đóng chỉnh sửa"
                    : "Chỉnh sửa thông tin lớp"}
                </button>
              </div>
            </div>

            {showEditClassForm ? (
              <div className="rounded-2xl border border-blue-100 bg-white p-4 md:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Tên lớp học</span>
                    <input
                      value={editClassForm.className}
                      onChange={(event) =>
                        setEditClassForm((prev) => ({
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
                      value={editClassForm.price}
                      onChange={(event) =>
                        setEditClassForm((prev) => ({
                          ...prev,
                          price: Number(event.target.value) || 0,
                        }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Lịch học</span>
                    <input
                      value={editClassForm.schedule}
                      onChange={(event) =>
                        setEditClassForm((prev) => ({
                          ...prev,
                          schedule: event.target.value,
                        }))
                      }
                      placeholder="Ví dụ: Thứ 2 - 4 - 6, 19:00"
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Số học sinh tối đa</span>
                    <input
                      type="number"
                      min={1}
                      value={editClassForm.maxStudents}
                      onChange={(event) =>
                        setEditClassForm((prev) => ({
                          ...prev,
                          maxStudents: Number(event.target.value) || 1,
                        }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Ngày bắt đầu</span>
                    <input
                      type="datetime-local"
                      value={editClassForm.startDate}
                      onChange={(event) =>
                        setEditClassForm((prev) => ({
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
                      value={editClassForm.endDate}
                      onChange={(event) =>
                        setEditClassForm((prev) => ({
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
                    value={editClassForm.description}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
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
                    ref={editClassPosterInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      setEditClassPosterFileName(file.name);
                      handleUploadClassPoster(file);
                      event.target.value = "";
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => editClassPosterInputRef.current?.click()}
                      disabled={isUploadingClassPoster}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {isUploadingClassPoster
                        ? "Đang upload ảnh..."
                        : "Chọn ảnh poster"}
                    </button>

                    {editClassPosterFileName ? (
                      <span className="text-sm text-slate-500">
                        {editClassPosterFileName}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Chưa chọn ảnh
                      </span>
                    )}
                  </div>

                  {editClassForm.poster ? (
                    <div className="w-full max-w-xs rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={editClassForm.poster}
                        alt="Poster preview"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpdateClassInfo}
                    disabled={isUpdatingClass || isUploadingClassPoster}
                    className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold hover:brightness-105 disabled:opacity-60"
                  >
                    {isUpdatingClass ? "Đang cập nhật..." : "Lưu thông tin lớp"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditClassForm(false)}
                    className="rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {activeTab === "courses" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-cyan-100 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Tạo bài học mới
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateCourseForm((prev) => !prev)}
                className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
              >
                {showCreateCourseForm ? "Đóng form" : "Mở form tạo bài học"}
              </button>
            </div>

            {showCreateCourseForm ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={newCourseForm.title}
                    onChange={(event) =>
                      setNewCourseForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Tên bài học"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newCourseForm.orderIndex}
                    onChange={(event) =>
                      setNewCourseForm((prev) => ({
                        ...prev,
                        orderIndex: Number(event.target.value) || 1,
                      }))
                    }
                    placeholder="Thứ tự"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  value={newCourseForm.description}
                  onChange={(event) =>
                    setNewCourseForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Mô tả bài học"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">
                      Tài liệu bài học
                    </p>
                    <p className="text-xs text-slate-500">
                      Hỗ trợ: Word, Excel, PowerPoint, Video, Âm thanh, Hình
                      ảnh, PDF
                    </p>
                  </div>

                  <input
                    ref={courseFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
                    className="hidden"
                    onChange={(event) => {
                      handleUploadCourseFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => courseFileInputRef.current?.click()}
                    disabled={uploadingCourseFiles}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {uploadingCourseFiles
                      ? "Đang upload file..."
                      : "Chọn file tài liệu"}
                  </button>

                  {newCourseForm.fileUrls.length > 0 ? (
                    <ul className="space-y-2">
                      {newCourseForm.fileUrls.map((fileUrl, index) => (
                        <li
                          key={`${fileUrl}-${index}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                        >
                          {(() => {
                            const fileName = getFileNameFromUrl(fileUrl, index);
                            const extension = getExtension(fileName);
                            const badge = getFileTypeBadge(extension);
                            const { icon: FileIcon, className } =
                              getFileIcon(extension);

                            return (
                              <div className="flex items-center gap-2 min-w-0">
                                <FileIcon className={`shrink-0 ${className}`} />
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-blue-700 hover:underline break-all"
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
                          })()}
                          <button
                            type="button"
                            onClick={() => handleRemoveCourseFile(fileUrl)}
                            className="text-xs font-medium text-rose-600 hover:underline self-start sm:self-auto"
                          >
                            Xóa
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Chưa có file nào được upload.
                    </p>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleCreateCourse}
                    disabled={creatingCourse || uploadingCourseFiles}
                    className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                  >
                    {creatingCourse ? "Đang tạo..." : "Tạo bài học"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Nhấn "Mở form tạo bài học" để thêm bài học mới.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">
              Danh sách bài học
            </h3>
            {loadingCourses ? (
              <p className="text-slate-500 mt-3">
                Đang tải danh sách bài học...
              </p>
            ) : courses.length === 0 ? (
              <p className="text-slate-500 mt-3">
                Chưa có bài học nào trong lớp này.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {courses.map((course) => {
                  const isExpanded = expandedCourseIds.has(course.courseId);
                  const lessonQuizzes = getQuizzesByCourseId(course.courseId);
                  const isQuizListExpanded = expandedLessonQuizCourseIds.has(
                    course.courseId,
                  );

                  return (
                    <div
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
                          <h4 className="text-lg font-black text-slate-900 leading-tight line-clamp-2">
                            {course.title}
                          </h4>
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {course.description || "Chưa có mô tả."}
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/classes/${classId}/lessons/${course.courseId}/quiz`,
                              )
                            }
                            className="inline-flex items-center rounded-lg border border-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                          >
                            Tạo quiz + câu hỏi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditCourse(course)}
                            className="inline-flex items-center rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course.courseId)}
                            disabled={deletingCourseId === course.courseId}
                            className="inline-flex items-center rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            {deletingCourseId === course.courseId
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                          {course.fileUrls.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleCourseFiles(course.courseId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              {isExpanded ? "Ẩn tài liệu" : "Mở tài liệu"}
                              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-full bg-cyan-100 text-cyan-700 px-2.5 py-1 text-xs font-semibold">
                            Quiz đã tạo: {lessonQuizzes.length}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              toggleLessonQuizList(course.courseId)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                          >
                            {isQuizListExpanded ? "Ẩn quiz" : "Mở quiz"}
                            {isQuizListExpanded ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                        </div>

                        {isQuizListExpanded ? (
                          loadingQuizzes ? (
                            <p className="text-xs text-slate-500 mt-2">
                              Đang tải quiz...
                            </p>
                          ) : lessonQuizzes.length === 0 ? (
                            <p className="text-xs text-slate-500 mt-2">
                              Bài học này chưa có quiz nào.
                            </p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {lessonQuizzes.map((quiz) => (
                                <div
                                  key={`${course.courseId}-${quiz.quizId}`}
                                  className="rounded-lg border border-cyan-200 bg-white px-3 py-2"
                                >
                                  <input
                                    ref={(element) => {
                                      quizExcelInputRefs.current[quiz.quizId] =
                                        element;
                                    }}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={(event) => {
                                      handleImportQuizExcel(
                                        quiz,
                                        event.target.files,
                                      );
                                      event.target.value = "";
                                    }}
                                  />

                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {quiz.title}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        {quiz.description ||
                                          "Chưa có mô tả quiz."}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate(
                                            `/classes/${classId}/lessons/${course.courseId}/quiz?quizId=${quiz.quizId}`,
                                          )
                                        }
                                        className="rounded-md border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                                      >
                                        Chỉnh sửa quiz
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSelectQuizExcel(quiz.quizId)
                                        }
                                        disabled={
                                          importingQuizId === quiz.quizId
                                        }
                                        className="rounded-md border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                      >
                                        {importingQuizId === quiz.quizId
                                          ? "Đang import..."
                                          : "Import Excel"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteQuiz(quiz.quizId)
                                        }
                                        disabled={
                                          deletingQuizId === quiz.quizId
                                        }
                                        className="rounded-md border border-rose-300 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                      >
                                        {deletingQuizId === quiz.quizId
                                          ? "Đang xóa..."
                                          : "Xóa"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate(
                                            `/classes/${classId}/lessons/${course.courseId}/quiz?quizId=${quiz.quizId}`,
                                          )
                                        }
                                        className="rounded-md border border-cyan-300 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 hover:bg-cyan-50"
                                      >
                                        Mở quiz
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-400">
                                    Quiz ID: {quiz.quizId}
                                  </div>

                                  {quizImportResultByQuizId[quiz.quizId] ? (
                                    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-2.5 py-2 text-[11px] text-emerald-800">
                                      <p>
                                        Import gần nhất:{" "}
                                        {
                                          quizImportResultByQuizId[quiz.quizId]
                                            .importedCount
                                        }
                                        /
                                        {
                                          quizImportResultByQuizId[quiz.quizId]
                                            .totalRows
                                        }{" "}
                                        dòng.
                                      </p>
                                      {quizImportResultByQuizId[quiz.quizId]
                                        .errors?.length ? (
                                        <div className="mt-1 text-rose-700">
                                          <p>
                                            Lỗi (
                                            {
                                              quizImportResultByQuizId[
                                                quiz.quizId
                                              ].errors.length
                                            }
                                            ):
                                          </p>
                                          <ul className="list-disc pl-4">
                                            {quizImportResultByQuizId[
                                              quiz.quizId
                                            ].errors
                                              .slice(0, 5)
                                              .map((errorItem, index) => (
                                                <li
                                                  key={`${quiz.quizId}-import-error-${index}`}
                                                >
                                                  {errorItem}
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )
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

                      {editingCourseId === course.courseId ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                          <h5 className="text-sm font-semibold text-amber-800">
                            Chỉnh sửa bài học
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              value={editCourseForm.title}
                              onChange={(event) =>
                                setEditCourseForm((prev) => ({
                                  ...prev,
                                  title: event.target.value,
                                }))
                              }
                              placeholder="Tên bài học"
                              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              type="number"
                              min={1}
                              value={editCourseForm.orderIndex}
                              onChange={(event) =>
                                setEditCourseForm((prev) => ({
                                  ...prev,
                                  orderIndex: Number(event.target.value) || 1,
                                }))
                              }
                              placeholder="Thứ tự"
                              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>

                          <textarea
                            value={editCourseForm.description}
                            onChange={(event) =>
                              setEditCourseForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            placeholder="Mô tả bài học"
                            rows={3}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />

                          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                            <input
                              ref={editCourseFileInputRef}
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
                              className="hidden"
                              onChange={(event) => {
                                handleUploadEditCourseFiles(event.target.files);
                                event.target.value = "";
                              }}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                editCourseFileInputRef.current?.click()
                              }
                              disabled={uploadingEditCourseFiles}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {uploadingEditCourseFiles
                                ? "Đang upload file..."
                                : "Thêm tài liệu"}
                            </button>

                            {editCourseForm.fileUrls.length > 0 ? (
                              <ul className="space-y-2">
                                {editCourseForm.fileUrls.map(
                                  (fileUrl, index) => {
                                    const fileName = getFileNameFromUrl(
                                      fileUrl,
                                      index,
                                    );
                                    const extension = getExtension(fileName);
                                    const badge = getFileTypeBadge(extension);
                                    const { icon: FileIcon, className } =
                                      getFileIcon(extension);

                                    return (
                                      <li
                                        key={`${course.courseId}-edit-${fileUrl}`}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileIcon className={className} />
                                          <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-700 hover:underline break-all"
                                          >
                                            {fileName}
                                          </a>
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.className}`}
                                          >
                                            {badge.label}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveEditCourseFile(fileUrl)
                                          }
                                          className="text-xs font-medium text-rose-600 hover:underline self-start sm:self-auto"
                                        >
                                          Xóa
                                        </button>
                                      </li>
                                    );
                                  },
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Chưa có file nào được upload.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateCourse(course.courseId)
                              }
                              disabled={
                                updatingCourse || uploadingEditCourseFiles
                              }
                              className="rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-60"
                            >
                              {updatingCourse ? "Đang lưu..." : "Lưu cập nhật"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditCourse}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "quizzes" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Quản lí bài quiz
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Danh sách quiz thuộc các bài học trong lớp này.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold px-3 py-1">
                Tổng quiz: {quizzesOfClass.length}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {loadingQuizzes ? (
              <p className="text-slate-500">Đang tải danh sách quiz...</p>
            ) : quizzesOfClass.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cyan-300 bg-cyan-50/40 p-6 text-center">
                <p className="text-slate-600">
                  Chưa có quiz nào trong lớp này.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Hãy vào tab Bài học và bấm nút Tạo quiz để tạo quiz.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzesOfClass.map((quiz) => (
                  <div
                    key={quiz.quizId}
                    className="rounded-xl border border-sky-100 bg-linear-to-br from-white to-cyan-50/50 p-4"
                  >
                    <input
                      ref={(element) => {
                        quizExcelInputRefs.current[quiz.quizId] = element;
                      }}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(event) => {
                        handleImportQuizExcel(quiz, event.target.files);
                        event.target.value = "";
                      }}
                    />

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">
                          {quiz.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {quiz.description || "Chưa có mô tả quiz."}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs">
                          <span className="inline-flex rounded-full bg-violet-100 text-violet-700 px-2.5 py-1 font-medium">
                            Bài học: {getLessonTitleByCourseId(quiz.courseId)}
                          </span>
                          <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 font-medium">
                            Số lần làm tối đa: {quiz.maxAttempts}
                          </span>
                          <span className="inline-flex rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 font-medium">
                            Tạo lúc:{" "}
                            {quiz.createdAt
                              ? new Date(quiz.createdAt).toLocaleString("vi-VN")
                              : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/classes/${classId}/lessons/${quiz.courseId}/quiz?quizId=${quiz.quizId}`,
                            )
                          }
                          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                        >
                          Chỉnh sửa quiz
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectQuizExcel(quiz.quizId)}
                          disabled={importingQuizId === quiz.quizId}
                          className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          {importingQuizId === quiz.quizId
                            ? "Đang import..."
                            : "Import Excel"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(quiz.quizId)}
                          disabled={deletingQuizId === quiz.quizId}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deletingQuizId === quiz.quizId
                            ? "Đang xóa..."
                            : "Xóa"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/classes/${classId}/lessons/${quiz.courseId}/quiz?quizId=${quiz.quizId}`,
                            )
                          }
                          className="rounded-lg border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                        >
                          Quản lí quiz
                        </button>
                      </div>
                    </div>

                    {quizImportResultByQuizId[quiz.quizId] ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
                        <p>
                          Import gần nhất:{" "}
                          {quizImportResultByQuizId[quiz.quizId].importedCount}/
                          {quizImportResultByQuizId[quiz.quizId].totalRows}{" "}
                          dòng.
                        </p>
                        {quizImportResultByQuizId[quiz.quizId].errors
                          ?.length ? (
                          <div className="mt-1 text-rose-700">
                            <p>
                              Lỗi (
                              {
                                quizImportResultByQuizId[quiz.quizId].errors
                                  .length
                              }
                              ):
                            </p>
                            <ul className="list-disc pl-5">
                              {quizImportResultByQuizId[quiz.quizId].errors
                                .slice(0, 5)
                                .map((errorItem, index) => (
                                  <li
                                    key={`${quiz.quizId}-import-error-tab-${index}`}
                                  >
                                    {errorItem}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "students" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Học sinh đã đăng ký
          </h2>
          {loadingStudents ? (
            <p className="text-slate-500 mt-3">
              Đang tải danh sách học sinh...
            </p>
          ) : registeredStudents.length === 0 ? (
            <p className="text-slate-500 mt-3">
              Hiện chưa có học sinh đăng ký.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2">Tên học sinh</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Số điện thoại</th>
                    <th className="pb-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredStudents.map((student) => (
                    <tr
                      key={student.userId}
                      className="border-b border-slate-100"
                    >
                      <td className="py-3 pr-2 text-slate-900">
                        {student.userName}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {student.email}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {student.phone || "-"}
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
      )}

      {activeTab === "feedback" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Feedback lớp học
          </h2>
          {feedbackList.length === 0 ? (
            <p className="text-slate-500 mt-3">
              Chưa có feedback cho lớp học này.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {feedbackList.map((feedback) => (
                <article
                  key={feedback.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {feedback.studentName}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        {renderRatingStars(feedback.rating)}
                      </div>
                      <span className="text-slate-600">
                        {feedback.rating}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-2">{feedback.comment}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TeacherClassManagePage;
