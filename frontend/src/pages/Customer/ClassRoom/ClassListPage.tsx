import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  classRoomService,
  type ClassRoomDto,
  type CreateClassRoomRequest,
  type UpdateClassRoomRequest,
} from "../../../services/classes/classRoomService";
import {
  courseService,
  type CourseDto,
  type CreateCourseRequest,
  type UpdateCourseRequest,
} from "../../../services/courses/courseService";
import { useAuth } from "../../../context/AuthContext";
import RoomCard, { type RoomCardProps } from "../LandingPage/RoomCard";
import TeacherClassDashboard from "./TeacherClassDashboard";

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

const ClassListPage = () => {
  const [classes, setClasses] = useState<ClassRoomDto[]>([]);
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = isTeacherRole(user?.role);

  const handleCreateClass = async (
    payload: CreateClassRoomRequest,
  ): Promise<ClassRoomDto> => {
    const createdClass = await classRoomService.createClass(payload);
    setClasses((prev) => {
      const deduped = prev.filter(
        (item) => item.classId !== createdClass.classId,
      );
      return [createdClass, ...deduped];
    });
    return createdClass;
  };

  const handleUpdateClass = async (
    classId: string,
    payload: UpdateClassRoomRequest,
  ): Promise<ClassRoomDto> => {
    const updatedClass = await classRoomService.updateClass(classId, payload);
    setClasses((prev) =>
      prev.map((item) =>
        item.classId === updatedClass.classId ? updatedClass : item,
      ),
    );
    return updatedClass;
  };

  const handleDeleteClass = async (classId: string): Promise<string> => {
    const message = await classRoomService.deleteClass(classId);
    setClasses((prev) => prev.filter((item) => item.classId !== classId));
    return message;
  };

  const handleCreateCourse = async (
    payload: CreateCourseRequest,
  ): Promise<CourseDto> => {
    return courseService.createCourse(payload);
  };

  const handleUpdateCourse = async (
    courseId: string,
    payload: UpdateCourseRequest,
  ): Promise<CourseDto> => {
    return courseService.updateCourse(courseId, payload);
  };

  const handleDeleteCourse = async (courseId: string): Promise<string> => {
    return courseService.deleteCourse(courseId);
  };

  const handleLoadCourses = useCallback(
    async (classId: string): Promise<CourseDto[]> => {
      const page = await courseService.getCourses(1, 100, classId);
      const courses = page.data || [];
      return courses.filter((course) => course.classId === classId);
    },
    [],
  );

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

  const toRoomProps = (c: ClassRoomDto): RoomCardProps => ({
    id: c.classId,
    title: c.className,
    location: c.schedule || "Lớp học trực tuyến",
    capacity: `${c.currentStudents || 0}-${c.maxStudents || 0} students`,
    price: Number(c.price || 0),
    image: c.poster || null,
    feature: { icon: () => null, label: c.description || "Lớp học" },
  });

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
    return (
      <div className="p-6">
        <TeacherClassDashboard
          classes={classes}
          loading={loading}
          error={error}
          teacherId={user?.userId ?? ""}
          onCreateClass={handleCreateClass}
          onUpdateClass={handleUpdateClass}
          onDeleteClass={handleDeleteClass}
          onCreateCourse={handleCreateCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onLoadCourses={handleLoadCourses}
        />
      </div>
    );
  }

  if (loading) return <div className="p-6">Đang tải danh sách lớp học…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách lớp học</h1>
      {renderSearchBar()}
      {classes.length === 0 ? (
        <div>Chưa có lớp học nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <RoomCard
              key={c.classId}
              {...toRoomProps(c)}
              onClick={() => navigate(`/classes/${c.classId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassListPage;
