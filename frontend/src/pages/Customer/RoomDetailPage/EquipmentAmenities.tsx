import {
  FaWifi,
  FaVideo,
  FaChalkboardTeacher,
  FaPrint,
  FaFan,
  FaWrench,
} from "react-icons/fa";

interface Amenity {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface EquipmentAmenitiesProps {
  amenities?: Amenity[];
  isDarkMode?: boolean;
}

const DEFAULT_AMENITIES: Amenity[] = [
  { id: "wifi", name: "Digital Wi-Fi", icon: FaWifi },
  { id: "projector", name: "4K Projector", icon: FaVideo },
  { id: "whiteboard", name: "Smart Whiteboard", icon: FaChalkboardTeacher },
  { id: "printer", name: "Printing & Scanning", icon: FaPrint },
  { id: "ac", name: "Central Air Conditioning", icon: FaFan },
  { id: "tools", name: "Lab Room Tools", icon: FaWrench },
];

export default function EquipmentAmenities({
  amenities = DEFAULT_AMENITIES,
  isDarkMode = false,
}: EquipmentAmenitiesProps) {
  return (
    <div
      className={`border rounded-lg p-6 transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
      >
        Trang Thiết Bị & Tiện Ích
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {amenities.map((amenity) => {
          const Icon = amenity.icon;
          return (
            <button
              key={amenity.id}
              type="button"
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 hover:border-[#4da6ff] hover:bg-gray-700/80"
                  : "bg-white border-gray-200 hover:border-[#4da6ff] hover:bg-gray-50"
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-2 ${isDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"}`}
              />
              <span
                className={`text-xs text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {amenity.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
