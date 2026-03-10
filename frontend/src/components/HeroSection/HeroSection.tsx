import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiCalendar } from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import backgroundHeroSection from "../../assets/backgroundHeroSection.jpg";
import introLandingVideo from "../../assets/intro_landing_page.mp4";

const CITIES = ["Tp Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ"] as const;

const ROOM_TYPES = [
  "Tất cả lớp học",
  "Lớp học 1-1",
  "Lớp học nhóm",
  "Lớp kỹ năng / workshop",
  "Lớp ngoại ngữ",
  "Lớp luyện thi",
  "Lớp trực tuyến",
] as const;

const HeroSection = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState<(typeof CITIES)[number]>(CITIES[0]);
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>(ROOM_TYPES[0]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dateRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const cityRef = useRef<HTMLDivElement | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const roomTypeRef = useRef<HTMLDivElement | null>(null);
  const roomTypeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Kiểm tra calendar - chỉ đóng nếu click hoàn toàn bên ngoài
      if (isDateOpen) {
        const clickedInsideDateButton = dateRef.current?.contains(target);
        const clickedInsideCalendar = calendarRef.current?.contains(target);
        
        if (!clickedInsideDateButton && !clickedInsideCalendar) {
          setIsDateOpen(false);
        }
      }
      
      // Kiểm tra city dropdown
      if (isCityOpen) {
        const clickedInsideCityButton = cityRef.current?.contains(target);
        const clickedInsideCityDropdown = cityDropdownRef.current?.contains(target);
        
        if (!clickedInsideCityButton && !clickedInsideCityDropdown) {
          setIsCityOpen(false);
        }
      }
      
      // Kiểm tra roomType dropdown
      if (isRoomTypeOpen) {
        const clickedInsideRoomTypeButton = roomTypeRef.current?.contains(target);
        const clickedInsideRoomTypeDropdown = roomTypeDropdownRef.current?.contains(target);
        
        if (!clickedInsideRoomTypeButton && !clickedInsideRoomTypeDropdown) {
          setIsRoomTypeOpen(false);
        }
      }
    };

    if (isDateOpen || isCityOpen || isRoomTypeOpen) {
      // Dùng click thay vì mousedown để tránh conflict với button clicks
      document.addEventListener("click", handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isDateOpen, isCityOpen, isRoomTypeOpen]);

  // Thêm CSS để đảm bảo calendar luôn ở trên cùng
  useEffect(() => {
    if (isDateOpen) {
      const styleId = 'calendar-z-index-fix';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        [data-calendar-portal] {
          z-index: 999999 !important;
          position: fixed !important;
          isolation: isolate !important;
        }
      `;
      
      return () => {
        // Không xóa style element để tránh flash khi đóng/mở lại
      };
    }
  }, [isDateOpen]);

  // Thêm CSS để ẩn scrollbar trong dropdown "Loại phòng"
  useEffect(() => {
    const styleId = 'room-type-dropdown-scrollbar-hide';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      [data-room-type-dropdown]::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
    `;
    
    return () => {
      // Giữ style element để áp dụng cho tất cả dropdown
    };
  }, []);

  // Không cần useEffect để cập nhật vị trí nữa vì calendar dùng absolute positioning relative với button



  const formatDateRangeLabel = () => {
    if (!checkIn && !checkOut) return "";
    if (checkIn && !checkOut) return `Nhận: ${checkIn}`;
    if (!checkIn && checkOut) return `Trả: ${checkOut}`;
    return `${checkIn} - ${checkOut}`;
  };

  const applyPresetDays = (days: number) => {
    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days - 1);
    const end = endDate.toISOString().slice(0, 10);
    setCheckIn(start);
    setCheckOut(end);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Thêm các ngày trống ở đầu tháng
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Thêm các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDateToYYYYMMDD = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    
    if (!checkIn || (checkIn && checkOut)) {
      // Nếu chưa chọn ngày nào hoặc đã chọn cả 2 ngày, bắt đầu lại
      setCheckIn(dateStr);
      setCheckOut("");
    } else if (checkIn && !checkOut) {
      // Đã chọn ngày bắt đầu, chọn ngày kết thúc
      if (new Date(dateStr) < new Date(checkIn)) {
        // Nếu chọn ngày trước ngày bắt đầu, đổi lại
        setCheckOut(checkIn);
        setCheckIn(dateStr);
      } else {
        setCheckOut(dateStr);
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    const dateStr = formatDateToYYYYMMDD(date);
    return dateStr >= checkIn && dateStr <= checkOut;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    return dateStr === checkIn || dateStr === checkOut;
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return formatDateToYYYYMMDD(date) === formatDateToYYYYMMDD(today);
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (city) params.set("city", city);
    if (roomType) params.set("type", roomType);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    navigate(`/products?${params.toString()}`);
  };

  return (
  <div className="relative w-full -mt-16 flex items-start justify-center pt-0 pb-10 md:pb-14 min-h-screen min-h-[100svh] overflow-hidden">
    {/* Hero background with video */}
    <div className="absolute inset-0 z-0">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={backgroundHeroSection}
        aria-hidden="true"
        disablePictureInPicture
      >
        <source src={introLandingVideo} type="video/mp4" />
      </video>

      {/* Gradient overlay to keep content readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(77,166,255,0.45) 0%, rgba(77,166,255,0.35) 50%, rgba(59,130,246,0.45) 100%)",
        }}
      />
    </div>

    {/* Extra overlay for better text readability */}
    <div className="absolute inset-0 z-10 bg-linear-to-b from-black/20 via-transparent to-black/10" />
    
    {/* Content */}
    <div className="relative z-20 w-full max-w-5xl mx-auto px-4 pt-[calc(4rem+2rem)] md:pt-[calc(4rem+3rem)] text-white">
      <motion.h1 
        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-3 drop-shadow-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
       Elingo
      </motion.h1>
      <motion.p 
        className="text-lg md:text-xl mb-1 md:mb-1.5 font-medium drop-shadow-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Nền tảng kết nối giáo viên mở lớp học trực tiếp
      </motion.p>
      <motion.p 
        className="text-base md:text-lg opacity-95 drop-shadow-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Quản lý và học tập dễ dàng, phù hợp mọi nhu cầu
      </motion.p>

      {/* Search bar: từ khóa + địa điểm + ngày nhận/trả (1 khung) + loại phòng + nút tìm */}
      <motion.div
        className="mt-1.5 md:mt-2 w-full max-w-5xl mx-auto relative z-[100]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex flex-col lg:flex-row items-stretch bg-white/95 rounded-3xl shadow-2xl border border-[#4da6ff] px-3 py-2 md:px-4 md:py-3 gap-2 md:gap-3 text-gray-900">
          {/* Ô tìm kiếm chính */}
          <div className="flex-1 flex items-center gap-2 px-1">
            <FiSearch className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm giáo viên, lớp học trực tiếp..."
              className="w-full bg-transparent outline-none text-sm md:text-base placeholder:text-gray-400"
            />
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200" />

          {/* Khu vực / Địa điểm */}
          <div
            ref={cityRef}
            className="relative flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-gray-200 flex-1 lg:flex-none lg:w-52 cursor-pointer hover:border-[#4da6ff] transition-colors"
            onClick={() => setIsCityOpen((prev) => !prev)}
          >
            <FiMapPin className="text-yellow-500 w-4 h-4 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Khu vực học
              </span>
              <span className="text-xs md:text-sm text-gray-800">
                {city}
              </span>
            </div>

            {/* Custom Dropdown */}
            {isCityOpen && (
              <div 
                ref={cityDropdownRef}
                className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#4da6ff] py-2 z-[999999] w-full min-w-[200px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCity(c);
                      setIsCityOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                      city === c ? 'bg-blue-50 text-[#4da6ff] font-semibold' : 'text-gray-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thời gian học - trong 1 khung */}
          <div
            ref={dateRef}
            className="relative flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-gray-200 flex-1 lg:flex-none lg:w-52 cursor-pointer hover:border-[#4da6ff] transition-colors"
            onClick={() => setIsDateOpen((prev) => !prev)}
          >
            <FiCalendar className="text-yellow-500 w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Thời gian học
              </span>
              <span className="text-xs md:text-sm text-gray-800">
                {formatDateRangeLabel()}
              </span>
            </div>

            {/* Calendar render trực tiếp trong DOM tree với absolute positioning */}
            {isDateOpen && (
              <div 
                ref={calendarRef}
                className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-[#4da6ff] p-2.5 text-gray-900 z-[999999]"
                style={{
                  width: '280px',
                  pointerEvents: 'auto',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPreviousMonth();
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-xs font-semibold text-gray-800">
                    {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextMonth();
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} className="text-center text-[10px] font-semibold text-gray-500 py-0.5">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 mb-2">
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const dateStr = formatDateToYYYYMMDD(date);
                    const inRange = isDateInRange(date);
                    const selected = isDateSelected(date);
                    const today = isDateToday(date);
                    const past = isDatePast(date);
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!past) {
                            handleDateClick(date);
                          }
                        }}
                        disabled={past}
                        className={`
                          aspect-square text-[10px] font-medium rounded-md transition-all flex items-center justify-center
                          ${past ? 'text-gray-300 cursor-not-allowed opacity-50' : 'hover:bg-blue-50 cursor-pointer text-gray-700'}
                          ${today && !selected ? 'border border-[#4da6ff] font-semibold' : ''}
                          ${inRange && !selected ? 'bg-blue-100' : ''}
                          ${selected ? 'bg-[#4da6ff] text-white font-bold' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Dates Display */}
                {(checkIn || checkOut) && (
                  <div className="mb-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-[10px] text-gray-700 space-y-0.5">
                      {checkIn && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Bắt đầu học từ:</span>
                          <span>{new Date(checkIn).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                      )}
                      {checkOut && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Học đến hết:</span>
                          <span>{new Date(checkOut).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[1, 2, 3, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPresetDays(d);
                      }}
                      className="flex items-center gap-0.5 px-2 py-1 rounded-full border border-gray-300 text-[10px] hover:border-[#4da6ff] hover:text-[#4da6ff] hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-xs leading-none">+</span>
                      {d} ngày
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCheckIn("");
                      setCheckOut("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDateOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loại lớp học */}
          <div
            ref={roomTypeRef}
            className="relative flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-gray-200 flex-1 lg:flex-none lg:w-52 cursor-pointer hover:border-[#4da6ff] transition-colors"
            onClick={() => setIsRoomTypeOpen((prev) => !prev)}
          >
            <FaChalkboardTeacher className="text-yellow-500 w-4 h-4 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Loại lớp học
              </span>
              <span className="text-xs md:text-sm text-gray-800">
                {roomType}
              </span>
            </div>

            {/* Custom Dropdown */}
            {isRoomTypeOpen && (
              <div 
                ref={roomTypeDropdownRef}
                data-room-type-dropdown
                className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#4da6ff] py-2 z-[999999] w-full min-w-[200px] max-h-[300px] overflow-y-auto"
                style={{
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE and Edge */
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomType(t);
                      setIsRoomTypeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                      roomType === t ? 'bg-blue-50 text-[#4da6ff] font-semibold' : 'text-gray-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nút tìm kiếm */}
          <button
            type="button"
            onClick={handleSearch}
            className="w-full md:w-auto md:min-w-[130px] h-11 md:h-12 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm md:text-base flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          >
            Tìm lớp học
          </button>
        </div>
      </motion.div>

      {/* Quick categories chips */}
      <motion.div
        className="mt-1.5 md:mt-2 flex flex-wrap justify-center gap-2 md:gap-3 text-xs md:text-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        {[
          "Lớp học 1-1",
          "Lớp học nhóm",
          "Lớp kỹ năng / workshop",
          "Lớp ngoại ngữ",
          "Lớp luyện thi",
          "Lớp trực tuyến",
        ].map((label) => (
          <button
            key={label}
            type="button"
            className="px-3 md:px-4 py-1.5 rounded-full border border-white/60 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-[#2563eb] hover:border-white shadow-sm transition-all"
          >
            {label}
          </button>
        ))}
      </motion.div>
    </div>
  </div>
  );
}

export default HeroSection;
