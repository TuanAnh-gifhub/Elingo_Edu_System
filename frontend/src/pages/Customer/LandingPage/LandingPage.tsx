import { Link } from "react-router-dom";
import { FaCheck, FaChevronRight, FaChalkboardTeacher, FaLaptop, FaUsers, FaMicrophone, FaBook, FaFlask, FaBuilding } from "react-icons/fa";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ParallaxBackground from "./ParallaxBackground";
import HeroSection from "../../../components/HeroSection/HeroSection";
import ScrambleText from "../../../components/Header/ScrambleText";
import RoomCard from "./RoomCard";
import Footer from "../../../components/Footer/Footer";
import AboutUs from "../AboutUs/AboutUs";
import {
  classRoomService,
  type ClassRoomDto,
} from "../../../services/classes/classRoomService";
import {
  teacherService,
  type TeacherProfileDto,
} from "../../../services/teachers/teacherService";

const useScrollspy = () => ({ setActiveSection: (_section: string) => { void _section; } });

const SIDEBAR_CATEGORIES = [
  { key: 'all', label: 'Tất cả', icon: FaChalkboardTeacher, type: 'Tất cả lớp học' },
  { key: 'classroom', label: 'Lớp học 1-1', icon: FaChalkboardTeacher, type: 'Lớp học 1-1' },
  { key: 'lab', label: 'Lớp học nhóm', icon: FaLaptop, type: 'Lớp học nhóm' },
  { key: 'group', label: 'Lớp kỹ năng / workshop', icon: FaUsers, type: 'Lớp kỹ năng / workshop' },
  { key: 'presentation', label: 'Lớp ngoại ngữ', icon: FaMicrophone, type: 'Lớp ngoại ngữ' },
  { key: 'library', label: 'Lớp luyện thi', icon: FaBook, type: 'Lớp luyện thi' },
  { key: 'experiment', label: 'Lớp trực tuyến', icon: FaFlask, type: 'Lớp trực tuyến' },
  { key: 'meeting', label: 'Khóa học doanh nghiệp', icon: FaBuilding, type: 'Khóa học doanh nghiệp' },
];

interface Room {
  id: number | string;
  listingId?: number | string;
  image?: string | null;
  title: string;
  description?: string;
  price: number;
  location: string;
  capacity?: string;
  timeAgo?: string;
  products?: Array<{ name: string; price: number }>;
  name: string;
  logo?: string | null;
  banner?: string | null;
  category?: string;
  rating?: number;
  reviewCount?: number;
  currentListings?: number;
  soldItems?: number;
  feature?: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  };
}

const LandingPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [featuredStores, setFeaturedStores] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const navigate = useNavigate();
  const { setActiveSection } = useScrollspy();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('landing_dark_mode');
    return stored === 'true';
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Temporarily disabled
  const showSidebarComponent = false; // Temporarily disabled sidebar

  useEffect(() => {
    const handleDarkModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(customEvent.detail.isDarkMode);
    };

    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowSidebar(false);

      if (footerRef.current && showSidebar) {
        const footerRect = footerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const footerTop = footerRect.top;

        // If footer is visible, limit sidebar bottom
        if (footerTop < windowHeight) {
          const distanceFromBottom = windowHeight - footerTop;
          setSidebarBottom(Math.max(0, distanceFromBottom));
        } else {
          setSidebarBottom(null);
        }
      } else {
        setSidebarBottom(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showSidebar]);

  // Listen for toggle sidebar event from header
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarExpanded(prev => !prev);
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
  }, []);

  const [decodeLatestListings, setDecodeLatestListings] = useState(false);
  const [decodeOfficialStores, setDecodeOfficialStores] = useState(false);
  const latestListingsRef = useRef<HTMLDivElement>(null);
  const officialStoresRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [sidebarBottom, setSidebarBottom] = useState<number | null>(null);

  const [latestListingsStart, setLatestListingsStart] = useState(0);
  const [officialStoresStart, setOfficialStoresStart] = useState(0);
  const [visibleStoreCount, setVisibleStoreCount] = useState(6);
  const [showAllStores, setShowAllStores] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const page = await classRoomService.getClasses(1, 8);
        const data = (page.data || []) as ClassRoomDto[];

        const mappedRooms: Room[] = data.map((c) => ({
          id: c.classId,
          title: c.className,
          description: c.description,
          price: Number(c.price || 0),
          location: c.schedule || "Lớp học trực tuyến",
          capacity: `${c.currentStudents ?? 0}-${c.maxStudents ?? 0} học viên`,
          name: c.className,
          image: c.poster || null,
          products: [],
        }));

        setRooms(mappedRooms);
        setFeaturedStores(mappedRooms);
        setTotalItems(data.length);
      } catch (error) {
        console.error(" LandingPage - Error fetching classes:", error);
        setError("Không thể tải danh sách lớp học");
        setRooms([]);
        setFeaturedStores([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "latest-listings") {
            setDecodeLatestListings(entry.isIntersecting);
          }
          if (entry.target.id === "official-stores") {
            setDecodeOfficialStores(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.3 }
    );
    const latestEl = latestListingsRef.current;
    const officialEl = officialStoresRef.current;

    if (latestEl) observer.observe(latestEl);
    if (officialEl) observer.observe(officialEl);
    return () => {
      if (latestEl) observer.unobserve(latestEl);
      if (officialEl) observer.unobserve(officialEl);
    };
  }, []);

  const filteredStores = selectedCategory === "all"
    ? featuredStores
    : featuredStores.filter(store => store.category === selectedCategory);

  useEffect(() => {
    const headerOffset = 140;
    let ticking = false;

    const heroEl = document.querySelector('.HeroSection-root, #hero-section');
    const latestListingsEl = document.getElementById('latest-listings');
    const officialStoresEl = document.getElementById('official-stores');
    const featuredStoresEl = document.getElementById('featured-stores');

    const inView = (rect: DOMRect | null): boolean => rect !== null && rect.top <= headerOffset && rect.bottom > headerOffset;

    const updateActive = () => {
      const heroRect = heroEl ? heroEl.getBoundingClientRect() : null;
      const latestListingsRect = latestListingsEl ? latestListingsEl.getBoundingClientRect() : null;
      const officialStoresRect = officialStoresEl ? officialStoresEl.getBoundingClientRect() : null;
      const featuredStoresRect = featuredStoresEl ? featuredStoresEl.getBoundingClientRect() : null;

      if (inView(heroRect)) {
        setActiveSection('hero');
      } else if (inView(latestListingsRect)) {
        setActiveSection('latest-listings');
      } else if (inView(officialStoresRect)) {
        setActiveSection('official-stores');
      } else if (inView(featuredStoresRect)) {
        setActiveSection('featured-stores');
      } else {
        setActiveSection('latest-listings');
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateActive();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [setActiveSection]);

  const handleCategoryClick = (type: string) => {
    setSelectedCategory(type);
    const params = new URLSearchParams();
    params.set('type', type);
    navigate(`/products?${params.toString()}`);
  };

  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfileDto[]>([]);

  useEffect(() => {
    const fetchTeacherProfiles = async () => {
      try {
        const teachers = await teacherService.getTopTeachers(8);
        setTeacherProfiles(teachers);
      } catch (error) {
        console.error("❌ LandingPage - Error fetching top teachers:", error);
        setTeacherProfiles([]);
      }
    };

    fetchTeacherProfiles();
  }, []);

  return (
    <div className="relative min-h-screen w-full" style={{ background: isDarkMode ? '#1a1a2e' : '#f5f7fa' }}>
      <ParallaxBackground isDarkMode={isDarkMode} />

      {/* Hero section with title, search bar & quick categories */}
      <HeroSection />

      {/* Collapsible Sidebar - Temporarily disabled */}
      {showSidebarComponent && (
        <div
          className={`fixed left-0 z-40 transition-all duration-300 ${showSidebar ? (sidebarExpanded ? 'w-52' : 'w-14') : 'w-0'
            } ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm shadow-xl overflow-hidden`}
          style={{
            paddingTop: '80px',
            top: 0,
            bottom: sidebarBottom !== null ? `${sidebarBottom}px` : 0,
            height: sidebarBottom !== null ? `calc(100% - ${sidebarBottom}px)` : '100%'
          }}
        >
          {/* Sidebar Content */}
          <div
            className="h-full py-2 overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className={`${sidebarExpanded ? 'px-2' : 'px-1.5'} space-y-1`}>
              <div className="flex items-center mb-2 px-1.5">
                <button
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className={`w-7 h-7 rounded-lg ${isDarkMode ? 'bg-[#4da6ff]/15 hover:bg-[#4da6ff]/25 border border-[#4da6ff]/30' : 'bg-[#4da6ff]/15 hover:bg-[#4da6ff]/25 border border-[#4da6ff]/30'
                    } text-[#4da6ff] flex items-center justify-center transition-all duration-200 hover:scale-105`}
                  title={sidebarExpanded ? 'Thu nhỏ menu' : 'Mở rộng menu'}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-all duration-300"
                  >
                    <path
                      d={
                        sidebarExpanded
                          ? "M15 6L9 12L15 18"
                          : "M9 6L15 12L9 18"
                      }
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                  </svg>
                </button>
              </div>
              {SIDEBAR_CATEGORIES.map(({ key, label, icon: Icon, type }) => (
                <button
                  key={key}
                  onClick={() => handleCategoryClick(type)}
                  className={`w-full flex items-center rounded-lg transition-all duration-200 ${sidebarExpanded ? 'gap-2 px-2 py-2' : 'justify-center py-2'
                    } ${isDarkMode
                      ? 'hover:bg-[#4da6ff]/20 text-gray-200 hover:text-white'
                      : 'hover:bg-[#4da6ff]/10 text-gray-700 hover:text-[#4da6ff]'
                    } group relative`}
                  title={!sidebarExpanded ? label : undefined}
                >
                  <div className={`flex items-center justify-center ${sidebarExpanded ? 'w-7 h-7' : 'w-7 h-7'
                    } rounded-lg ${isDarkMode ? 'bg-[#4da6ff]/10 group-hover:bg-[#4da6ff]/20' : 'bg-[#4da6ff]/10 group-hover:bg-[#4da6ff]/20'
                    } transition-colors shrink-0`}>
                    <Icon className={`${sidebarExpanded ? 'text-sm' : 'text-base'} text-[#4da6ff]`} />
                  </div>
                  {sidebarExpanded && (
                    <span className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                      {label}
                    </span>
                  )}

                  {!sidebarExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className="relative z-10 bg-transparent text-[#0e0e0e] text-sm leading-[1.4] transition-all duration-300 px-3 sm:px-6"
        style={{
          marginLeft: 0, // Temporarily disabled sidebar margin
        }}
      >
        <div id="latest-listings" ref={latestListingsRef} className="max-w-7xl mx-auto p-8">
          {error && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mb-8 w-full px-4 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded-lg shadow-md overflow-hidden animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className={`h-[500px] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </div>
                <div className="space-y-6">
                  <div className={`h-32 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg animate-pulse`}></div>
                  <div className="grid grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className={`rounded-lg shadow-md overflow-hidden animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`h-64 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 w-full">
              <div className="text-center mb-12">
                <h1 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
                  <ScrambleText text="Lớp học mới nhất" triggerKey={decodeLatestListings} />
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column - Large Card */}
                <div className="space-y-6">

                  {(() => {
                    const room = rooms[latestListingsStart];
                    if (!room) return null;
                    return (
                      <RoomCard
                        key={room.id}
                        id={room.id}
                        listingId={room.listingId}
                        title={room.title}
                        location={room.location}
                        capacity={room.capacity || "Lớp học"}
                        price={room.price}
                        image={room?.image}
                        feature={room.feature}
                        variant="large"
                        showOverlay={true}
                      />
                    );
                  })()}
                </div>

                {/* Right Column - Wide Card on top, 2 Small Cards below */}
                <div className="space-y-6">
                  {/* Wide card on top */}
                  {(() => {
                    const room = rooms[latestListingsStart + 1];
                    if (!room) return null;
                    return (
                      <RoomCard
                        key={room.id}
                        id={room.id}
                        listingId={room.listingId}
                        title={room.title}
                        location={room.location}
                        capacity={room.capacity || "Lớp học"}
                        price={room.price}
                        image={room?.image}
                        feature={room.feature}
                        variant="wide"
                      />
                    );
                  })()}

                  {/* 2 small cards below in grid */}
                  <div className="grid grid-cols-2 gap-5">
                    {[2, 3].map((offset) => {
                      const room = rooms[latestListingsStart + offset];
                      if (!room) return null;
                      return (
                        <RoomCard
                          key={room.id}
                          id={room.id}
                          listingId={room.listingId}
                          title={room.title}
                          location={room.location}
                          capacity={room.capacity || "Lớp học"}
                          price={room.price}
                          image={room?.image}
                          feature={room.feature}
                          variant="compact"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-8">
                <button
                  className={`rounded-lg shadow px-6 py-2 border hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100 transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-gray-700 disabled:hover:text-gray-400' : 'bg-white border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-white disabled:hover:text-gray-400'}`}
                  onClick={() => setLatestListingsStart(s => Math.max(0, s - 1))}
                  disabled={latestListingsStart === 0 || rooms.length === 0}
                  aria-label="Xem phòng trước"
                >
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Trước</span>
                  </div>
                </button>

                <Link
                  to="/classes"
                  className={`border px-6 py-2 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 font-medium ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]' : 'border-gray-300 bg-white text-gray-700 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]'}`}
                >
                  Xem thêm {totalItems.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} phòng học
                </Link>

                <button
                  className={`rounded-lg shadow px-6 py-2 border hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100 transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-gray-700 disabled:hover:text-gray-400' : 'bg-white border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-white disabled:hover:text-gray-400'}`}
                  onClick={() => setLatestListingsStart(s => Math.min(Math.max(0, rooms.length - 4), s + 1))}
                  disabled={latestListingsStart >= Math.max(0, rooms.length - 4)}
                  aria-label="Xem phòng tiếp"
                >
                  <div className="flex items-center gap-2">
                    <span>Sau</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div id="official-stores" ref={officialStoresRef} className="max-w-7xl mx-auto p-8">
          <div className="text-center mb-12">
            <h1 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
              <ScrambleText text="Đặt Lớp Học Trực Tuyến" triggerKey={decodeOfficialStores} />
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center text-blue-600">
              <FaCheck className="w-4 h-4 mr-2" />
              <span className="text-sm">Hoàn hủy khóa học linh hoạt</span>
            </div>
            <div className="flex items-center text-blue-600">
              <FaCheck className="w-4 h-4 mr-2" />
              <span className="text-sm">Giáo viên uy tín, lớp học chất lượng cao</span>
            </div>
            <div className="flex items-center text-blue-600">
              <FaCheck className="w-4 h-4 mr-2" />
              <span className="text-sm">Hỗ trợ học trực tuyến và trực tiếp linh hoạt</span>
            </div>
          </div>

          {/* Room Cards Section - Similar to Latest Listings */}
          {loading ? (
            <div className="mb-8 w-full px-4 lg:px-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`rounded-lg shadow-md overflow-hidden animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`h-48 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className="p-4 space-y-3">
                      <div className={`h-4 rounded w-3/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                      <div className={`h-4 rounded w-1/2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                      <div className={`h-6 rounded w-1/3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : rooms.length > 0 ? (
            <div className="mb-8 w-full relative flex items-center">
              <button
                className={`hidden lg:block absolute left-0 z-10 rounded-full shadow p-2 -ml-6 border hover:scale-110 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100 transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-gray-700 disabled:hover:text-gray-400' : 'bg-white border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-white disabled:hover:text-gray-400'}`}
                onClick={() => setOfficialStoresStart(s => Math.max(0, s - 1))}
                disabled={officialStoresStart === 0 || rooms.length === 0}
                aria-label="Xem phòng trước"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full px-0">
                {rooms.slice(officialStoresStart, officialStoresStart + 4).map((room) => (
                  <RoomCard
                    key={room.id}
                    id={room.id}
                    listingId={room.listingId}
                    title={room.title}
                    location={room.location}
                    capacity="8-12 people"
                    price={Math.round(room.price / 23000)}
                    image={room.image}
                    feature={{ icon: FaUsers, label: "Equipped" }}
                  />
                ))}
              </div>

              <button
                className={`hidden lg:block absolute right-0 z-10 rounded-full shadow p-2 -mr-6 border hover:scale-110 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100 transition-all duration-300 ${isDarkMode ? 'bg-gray-700 border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-gray-700 disabled:hover:text-gray-400' : 'bg-white border-[#4da6ff] hover:bg-[#4da6ff] hover:text-white disabled:hover:bg-white disabled:hover:text-gray-400'}`}
                onClick={() => setOfficialStoresStart(s => Math.min(rooms.length - 4, s + 1))}
                disabled={officialStoresStart >= rooms.length - 4}
                aria-label="Xem phòng tiếp"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : null}

          <div className="flex justify-center mt-4 mb-8">
            <Link
              to="/classes"
              className={`border px-6 py-2 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 font-medium ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]' : 'border-gray-300 bg-white text-gray-700 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]'}`}
            >
              Xem thêm {totalItems.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} phòng học
            </Link>
          </div>

          {/* Removed "Đang hiển thị X / Y địa điểm" text for cleaner UI */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {filteredStores.slice(0, showAllStores ? filteredStores.length : 6).map((store, idx) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 border border-gray-100 ${isDarkMode ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`}
              >
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-10 h-10 rounded-full object-cover mr-3 bg-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-base">
                            {store.name ? store.name.charAt(0).toUpperCase() : 'S'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{store.name}</h3>
                        <div className="flex items-center text-blue-600">
                          <FaCheck className="w-3 h-3 mr-1" />
                          <span className="text-xs">Đã xác thực</span>
                        </div>
                      </div>
                    </div>
                    <FaChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>

                <div className="relative bg-gray-200">
                  {store.banner ? (
                    <img
                      src={store.banner}
                      alt={store.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        const noBannerDiv = parent?.querySelector('.no-banner-placeholder') as HTMLElement;
                        if (noBannerDiv) {
                          noBannerDiv.style.display = 'flex';
                        }
                      }}
                      loading="lazy"
                    />
                  ) : null}

                  <div
                    className={`w-full h-32 bg-linear-to-r from-gray-200 to-gray-300 flex items-center justify-center ${store.banner ? 'hidden' : 'flex'
                      } no-banner-placeholder`}
                  >
                    <span className="text-gray-500 text-sm font-medium">No Banner</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {(store.products || []).slice(0, 3).map((product, productIdx) => (
                      <div key={productIdx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{product.name}</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VNĐ
                        </span>
                      </div>
                    ))}
                    {(store.products || []).length === 0 && (
                      <div className={`text-center text-sm py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Chưa có phòng học
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredStores.length > visibleStoreCount && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAllStores(!showAllStores)}
                className={`border px-6 py-2 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 font-medium ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]' : 'border-gray-300 bg-white text-gray-700 hover:bg-[#4da6ff] hover:text-white hover:border-[#4da6ff]'}`}
              >
                Xem thêm 3 địa điểm
              </button>
            </div>
          )}

          {visibleStoreCount > 6 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisibleStoreCount(6)}
                className="border border-gray-300 bg-white text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-500 hover:text-white hover:border-gray-500 transition-all duration-300 font-medium text-sm"
              >
                Thu gọn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* About Us Section */}
      <AboutUs isDarkMode={isDarkMode} teacherProfiles={teacherProfiles} />

      {/* Footer - Outside of content div to avoid sidebar margin */}
      <Footer ref={footerRef} isDarkMode={isDarkMode} />
    </div>
  );
};

export default LandingPage;
