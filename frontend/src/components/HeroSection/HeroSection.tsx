import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiCalendar } from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import backgroundHeroSection from "../../assets/backgroundHeroSection.jpg";
import introLandingVideo from "../../assets/intro_landing_page.mp4";

const ROOM_TYPES = [
  "Tất cả lớp học",
  "Lớp học 1-1",
  "Lớp học nhóm",
  "Lớp kỹ năng / workshop",
  "Lớp ngoại ngữ",
  "Lớp luyện thi",
  "Lớp trực tuyến",
] as const;

const STUDY_DAY_OPTIONS = [
  "Tất cả thứ học",
  "thứ 2",
  "thứ 3",
  "thứ 4",
  "thứ 5",
  "thứ 6",
  "thứ 7",
  "chủ nhật",
] as const;

const HeroSection = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>(ROOM_TYPES[0]);
  const [studyDay, setStudyDay] = useState<(typeof STUDY_DAY_OPTIONS)[number]>(STUDY_DAY_OPTIONS[0]);
  const [isStudyDayOpen, setIsStudyDayOpen] = useState(false);
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const studyDayRef = useRef<HTMLDivElement | null>(null);
  const studyDayDropdownRef = useRef<HTMLDivElement | null>(null);
  const roomTypeRef = useRef<HTMLDivElement | null>(null);
  const roomTypeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (isStudyDayOpen) {
        const clickedInsideStudyDayButton = studyDayRef.current?.contains(target);
        const clickedInsideStudyDayDropdown = studyDayDropdownRef.current?.contains(target);

        if (!clickedInsideStudyDayButton && !clickedInsideStudyDayDropdown) {
          setIsStudyDayOpen(false);
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

    if (isStudyDayOpen || isRoomTypeOpen) {
      // Dùng click thay vì mousedown để tránh conflict với button clicks
      document.addEventListener("click", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isStudyDayOpen, isRoomTypeOpen]);

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

  const handleSearch = () => {
    const normalizedKeyword = keyword.trim();
    const roomTypeKeyword = roomType === ROOM_TYPES[0] ? "" : roomType;
    const mergedKeyword = [normalizedKeyword, roomTypeKeyword]
      .filter(Boolean)
      .join(" ")
      .trim();

    const params = new URLSearchParams();
    if (mergedKeyword) params.set("keyword", mergedKeyword);
    if (studyDay !== STUDY_DAY_OPTIONS[0]) params.set("studyDay", studyDay);

    const queryString = params.toString();
    navigate(queryString ? `/classes?${queryString}` : "/classes");
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

      {/* Search bar: từ khóa + thứ học + loại lớp + nút tìm */}
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

          {/* Thứ học */}
          <div
            ref={studyDayRef}
            className="relative flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-gray-200 flex-1 lg:flex-none lg:w-52 cursor-pointer hover:border-[#4da6ff] transition-colors"
            onClick={() => setIsStudyDayOpen((prev) => !prev)}
          >
            <FiCalendar className="text-yellow-500 w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Thứ học
              </span>
              <span className="text-xs md:text-sm text-gray-800">
                {studyDay}
              </span>
            </div>

            {isStudyDayOpen && (
              <div
                ref={studyDayDropdownRef}
                className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#4da6ff] py-2 z-[999999] w-full min-w-[200px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {STUDY_DAY_OPTIONS.map((dayOption) => (
                  <button
                    key={dayOption}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudyDay(dayOption);
                      setIsStudyDayOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                      studyDay === dayOption
                        ? "bg-blue-50 text-[#4da6ff] font-semibold"
                        : "text-gray-800"
                    }`}
                  >
                    {dayOption}
                  </button>
                ))}
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
