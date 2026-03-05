import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { classRoomService, type ClassRoomDto } from "../../../services/classes/classRoomService";

const JAAS_SCRIPT_SRC =
  "https://8x8.vc/vpaas-magic-cookie-65ee15fba0084777ade13da38e810287/external_api.js";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: { roomName: string; parentNode: HTMLElement }
    ) => unknown;
  }
}

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [clazz, setClazz] = useState<ClassRoomDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await classRoomService.getClassById(classId);
        setClazz(data);
      } catch (e) {
        console.error("Failed to load class detail", e);
        setError("Không thể tải thông tin lớp học");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  useEffect(() => {
    // load Jitsi external script when user is on this page
    const script = document.createElement("script");
    script.src = JAAS_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleJoinClass = () => {
    if (!clazz) return;
    const container = document.getElementById("jaas-container");
    if (!container || !window.JitsiMeetExternalAPI) return;

    const roomName = `vpaas-magic-cookie-65ee15fba0084777ade13da38e810287/${clazz.classId}`;

    // eslint-disable-next-line no-new
    new window.JitsiMeetExternalAPI("8x8.vc", {
      roomName,
      parentNode: container,
    });
  };

  if (!classId) return <div className="p-6">Thiếu classId trên URL</div>;
  if (loading) return <div className="p-6">Đang tải thông tin lớp học…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!clazz) return <div className="p-6">Không tìm thấy lớp học</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {clazz.poster && (
        <div className="w-full h-64 rounded-lg overflow-hidden mb-4">
          <img
            src={clazz.poster}
            alt={clazz.className}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold mb-2">{clazz.className}</h1>
        {clazz.description && <p className="text-gray-700 mb-2">{clazz.description}</p>}
        <p className="text-sm text-gray-600">
          Lịch học: {clazz.schedule || "Chưa cập nhật"} | Sĩ số:{" "}
          {clazz.currentStudents ?? 0}/{clazz.maxStudents ?? "-"}
        </p>
        <p className="mt-2 font-semibold text-blue-600">
          Học phí: {Number(clazz.price || 0).toLocaleString("vi-VN")} VNĐ
        </p>
      </div>

      <button
        onClick={handleJoinClass}
        className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
      >
        Vào lớp học trực tuyến
      </button>

      <div id="jaas-container" className="w-full h-[600px] border rounded mt-4" />
    </div>
  );
};

export default ClassDetailPage;

