import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  ClassRoomDto,
  CreateClassRoomRequest,
  UpdateClassRoomRequest,
} from "../../../services/classes/classRoomService";
import type {
  CourseDto,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "../../../services/courses/courseService";
import {
  uploadMultipleFiles,
  uploadToCloudinary,
} from "../../../services/upload/uploadService";

interface CourseItem {
  courseId: string;
  classId: string;
  title: string;
  description?: string;
  orderIndex: number;
  fileUrls: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface NewClassForm {
  className: string;
  description: string;
  schedule: string;
  poster: string;
  maxStudents: number;
  price: number;
  startDate: string;
  endDate: string;
}

const MAX_POSTER_LENGTH = 1000;
const MAX_POSTER_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CLASS_POSTER_UPLOAD_FOLDER = "class-posters";
const CLASS_COURSE_FILE_UPLOAD_FOLDER = "class-course-files";

interface NewCourseForm {
  title: string;
  description: string;
  orderIndex: number;
  fileUrlsText: string;
}

const INITIAL_CLASS_FORM: NewClassForm = {
  className: "",
  description: "",
  schedule: "",
  poster: "",
  maxStudents: 25,
  price: 0,
  startDate: "",
  endDate: "",
};

const INITIAL_COURSE_FORM: NewCourseForm = {
  title: "",
  description: "",
  orderIndex: 1,
  fileUrlsText: "",
};

interface TeacherClassDashboardProps {
  classes: ClassRoomDto[];
  loading: boolean;
  error: string | null;
  teacherId: string;
  onCreateClass: (payload: CreateClassRoomRequest) => Promise<ClassRoomDto>;
  onUpdateClass: (
    classId: string,
    payload: UpdateClassRoomRequest,
  ) => Promise<ClassRoomDto>;
  onDeleteClass: (classId: string) => Promise<string>;
  onCreateCourse: (payload: CreateCourseRequest) => Promise<CourseDto>;
  onUpdateCourse: (
    courseId: string,
    payload: UpdateCourseRequest,
  ) => Promise<CourseDto>;
  onDeleteCourse: (courseId: string) => Promise<string>;
  onLoadCourses: (classId: string) => Promise<CourseDto[]>;
}

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

const mapClassToForm = (classItem: ClassRoomDto): NewClassForm => ({
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

const mapCourseToForm = (courseItem: CourseItem): NewCourseForm => ({
  title: courseItem.title || "",
  description: courseItem.description || "",
  orderIndex: courseItem.orderIndex ?? 0,
  fileUrlsText: courseItem.fileUrls.join("\n"),
});

const getFileNameFromUrl = (fileUrl: string, index: number) => {
  try {
    const url = new URL(fileUrl);
    const rawName = decodeURIComponent(
      url.pathname.split("/").pop() || "",
    ).trim();
    return rawName || `tep-dinh-kem-${index + 1}`;
  } catch {
    const fallback = decodeURIComponent(fileUrl.split("/").pop() || "").trim();
    return fallback || `tep-dinh-kem-${index + 1}`;
  }
};

const getFileExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
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
    case "zip":
    case "rar":
      return { label: "ARCHIVE", className: "bg-violet-100 text-violet-700" };
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif":
      return { label: "IMAGE", className: "bg-cyan-100 text-cyan-700" };
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
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
    case "txt":
    case "xls":
    case "xlsx":
      return { icon: FiFileText, className: "text-slate-600" };
    default:
      return { icon: FiFile, className: "text-slate-500" };
  }
};

const TeacherClassDashboard = ({
  classes,
  loading,
  error,
  teacherId,
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onLoadCourses,
}: TeacherClassDashboardProps) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    classes[0]?.classId ?? null,
  );
  const [coursesByClass, setCoursesByClass] = useState<
    Record<string, CourseItem[]>
  >({});
  const [showClassForm, setShowClassForm] = useState(false);
  const [showEditClassForm, setShowEditClassForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [classForm, setClassForm] = useState<NewClassForm>(INITIAL_CLASS_FORM);
  const [editClassForm, setEditClassForm] =
    useState<NewClassForm>(INITIAL_CLASS_FORM);
  const [courseForm, setCourseForm] =
    useState<NewCourseForm>(INITIAL_COURSE_FORM);
  const [editCourseForm, setEditCourseForm] =
    useState<NewCourseForm>(INITIAL_COURSE_FORM);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [isUploadingCreatePoster, setIsUploadingCreatePoster] = useState(false);
  const [isUploadingEditPoster, setIsUploadingEditPoster] = useState(false);
  const [createPosterFileName, setCreatePosterFileName] = useState("");
  const [editPosterFileName, setEditPosterFileName] = useState("");
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [isUploadingCourseFiles, setIsUploadingCourseFiles] = useState(false);
  const [isUploadingEditCourseFiles, setIsUploadingEditCourseFiles] =
    useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const createPosterInputRef = useRef<HTMLInputElement>(null);
  const editPosterInputRef = useRef<HTMLInputElement>(null);
  const courseFileInputRef = useRef<HTMLInputElement>(null);
  const editCourseFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId(null);
      return;
    }

    setSelectedClassId((current) => {
      if (current && classes.some((item) => item.classId === current)) {
        return current;
      }
      return classes[0].classId;
    });
  }, [classes]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.classId === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const selectedClassCourses = useMemo(
    () => (selectedClassId ? (coursesByClass[selectedClassId] ?? []) : []),
    [coursesByClass, selectedClassId],
  );

  useEffect(() => {
    if (!editingCourseId) {
      return;
    }

    if (
      !selectedClassCourses.some(
        (course) => course.courseId === editingCourseId,
      )
    ) {
      setEditingCourseId(null);
      setEditCourseForm(INITIAL_COURSE_FORM);
    }
  }, [editingCourseId, selectedClassCourses]);

  useEffect(() => {
    setExpandedCourseIds(new Set());
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      return;
    }

    let isActive = true;

    const loadCoursesByClass = async () => {
      try {
        setIsLoadingCourses(true);
        const courses = await onLoadCourses(selectedClassId);

        if (!isActive) {
          return;
        }

        setCoursesByClass((prev) => ({
          ...prev,
          [selectedClassId]: courses,
        }));
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải danh sách khóa học.";
        toast.error(message);
      } finally {
        if (isActive) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadCoursesByClass();

    return () => {
      isActive = false;
    };
  }, [selectedClassId, onLoadCourses]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, item) => sum + (item.currentStudents ?? 0), 0),
    [classes],
  );

  const handleCreateClass = async () => {
    if (!classForm.className.trim()) {
      toast.error("Vui lòng nhập tên lớp học.");
      return;
    }

    if (!teacherId) {
      toast.error("Không tìm thấy thông tin giáo viên đăng nhập.");
      return;
    }

    if (!classForm.startDate || !classForm.endDate) {
      toast.error("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }

    const startDate = new Date(classForm.startDate);
    const endDate = new Date(classForm.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Định dạng ngày không hợp lệ.");
      return;
    }

    if (endDate <= startDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    if (isUploadingCreatePoster) {
      toast.error("Ảnh poster đang được upload. Vui lòng đợi hoàn tất.");
      return;
    }

    if (classForm.poster.trim().length > MAX_POSTER_LENGTH) {
      toast.error(`Poster không được vượt quá ${MAX_POSTER_LENGTH} ký tự.`);
      return;
    }

    const payload: CreateClassRoomRequest = {
      className: classForm.className.trim(),
      description: classForm.description.trim() || "Lớp mới tạo",
      teacherId,
      price: Number(classForm.price || 0),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      maxStudents: Number(classForm.maxStudents || 1),
      schedule: classForm.schedule.trim() || "Chưa lên lịch",
      poster: normalizePoster(classForm.poster),
    };

    try {
      setIsCreatingClass(true);
      const createdClass = await onCreateClass(payload);
      setSelectedClassId(createdClass.classId);
      setClassForm(INITIAL_CLASS_FORM);
      setCreatePosterFileName("");
      setShowClassForm(false);
      toast.success("Tạo lớp học thành công.");
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Tạo lớp học thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!selectedClassId) {
      toast.error("Hãy chọn lớp trước khi tạo khóa học.");
      return;
    }

    if (!courseForm.title.trim()) {
      toast.error("Vui lòng nhập tên khóa học.");
      return;
    }

    if (isUploadingCourseFiles) {
      toast.error("Tài liệu đang được upload. Vui lòng đợi hoàn tất.");
      return;
    }

    if (courseForm.orderIndex < 0) {
      toast.error("Thứ tự bài học không hợp lệ.");
      return;
    }

    const fileUrls = courseForm.fileUrlsText
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: CreateCourseRequest = {
      classId: selectedClassId,
      title: courseForm.title.trim(),
      description:
        courseForm.description.trim() || "Nội dung khóa học đang cập nhật",
      orderIndex: Number(courseForm.orderIndex || 0),
      fileUrls,
    };

    try {
      setIsCreatingCourse(true);
      const createdCourse = await onCreateCourse(payload);
      setCoursesByClass((prev) => ({
        ...prev,
        [createdCourse.classId]: [
          createdCourse,
          ...(prev[createdCourse.classId] ?? []),
        ],
      }));
      setCourseForm(INITIAL_COURSE_FORM);
      setShowCourseForm(false);
      toast.success("Tạo khóa học thành công.");
    } catch (createCourseError) {
      const message =
        createCourseError instanceof Error
          ? createCourseError.message
          : "Tạo khóa học thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const openEditCourseForm = (course: CourseItem) => {
    setEditingCourseId(course.courseId);
    setEditCourseForm(mapCourseToForm(course));
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId || !selectedClassId) {
      toast.error("Không tìm thấy khóa học cần cập nhật.");
      return;
    }

    if (isUploadingEditCourseFiles) {
      toast.error("Tài liệu đang được upload. Vui lòng đợi hoàn tất.");
      return;
    }

    if (!editCourseForm.title.trim()) {
      toast.error("Vui lòng nhập tên khóa học.");
      return;
    }

    if (editCourseForm.orderIndex < 0) {
      toast.error("Thứ tự bài học không hợp lệ.");
      return;
    }

    const targetCourse = selectedClassCourses.find(
      (course) => course.courseId === editingCourseId,
    );

    if (!targetCourse) {
      toast.error("Không tìm thấy dữ liệu khóa học cần cập nhật.");
      return;
    }

    const fileUrls = editCourseForm.fileUrlsText
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: UpdateCourseRequest = {
      classId: targetCourse.classId,
      title: editCourseForm.title.trim(),
      description:
        editCourseForm.description.trim() || "Nội dung khóa học đang cập nhật",
      orderIndex: Number(editCourseForm.orderIndex || 0),
      fileUrls,
    };

    try {
      setIsUpdatingCourse(true);
      const updatedCourse = await onUpdateCourse(editingCourseId, payload);
      setCoursesByClass((prev) => ({
        ...prev,
        [updatedCourse.classId]: (prev[updatedCourse.classId] ?? []).map(
          (course) =>
            course.courseId === updatedCourse.courseId ? updatedCourse : course,
        ),
      }));
      setEditingCourseId(null);
      setEditCourseForm(INITIAL_COURSE_FORM);
      toast.success("Cập nhật khóa học thành công.");
    } catch (updateCourseError) {
      const message =
        updateCourseError instanceof Error
          ? updateCourseError.message
          : "Cập nhật khóa học thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa khóa học "${course.title}" không?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingCourseId(course.courseId);
      const deleteMessage = await onDeleteCourse(course.courseId);
      setCoursesByClass((prev) => ({
        ...prev,
        [course.classId]: (prev[course.classId] ?? []).filter(
          (item) => item.courseId !== course.courseId,
        ),
      }));

      if (editingCourseId === course.courseId) {
        setEditingCourseId(null);
        setEditCourseForm(INITIAL_COURSE_FORM);
      }

      setExpandedCourseIds((prev) => {
        const next = new Set(prev);
        next.delete(course.courseId);
        return next;
      });

      toast.success(deleteMessage || "Xóa khóa học thành công.");
    } catch (deleteCourseError) {
      const message =
        deleteCourseError instanceof Error
          ? deleteCourseError.message
          : "Xóa khóa học thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const toggleCourseExpand = (courseId: string) => {
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

  const openEditClassForm = () => {
    if (!selectedClass) {
      toast.error("Hãy chọn lớp cần chỉnh sửa.");
      return;
    }

    setEditClassForm(mapClassToForm(selectedClass));
    setEditPosterFileName("");
    setShowEditClassForm(true);
  };

  const handleUploadPoster = async (file: File, isEditForm: boolean) => {
    const validationError = validatePosterFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (isEditForm) {
      setIsUploadingEditPoster(true);
    } else {
      setIsUploadingCreatePoster(true);
    }

    try {
      const uploaded = await uploadToCloudinary(file, {
        folder: CLASS_POSTER_UPLOAD_FOLDER,
      });

      if (!uploaded.success || !uploaded.data.url) {
        toast.error(uploaded.error || "Upload poster thất bại.");
        return;
      }

      if (uploaded.data.url.length > MAX_POSTER_LENGTH) {
        toast.error(`URL poster vượt quá ${MAX_POSTER_LENGTH} ký tự.`);
        return;
      }

      if (isEditForm) {
        setEditClassForm((prev) => ({
          ...prev,
          poster: uploaded.data.url,
        }));
      } else {
        setClassForm((prev) => ({
          ...prev,
          poster: uploaded.data.url,
        }));
      }

      toast.success("Upload poster thành công.");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload poster thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      if (isEditForm) {
        setIsUploadingEditPoster(false);
      } else {
        setIsUploadingCreatePoster(false);
      }
    }
  };

  const handleUploadCourseFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileList = Array.from(files);
    setIsUploadingCourseFiles(true);

    try {
      const results = await uploadMultipleFiles(fileList, {
        folder: CLASS_COURSE_FILE_UPLOAD_FOLDER,
      });

      const successUrls = results
        .filter((item) => item.success && Boolean(item.data.url))
        .map((item) => item.data.url);

      if (successUrls.length === 0) {
        const firstError = results.find((item) => !item.success)?.error;
        toast.error(firstError || "Upload tài liệu thất bại.");
        return;
      }

      setCourseForm((prev) => {
        const existingUrls = prev.fileUrlsText
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);

        const mergedUrls = Array.from(
          new Set([...existingUrls, ...successUrls]),
        );

        return {
          ...prev,
          fileUrlsText: mergedUrls.join("\n"),
        };
      });

      const failedCount = results.length - successUrls.length;
      if (failedCount > 0) {
        toast.warn(
          `Đã upload ${successUrls.length} tệp, ${failedCount} tệp thất bại.`,
        );
      } else {
        toast.success(`Đã upload ${successUrls.length} tệp tài liệu.`);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload tài liệu thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsUploadingCourseFiles(false);
    }
  };

  const handleUploadEditCourseFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileList = Array.from(files);
    setIsUploadingEditCourseFiles(true);

    try {
      const results = await uploadMultipleFiles(fileList, {
        folder: CLASS_COURSE_FILE_UPLOAD_FOLDER,
      });

      const successUrls = results
        .filter((item) => item.success && Boolean(item.data.url))
        .map((item) => item.data.url);

      if (successUrls.length === 0) {
        const firstError = results.find((item) => !item.success)?.error;
        toast.error(firstError || "Upload tài liệu thất bại.");
        return;
      }

      setEditCourseForm((prev) => {
        const existingUrls = prev.fileUrlsText
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);

        const mergedUrls = Array.from(
          new Set([...existingUrls, ...successUrls]),
        );

        return {
          ...prev,
          fileUrlsText: mergedUrls.join("\n"),
        };
      });

      const failedCount = results.length - successUrls.length;
      if (failedCount > 0) {
        toast.warn(
          `Đã upload ${successUrls.length} tệp, ${failedCount} tệp thất bại.`,
        );
      } else {
        toast.success(`Đã upload ${successUrls.length} tệp tài liệu.`);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload tài liệu thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsUploadingEditCourseFiles(false);
    }
  };

  const handlePosterFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isEditForm: boolean,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (isEditForm) {
      setEditPosterFileName(file.name);
    } else {
      setCreatePosterFileName(file.name);
    }

    await handleUploadPoster(file, isEditForm);
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) {
      toast.error("Không tìm thấy lớp để cập nhật.");
      return;
    }

    if (!editClassForm.className.trim()) {
      toast.error("Vui lòng nhập tên lớp học.");
      return;
    }

    if (!teacherId) {
      toast.error("Không tìm thấy thông tin giáo viên đăng nhập.");
      return;
    }

    if (!editClassForm.startDate || !editClassForm.endDate) {
      toast.error("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }

    const startDate = new Date(editClassForm.startDate);
    const endDate = new Date(editClassForm.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Định dạng ngày không hợp lệ.");
      return;
    }

    if (endDate <= startDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    if (isUploadingEditPoster) {
      toast.error("Ảnh poster đang được upload. Vui lòng đợi hoàn tất.");
      return;
    }

    if (editClassForm.poster.trim().length > MAX_POSTER_LENGTH) {
      toast.error(`Poster không được vượt quá ${MAX_POSTER_LENGTH} ký tự.`);
      return;
    }

    const payload: UpdateClassRoomRequest = {
      className: editClassForm.className.trim(),
      description: editClassForm.description.trim() || "Lớp học đã cập nhật",
      teacherId,
      price: Number(editClassForm.price || 0),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      maxStudents: Number(editClassForm.maxStudents || 1),
      schedule: editClassForm.schedule.trim() || "Chưa lên lịch",
      poster: normalizePoster(editClassForm.poster),
    };

    try {
      setIsUpdatingClass(true);
      await onUpdateClass(selectedClass.classId, payload);
      setShowEditClassForm(false);
      toast.success("Cập nhật lớp học thành công.");
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Cập nhật lớp học thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsUpdatingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) {
      toast.error("Hãy chọn lớp cần xóa.");
      return;
    }

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa lớp "${selectedClass.className}" không? Hành động này không thể hoàn tác.`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setIsDeletingClass(true);
      const deleteMessage = await onDeleteClass(selectedClass.classId);
      setShowEditClassForm(false);
      toast.success(deleteMessage || "Xóa lớp học thành công.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Xóa lớp học thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsDeletingClass(false);
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải không gian lớp học giáo viên...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Classroom Studio - Giáo viên
            </p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Quản lý lớp học và khóa học của bạn
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              Tạo lớp mới, tổ chức các khóa học trong từng lớp, chuẩn bị cấu
              trúc học liệu. Phần quiz sẽ bổ sung sau theo kế hoạch.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowClassForm((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {showClassForm ? "Đóng form tạo lớp" : "+ Tạo lớp mới"}
          </button>
        </div>

        <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng lớp
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {classes.length}
            </p>
          </article>
          <article className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Học viên hiện có
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalStudents}
            </p>
          </article>
          <article className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Khóa học đã tạo
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {Object.values(coursesByClass).reduce(
                (sum, items) => sum + items.length,
                0,
              )}
            </p>
          </article>
        </div>

        {showClassForm && (
          <div className="relative z-10 mt-6 rounded-2xl border border-sky-100 bg-white/90 p-4 md:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Tạo lớp học mới
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Tên lớp học
                </span>
                <input
                  type="text"
                  placeholder="Ví dụ: IELTS Foundation T6"
                  value={classForm.className}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      className: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Lịch học
                </span>
                <input
                  type="text"
                  placeholder="Ví dụ: T2-T4-T6 19:30"
                  value={classForm.schedule}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      schedule: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Ngày bắt đầu
                </span>
                <input
                  type="datetime-local"
                  value={classForm.startDate}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Ngày kết thúc
                </span>
                <input
                  type="datetime-local"
                  value={classForm.endDate}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Sĩ số tối đa
                </span>
                <input
                  type="number"
                  min={1}
                  value={classForm.maxStudents}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      maxStudents: Number(event.target.value || 1),
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Học phí (VNĐ)
                </span>
                <input
                  type="number"
                  min={0}
                  value={classForm.price}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      price: Number(event.target.value || 0),
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Poster lớp học
                </span>
                <input
                  ref={createPosterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void handlePosterFileSelection(event, false)
                  }
                  className="hidden"
                />
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => createPosterInputRef.current?.click()}
                      disabled={isUploadingCreatePoster}
                      className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingCreatePoster
                        ? "Đang upload poster..."
                        : "Tải poster từ máy"}
                    </button>
                    <span className="text-xs text-slate-500">
                      {createPosterFileName ||
                        (classForm.poster
                          ? "Đã có poster. Bạn có thể chọn ảnh mới để thay thế."
                          : "Chưa chọn ảnh nào")}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">
                  Chọn ảnh từ máy tính, hệ thống sẽ upload lên Cloudinary.
                </span>
                {isUploadingCreatePoster && (
                  <span className="text-xs text-sky-600">
                    Đang upload poster...
                  </span>
                )}
                {classForm.poster && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={classForm.poster}
                      alt="Poster preview"
                      className="h-20 w-32 rounded-md border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setClassForm((prev) => ({ ...prev, poster: "" }));
                        setCreatePosterFileName("");
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Xóa poster
                    </button>
                  </div>
                )}
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Mô tả lớp học
                </span>
                <textarea
                  placeholder="Mô tả ngắn về mục tiêu, đối tượng học viên, phương pháp giảng dạy..."
                  value={classForm.description}
                  onChange={(event) =>
                    setClassForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                  rows={3}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateClass}
                disabled={isCreatingClass || isUploadingCreatePoster}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                {isCreatingClass ? "Đang tạo..." : "Lưu lớp học"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassForm(INITIAL_CLASS_FORM);
                  setShowClassForm(false);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Danh sách lớp của bạn
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                Nhấn vào lớp để quản lý khóa học
              </span>
              <button
                type="button"
                onClick={openEditClassForm}
                disabled={!selectedClass}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Chỉnh sửa lớp
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                disabled={!selectedClass || isDeletingClass}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingClass ? "Đang xóa..." : "Xóa lớp"}
              </button>
            </div>
          </div>

          {showEditClassForm && selectedClass && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 md:p-5">
              <h3 className="text-base font-semibold text-slate-900">
                Chỉnh sửa lớp học: {selectedClass.className}
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Tên lớp học
                  </span>
                  <input
                    type="text"
                    value={editClassForm.className}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        className: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Lịch học
                  </span>
                  <input
                    type="text"
                    value={editClassForm.schedule}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        schedule: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Ngày bắt đầu
                  </span>
                  <input
                    type="datetime-local"
                    value={editClassForm.startDate}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Ngày kết thúc
                  </span>
                  <input
                    type="datetime-local"
                    value={editClassForm.endDate}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        endDate: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Sĩ số tối đa
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={editClassForm.maxStudents}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        maxStudents: Number(event.target.value || 1),
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Học phí (VNĐ)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={editClassForm.price}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        price: Number(event.target.value || 0),
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Poster lớp học
                  </span>
                  <input
                    ref={editPosterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void handlePosterFileSelection(event, true)
                    }
                    className="hidden"
                  />
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editPosterInputRef.current?.click()}
                        disabled={isUploadingEditPoster}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploadingEditPoster
                          ? "Đang upload poster..."
                          : "Chọn poster mới"}
                      </button>
                      <span className="text-xs text-slate-500">
                        {editPosterFileName ||
                          (editClassForm.poster
                            ? "Đang dùng poster hiện tại."
                            : "Chưa có poster")}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Chọn ảnh từ máy tính để cập nhật poster.
                  </span>
                  {isUploadingEditPoster && (
                    <span className="text-xs text-amber-600">
                      Đang upload poster...
                    </span>
                  )}
                  {editClassForm.poster && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={editClassForm.poster}
                        alt="Poster preview"
                        className="h-20 w-32 rounded-md border border-slate-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditClassForm((prev) => ({ ...prev, poster: "" }));
                          setEditPosterFileName("");
                        }}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Xóa poster
                      </button>
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Mô tả lớp học
                  </span>
                  <textarea
                    rows={3}
                    value={editClassForm.description}
                    onChange={(event) =>
                      setEditClassForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUpdateClass}
                  disabled={isUpdatingClass || isUploadingEditPoster}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingClass ? "Đang lưu..." : "Lưu chỉnh sửa"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditClassForm(false);
                    setEditClassForm(INITIAL_CLASS_FORM);
                    setEditPosterFileName("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {classes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              Bạn chưa có lớp học nào. Hãy tạo lớp đầu tiên.
            </div>
          ) : (
            classes.map((item) => {
              const isSelected = item.classId === selectedClassId;
              return (
                <button
                  key={item.classId}
                  type="button"
                  onClick={() => setSelectedClassId(item.classId)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-sky-300 bg-sky-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={`Poster ${item.className}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-400">
                          Chưa có poster
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
                          {item.className}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.active ? "Đang hoạt động" : "Tạm dừng"}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                        <p className="line-clamp-1">
                          Lịch: {item.schedule || "Chưa cập nhật"}
                        </p>
                        <p>
                          Sĩ số: {item.currentStudents ?? 0}/
                          {item.maxStudents ?? "-"}
                        </p>
                        <p>
                          Học phí:{" "}
                          {Number(item.price || 0).toLocaleString("vi-VN")} VNĐ
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {selectedClass ? (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-3">
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {selectedClass.poster ? (
                    <img
                      src={selectedClass.poster}
                      alt={`Poster ${selectedClass.className}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-400">
                      Chưa có poster
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {selectedClass.className}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {selectedClass.description || "Chưa có mô tả"}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                <p>Lịch học: {selectedClass.schedule || "Chưa cập nhật"}</p>
                <p>
                  Học phí:{" "}
                  {Number(selectedClass.price || 0).toLocaleString("vi-VN")} VNĐ
                </p>
                <p>
                  Sĩ số: {selectedClass.currentStudents ?? 0}/
                  {selectedClass.maxStudents ?? "-"}
                </p>
                <p>
                  Trạng thái:{" "}
                  {selectedClass.active ? "Đang hoạt động" : "Tạm dừng"}
                </p>
                <p>
                  Bắt đầu:{" "}
                  {selectedClass.startDate
                    ? new Date(selectedClass.startDate).toLocaleString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
                <p>
                  Kết thúc:{" "}
                  {selectedClass.endDate
                    ? new Date(selectedClass.endDate).toLocaleString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Khóa học trong lớp
              </h2>
              <p className="text-sm text-slate-500">
                {selectedClass
                  ? selectedClass.className
                  : "Chọn một lớp để bắt đầu"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCourseForm((prev) => !prev)}
              disabled={!selectedClassId}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Tạo khóa học
            </button>
          </div>

          {showCourseForm && selectedClassId && (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Tên khóa học
                </span>
                <input
                  type="text"
                  placeholder="Ví dụ: IELTS Speaking Intensive"
                  value={courseForm.title}
                  onChange={(event) =>
                    setCourseForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Mô tả khóa học
                </span>
                <textarea
                  placeholder="Mục tiêu khóa học, đầu ra, nội dung trọng tâm..."
                  value={courseForm.description}
                  onChange={(event) =>
                    setCourseForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Thứ tự hiển thị (orderIndex)
                </span>
                <input
                  type="number"
                  min={0}
                  value={courseForm.orderIndex}
                  onChange={(event) =>
                    setCourseForm((prev) => ({
                      ...prev,
                      orderIndex: Number(event.target.value || 0),
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  File URLs (mỗi dòng 1 link)
                </span>
                <input
                  ref={courseFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,image/*,video/*,audio/*"
                  onChange={(event) => {
                    void handleUploadCourseFiles(event.target.files);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/70 p-2">
                  <button
                    type="button"
                    onClick={() => courseFileInputRef.current?.click()}
                    disabled={isUploadingCourseFiles}
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploadingCourseFiles
                      ? "Đang upload tài liệu..."
                      : "Upload tài liệu từ máy"}
                  </button>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Hệ thống sẽ upload file và tự điền URL vào danh sách bên
                    dưới.
                  </p>
                </div>
                <textarea
                  placeholder="https://.../slide-1.pdf\nhttps://.../worksheet.docx"
                  rows={3}
                  value={courseForm.fileUrlsText}
                  onChange={(event) =>
                    setCourseForm((prev) => ({
                      ...prev,
                      fileUrlsText: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCourse}
                  disabled={isCreatingCourse || isUploadingCourseFiles}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  {isCreatingCourse ? "Đang tạo..." : "Lưu khóa học"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCourseForm(INITIAL_COURSE_FORM);
                    setShowCourseForm(false);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {editingCourseId && selectedClassId && (
            <div className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Chỉnh sửa khóa học
              </h3>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Tên khóa học
                </span>
                <input
                  type="text"
                  value={editCourseForm.title}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Mô tả khóa học
                </span>
                <textarea
                  rows={3}
                  value={editCourseForm.description}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Thứ tự hiển thị (orderIndex)
                </span>
                <input
                  type="number"
                  min={0}
                  value={editCourseForm.orderIndex}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({
                      ...prev,
                      orderIndex: Number(event.target.value || 0),
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  File URLs (mỗi dòng 1 link)
                </span>
                <input
                  ref={editCourseFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,image/*,video/*,audio/*"
                  onChange={(event) => {
                    void handleUploadEditCourseFiles(event.target.files);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/70 p-2">
                  <button
                    type="button"
                    onClick={() => editCourseFileInputRef.current?.click()}
                    disabled={isUploadingEditCourseFiles}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploadingEditCourseFiles
                      ? "Đang upload tài liệu..."
                      : "Upload tài liệu từ máy"}
                  </button>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Hệ thống sẽ upload file và tự điền URL vào danh sách bên
                    dưới.
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={editCourseForm.fileUrlsText}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({
                      ...prev,
                      fileUrlsText: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUpdateCourse}
                  disabled={isUpdatingCourse || isUploadingEditCourseFiles}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  {isUpdatingCourse ? "Đang lưu..." : "Lưu khóa học"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourseId(null);
                    setEditCourseForm(INITIAL_COURSE_FORM);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {isLoadingCourses ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Đang tải danh sách khóa học...
              </div>
            ) : selectedClassId && selectedClassCourses.length > 0 ? (
              selectedClassCourses.map((course) => (
                <article
                  key={course.courseId}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  {(() => {
                    const isExpanded = expandedCourseIds.has(course.courseId);
                    return (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                              Thứ tự: {course.orderIndex}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditCourseForm(course)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(course)}
                              disabled={deletingCourseId === course.courseId}
                              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingCourseId === course.courseId
                                ? "Đang xóa..."
                                : "Xóa"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                toggleCourseExpand(course.courseId)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              {isExpanded ? (
                                <>
                                  Thu gọn <FiChevronUp />
                                </>
                              ) : (
                                <>
                                  Xem tài liệu <FiChevronDown />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {course.description || "Chưa có mô tả"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            {course.fileUrls.length} tệp đính kèm
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            {course.createdAt
                              ? new Date(course.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "Mới tạo"}
                          </span>
                        </div>

                        {isExpanded && course.fileUrls.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {course.fileUrls.map((fileUrl, index) => {
                              const trimmedUrl = fileUrl.trim();
                              if (!trimmedUrl) {
                                return null;
                              }

                              const fileName = getFileNameFromUrl(
                                trimmedUrl,
                                index,
                              );
                              const extension = getFileExtension(fileName);
                              const typeBadge = getFileTypeBadge(extension);
                              const fileIcon = getFileIcon(extension);
                              const FileIcon = fileIcon.icon;
                              const hasExtension = /\.[a-zA-Z0-9]{2,8}$/.test(
                                fileName,
                              );
                              const downloadName = hasExtension
                                ? fileName
                                : `${fileName}.bin`;

                              return (
                                <div
                                  key={`${course.courseId}-file-${index}`}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <FileIcon
                                      className={`shrink-0 ${fileIcon.className}`}
                                    />
                                    <span
                                      className="max-w-55 truncate text-xs font-medium text-slate-700"
                                      title={trimmedUrl}
                                    >
                                      {fileName}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeBadge.className}`}
                                    >
                                      {typeBadge.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <a
                                      href={trimmedUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    >
                                      Mở
                                    </a>
                                    <a
                                      href={trimmedUrl}
                                      download={downloadName}
                                      className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    >
                                      Tải xuống
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {isExpanded && course.fileUrls.length === 0 ? (
                          <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                            Khóa học này chưa có tài liệu.
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                {selectedClassId
                  ? "Lớp này chưa có khóa học nào. Tạo khóa học đầu tiên để bắt đầu."
                  : "Chọn lớp ở bên trái để quản lý khóa học."}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            Ghi chú: phần Quiz chưa triển khai ở sprint này. Màn hình hiện tập
            trung vào quản trị lớp và khóa học.
          </div>
        </aside>
      </div>
    </section>
  );
};

export default TeacherClassDashboard;
