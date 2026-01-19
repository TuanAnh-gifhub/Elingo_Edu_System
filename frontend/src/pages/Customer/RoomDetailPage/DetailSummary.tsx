import { useState, useEffect } from "react";
import { FaRegHeart, FaHeart, FaCalendarAlt, FaUsers, FaCheckCircle } from "react-icons/fa";

interface Room {
  listingId?: string | number;
  title: string;
  pricePerMonth?: number;
  price?: number;
  pricePerHour?: number;
  priceCurrency?: string;
  postedTime?: string;
}

interface DetailSummaryProps {
  room: Room;
  isLoggedIn?: boolean;
  requireAuth?: (callback: () => void) => void;
  isDarkMode?: boolean;
}

export default function DetailSummary({
  room,
  isLoggedIn = false,
  requireAuth,
  isDarkMode = false,
}: DetailSummaryProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId] = useState<string | null>(null);

  // Booking form states
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [numberOfPeople, setNumberOfPeople] = useState("1 người");
  const [roomType, setRoomType] = useState("Phòng học");
  const [roomQuantity, setRoomQuantity] = useState(1);

  useEffect(() => {
    // TODO: Implement favorite check logic when API is available
    setIsSaved(false);
  }, [room?.listingId, isLoggedIn]);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isLoggedIn || !currentUserId) {
      console.log("Vui lòng đăng nhập để lưu tin!");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      // TODO: Implement toggle favorite API call
      const newState = !isSaved;
      setIsSaved(newState);
      console.log(newState ? "Đã thêm vào danh sách yêu thích" : "Đã xóa khỏi danh sách yêu thích");
    } catch (error) {
      console.error("Không thể lưu tin. Vui lòng thử lại.", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate booking price
  const pricePerHour = room.pricePerHour || room.pricePerMonth ? (room.pricePerMonth || room.price || 0) / 30 / 24 : 35000;
  const startHour = parseInt(startTime.split(":")[0]);
  const endHour = parseInt(endTime.split(":")[0]);
  const hours = endHour - startHour;
  const rentalPrice = pricePerHour * hours * roomQuantity;
  const serviceFee = 15000 * roomQuantity;
  const totalPrice = rentalPrice + serviceFee;

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleBookNow = () => {
    if (!isLoggedIn) {
      requireAuth?.(() => {
        // TODO: Navigate to booking page or show booking modal
        console.log("Booking:", { selectedDate, startTime, endTime, numberOfPeople, roomType, roomQuantity, totalPrice });
      });
    } else {
      // TODO: Implement booking logic
      console.log("Booking:", { selectedDate, startTime, endTime, numberOfPeople, roomType, roomQuantity, totalPrice });
    }
  };

  // Generate time options
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  return (
    <section
      className={`rounded-lg border p-4 md:p-5 shadow-sm transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Title + Save */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <h1 className={`text-xs! md:text-sm! lg:text-base! font-semibold! leading-snug! wrap-break-word flex-1 min-w-0 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {room.title}
        </h1>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isLoading || !isLoggedIn}
          className={`shrink-0 inline-flex p-3 h-10 w-auto items-center justify-center rounded-full border hover:bg-gray-50 flex-row gap-2 transition-all
            ${
              isSaved
                ? "border-pink-500 bg-pink-50 text-pink-600"
                : isDarkMode
                ? "border-gray-600 text-gray-300"
                : "border-gray-200 text-gray-700"
            }
            ${isLoading || !isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Lưu tin"
          title={isSaved ? "Bỏ lưu" : "Lưu"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : isSaved ? (
            <FaHeart className="text-pink-600" />
          ) : (
            <FaRegHeart />
          )}
          <p className="font-semibold">{isLoading ? "Đang..." : "Lưu"}</p>
        </button>
      </header>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${isDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"}`}>
            {formatPrice(pricePerHour)}
          </span>
          <span className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {room.priceCurrency || "VNĐ"} /giờ
          </span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="space-y-4">
        {/* Chọn ngày */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Chọn ngày
          </label>
          <div className="relative">
            <FaCalendarAlt className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30`}
            />
            <FaCalendarAlt className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`} />
          </div>
        </div>

        {/* Giờ bắt đầu và kết thúc */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Giờ bắt đầu
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border appearance-none ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30`}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Giờ kết thúc
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border appearance-none ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30`}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Số người */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Số người
          </label>
          <div className="relative">
            <FaUsers className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
            <select
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
              className={`w-full pl-10 pr-3 py-2.5 rounded-lg border appearance-none ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30 focus:border-[#4da6ff]`}
            >
              <option value="1 người">1 người</option>
              <option value="2-4 người">2-4 người</option>
              <option value="5-10 người">5-10 người</option>
              <option value="10+ người">10+ người</option>
            </select>
          </div>
        </div>

        {/* Loại phòng */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Loại phòng
          </label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg border appearance-none ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30 focus:border-[#4da6ff]`}
          >
            <option value="Phòng học">Phòng học</option>
            <option value="Phòng lab">Phòng lab</option>
            <option value="Phòng nhóm">Phòng nhóm</option>
            <option value="Phòng thuyết trình">Phòng thuyết trình</option>
            <option value="Thư viện">Thư viện</option>
            <option value="Phòng thí nghiệm">Phòng thí nghiệm</option>
            <option value="Phòng họp">Phòng họp</option>
          </select>
        </div>

        {/* Số lượng phòng */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Số lượng phòng
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRoomQuantity(Math.max(1, roomQuantity - 1))}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center font-semibold transition-all ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30`}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={roomQuantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setRoomQuantity(Math.max(1, value));
              }}
              className={`flex-1 px-3 py-2.5 rounded-lg border text-center font-semibold ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30 focus:border-[#4da6ff]`}
            />
            <button
              type="button"
              onClick={() => setRoomQuantity(roomQuantity + 1)}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center font-semibold transition-all ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              } focus:outline-none focus:ring-2 focus:ring-[#4da6ff]/30`}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Giá thuê ({hours} giờ × {roomQuantity} phòng)
            </span>
            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
              {formatPrice(rentalPrice)} {room.priceCurrency || "VNĐ"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Phí dịch vụ
            </span>
            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
              {formatPrice(serviceFee)} {room.priceCurrency || "VNĐ"}
            </span>
          </div>
          <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Tổng cộng
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"}`}>
              {formatPrice(totalPrice)} {room.priceCurrency || "VNĐ"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6">
        <button
          onClick={handleBookNow}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
            isDarkMode
              ? "bg-[#4da6ff] hover:bg-[#3d8cff]"
              : "bg-[#4da6ff] hover:bg-[#3d8cff]"
          }`}
        >
          Đặt phòng ngay
        </button>
      </div>

      {/* Cancellation Policy */}
      <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-blue-900/20 border border-blue-800/30" : "bg-blue-50 border border-blue-100"}`}>
        <div className="flex items-start gap-3">
          <FaCheckCircle className={`text-lg mt-0.5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? "text-blue-300" : "text-blue-900"}`}>
              Miễn phí hủy trong 24h
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
              Hủy miễn phí trước 24h để được hoàn tiền đầy đủ
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
