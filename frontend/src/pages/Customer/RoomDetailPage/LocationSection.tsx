import { FaMapMarkerAlt } from "react-icons/fa";

interface LocationSectionProps {
  address?: string;
  location?: string;
  buildingName?: string;
  directions?: string;
  isDarkMode?: boolean;
}

export default function LocationSection({
  address,
  location,
  buildingName,
  directions,
  isDarkMode = false,
}: LocationSectionProps) {
  const displayAddress = address || location || "Không xác định";

  return (
    <div
      className={`border rounded-lg p-6 transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        Vị Trí
      </h3>

      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <FaMapMarkerAlt className={`w-5 h-5 mt-0.5 ${isDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"}`} />
          <div className="flex-1">
            <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{displayAddress}</p>
            {buildingName && (
              <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {buildingName}
              </p>
            )}
          </div>
        </div>

        {/* Map placeholder */}
        <div
          className={`w-full h-64 rounded-lg overflow-hidden ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <div className="w-full h-full flex items-center justify-center">
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Bản đồ Google Maps
            </p>
          </div>
        </div>

        {directions && (
          <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            <p className="mb-2">{directions}</p>
            <p className="mb-2">
              Tòa nhà dễ dàng tiếp cận với nhiều phương tiện giao thông công cộng. Có bãi đỗ xe miễn phí cho khách hàng.
            </p>
            <a
              href="#"
              className={`text-[#4da6ff] hover:text-[#3d8cff] font-medium inline-flex items-center gap-1`}
            >
              Xem đường đi →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
