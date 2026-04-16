import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { toast } from "react-toastify";
import {
  classRoomService,
  type ClassRoomDto,
} from "../../../services/classes/classRoomService";

const FavoriteClassesPage = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoomDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavoriteClasses = async () => {
      try {
        setLoading(true);
        const data = await classRoomService.getFavoriteClasses();
        setClasses(data || []);
      } catch {
        toast.error("Không thể tải danh sách lớp học yêu thích.");
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteClasses();
  }, []);

  const handleRemoveFavorite = async (classId: string) => {
    try {
      await classRoomService.removeFavoriteClass(classId);
      setClasses((prev) => prev.filter((item) => item.classId !== classId));
      toast.success("Đã bỏ khỏi lớp học yêu thích.");
    } catch {
      toast.error("Không thể bỏ yêu thích lúc này.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lớp học yêu thích</h1>
          <p className="text-sm text-slate-600 mt-1">
            Bạn đã lưu {classes.length} lớp học yêu thích.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Đang tải lớp học yêu thích...</p>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-700 font-medium">Chưa có lớp học yêu thích nào.</p>
          <p className="text-sm text-slate-500 mt-1">
            Hãy vào danh sách lớp học và bấm biểu tượng tim để lưu lớp bạn thích.
          </p>
          <button
            type="button"
            onClick={() => navigate("/classes")}
            className="mt-4 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            Xem danh sách lớp học
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <div
              key={classItem.classId}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="h-44 bg-slate-100">
                {classItem.poster ? (
                  <img
                    src={classItem.poster}
                    alt={classItem.className}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-900 line-clamp-2">{classItem.className}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {classItem.description || "Chưa có mô tả."}
                </p>
                <p className="text-sm font-semibold text-blue-700">
                  {(Number(classItem.price) || 0).toLocaleString("vi-VN")} VND
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/classes/${classItem.classId}`)}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(classItem.classId)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <FiHeart className="w-4 h-4" />
                    Bỏ yêu thích
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteClassesPage;
