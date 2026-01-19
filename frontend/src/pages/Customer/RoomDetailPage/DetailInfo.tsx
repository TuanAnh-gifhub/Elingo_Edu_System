import { useState, useRef, useEffect } from "react";
import EquipmentAmenities from "./EquipmentAmenities";
import LocationSection from "./LocationSection";

interface Room {
  description?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string | number;
  direction?: string;
  deposit?: number;
  status?: string;
  projectName?: string;
  roomType?: string;
  legalDocuments?: string;
  interiorStatus?: string;
  balconyDirection?: string;
  rating?: number;
  reviewCount?: number;
  ratingDistribution?: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
  address?: string;
  location?: string;
  buildingName?: string;
  directions?: string;
  seller?: {
    phone?: string;
  };
}

interface DetailInfoProps {
  room: Room;
  isDarkMode?: boolean;
}

export default function DetailInfo({
  room,
  isDarkMode = false,
}: DetailInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = 24; // Approximate line height in pixels
      const maxHeight = lineHeight * 4; // 4 lines
      const actualHeight = contentRef.current.scrollHeight;
      setShowExpandButton(actualHeight > maxHeight);
    }
  }, [room?.description]);

  if (!room) return null;

  const defaultDescription =
    "Phòng học hiện đại với thiết kế tối ưu, đầy đủ tiện nghi và công nghệ tiên tiến. Phù hợp cho học tập cá nhân, làm việc nhóm, workshop và đào tạo.\n\nKhông gian rộng rãi, điều hòa hiện đại, ánh sáng tự nhiên và thiết kế cách âm tốt tạo môi trường tập trung. Vị trí thuận tiện với nhiều dịch vụ xung quanh.";

  const description = room.description || defaultDescription;

  return (
    <div className="mt-4 space-y-6">
      {/* Giới Thiệu Về Phòng */}
      <div
        className={`border rounded-lg p-6 transition-colors duration-500 ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Giới Thiệu Về Phòng
        </h3>
        <div
          ref={contentRef}
          className={`space-y-3 whitespace-pre-line transition-all duration-300 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          } ${!isExpanded && showExpandButton ? "line-clamp-4" : ""}`}
        >
          <p>{description}</p>
        </div>
        {showExpandButton && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-sm font-medium transition-colors ${
                isDarkMode
                  ? "text-[#4da6ff] hover:text-[#3d8cff]"
                  : "text-[#4da6ff] hover:text-[#3d8cff]"
              }`}
            >
              {isExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          </div>
        )}
      </div>

      {/* Trang Thiết Bị & Tiện Ích */}
      <EquipmentAmenities isDarkMode={isDarkMode} />

      {/* Vị Trí */}
      <LocationSection
        address={room.address}
        location={room.location}
        buildingName={room.buildingName}
        directions={room.directions}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
