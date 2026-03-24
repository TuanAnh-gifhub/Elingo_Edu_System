import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const page = await classRoomService.getClasses(1, 20);
        setClasses(page.data || []);
      } catch (e) {
        console.error("Failed to load classes", e);
        setError("Không thể tải danh sách lớp học");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toRoomProps = (c: ClassRoomDto): RoomCardProps => ({
    id: c.classId,
    title: c.className,
    location: c.schedule || "Lớp học trực tuyến",
    capacity: `${c.currentStudents || 0}-${c.maxStudents || 0} students`,
    price: Number(c.price || 0),
    image: c.poster || null,
    feature: { icon: () => null, label: c.description || "Lớp học" },
  });

  if (isTeacher) {
    return (
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
    );
  }

  if (loading) return <div className="p-6">Đang tải danh sách lớp học…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách lớp học</h1>
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
