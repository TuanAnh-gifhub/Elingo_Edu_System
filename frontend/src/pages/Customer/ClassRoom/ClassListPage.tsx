import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { classRoomService, type ClassRoomDto } from "../../../services/classes/classRoomService";
import RoomCard, { type RoomCardProps } from "../LandingPage/RoomCard";

const ClassListPage = () => {
  const [classes, setClasses] = useState<ClassRoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

