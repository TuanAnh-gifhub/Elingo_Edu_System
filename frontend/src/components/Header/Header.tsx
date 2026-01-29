import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiMoon, FiSun } from "react-icons/fi";
import { FaHeart, FaWallet } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// Import components
import LoginPage from "../../pages/Customer/LoginPage/LoginPage";
import RegisterPage from "../../pages/Customer/LoginPage/RegisterPage";
import ScrambleText from "./ScrambleText";
import AnimatedNavText from "./AnimatedNavText";
import UserMenu from "./UserMenu";

// --- QUAN TRỌNG: Import Hook từ AuthContext ---
import { useAuth } from "../../context/AuthContext";

const logo =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%234da6ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' font-weight='bold' fill='white'%3EEduRoom%3C/text%3E%3C/svg%3E";

const useScrollspy = () => ({ activeSection: "hero" });

// Hàm check auth đơn giản (có thể nâng cấp sau để check isAuthenticated từ context)
const useAuthCheck = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (cb: any) => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập thì mở modal hoặc báo lỗi (tùy logic bạn muốn xử lý)
      // Ở đây tạm thời vẫn cho chạy callback hoặc bạn có thể kích hoạt modal login
      // Ví dụ: alert("Vui lòng đăng nhập");
      cb();
    } else {
      cb();
    }
  };
  return { requireAuth };
};

const useUnreadMessages = () => ({ unreadMessages: [], unreadCount: 0 });

interface ActiveNavigationStates {
  isActiveAllProducts: boolean;
  isActivePromotion: boolean;
  isActiveAboutUs: boolean;
}

const HEADER_CONFIG = { MIN_HEIGHT: 64 } as const;

const ICON_BUTTON_CLASS =
  "relative w-9 h-9 md:w-10 md:h-10 grid place-items-center rounded-full border border-transparent hover:border-[#4da6ff] shadow-sm hover:shadow-md hover:scale-105 transition-transform duration-300 ease-in-out origin-center will-change-transform";
const PRIMARY_BUTTON_CLASS =
  "px-1.5 md:px-4 py-1.5 md:py-2 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out border hover:border-[#4da6ff]";
const NAV_LINK_CLASS =
  "px-2 py-2 text-xs font-semibold rounded hover:bg-[#4da6ff]/10 transition-colors duration-150";
const BUTTON_TEXT_HOVER_CLASS =
  "text-[11px] md:text-xs whitespace-nowrap inline-block hover:scale-110 transition-transform duration-300 ease-in-out";

const getActiveNavigationStates = (
  location: any,
  activeSection: string,
): ActiveNavigationStates => {
  return {
    isActiveAllProducts: location.pathname === "/products",
    isActivePromotion: location.pathname === "/plans",
    isActiveAboutUs: activeSection === "about-us" && location.pathname === "/",
  };
};

const Header = () => {
  // --- 1. LẤY DATA TỪ CONTEXT ---
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const { activeSection } = useScrollspy();
  const { requireAuth } = useAuthCheck();
  const { unreadCount } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();

  // --- 2. CÁC STATE UI (Giao diện) ---
  const [headerHeight, setHeaderHeight] = useState<number>(
    HEADER_CONFIG.MIN_HEIGHT,
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("landing_dark_mode") === "true";
  });

  const headerRef = useRef<HTMLElement>(null);
  const activeStates = getActiveNavigationStates(location, activeSection);
  const headerHeightClass = "md:h-16 py-1";
  const logoSizeClass = "h-9 w-9 md:h-11 md:w-11";
  const titleTextClass = "text-base md:text-2xl";

  // --- 3. XỬ LÝ LOGOUT ---
  const handleLogoutClick = async () => {
    await logout();
    // Không cần reload trang thủ công vì Context sẽ tự cập nhật state -> Re-render Header
    // Nhưng nếu muốn chắc chắn về trang chủ:
    navigate("/");
  };

  // Logic đo chiều cao Header
  useEffect(() => {
    const updateHeaderHeight = () => {
      const h = headerRef.current
        ? headerRef.current.offsetHeight
        : HEADER_CONFIG.MIN_HEIGHT;
      setHeaderHeight(h);
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  // Chuẩn bị dữ liệu hiển thị cho UserMenu
  // Vì UserResponse có fullName, userName nhưng UserMenu có thể cần prop khác
  const displayUser = user ? {
    name: user.fullName || user.userName || "User",
    // avatar: user.avatar // Nếu sau này có avatar thì thêm vào
  } : null;

  return (
    <>
      <header
        ref={headerRef}
        className="w-full fixed top-0 left-0 right-0 z-50 border-b-2 border-[#4da6ff] text-[#0e0e0e] text-base leading-[1.4] shadow-sm bg-[rgba(228,228,228,0.82)] backdrop-blur-[2px]"
        style={{ minHeight: `${HEADER_CONFIG.MIN_HEIGHT}px` }}
      >
        <div
          className={`w-full max-w-screen-2xl mx-auto px-2 md:px-4 flex flex-col items-center justify-center h-auto ${headerHeightClass}`}
        >
          <div className="flex items-center justify-between w-full gap-2 md:gap-4">
            {/* LOGO */}
            <div className="flex items-center flex-shrink-0 gap-1 md:gap-3">
              <Link
                to="/"
                className="flex items-center gap-1 md:gap-2"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (window.location.pathname === "/chat") {
                    e.preventDefault();
                    window.location.href = "/";
                  }
                }}
              >
                <img
                  src={logo}
                  alt="EduRoom Logo"
                  className={`${logoSizeClass} object-contain border-2 border-[#4da6ff] rounded-lg bg-white`}
                />
                {activeSection === "hero" ? (
                  <span
                    className={`relative ${titleTextClass} font-extrabold tracking-tight text-black select-none`}
                    style={{ letterSpacing: 2, marginLeft: "6px" }}
                  >
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute -left-2 -top-1 text-[#4da6ff] font-extrabold"
                      style={{ fontWeight: 900, fontSize: "1.5rem" }}
                    >
                      ⌜
                    </motion.span>
                    <span className="relative z-10 inline-block">
                      <ScrambleText
                        text="EduRoom"
                        triggerKey={activeSection}
                        className="inline-block"
                      />
                    </span>
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute -right-2 -bottom-1 text-[#4da6ff] font-extrabold"
                      style={{ fontWeight: 900, fontSize: "1.5rem" }}
                    >
                      ⌟
                    </motion.span>
                  </span>
                ) : (
                  <span
                    className={`${titleTextClass} font-extrabold tracking-tight text-black select-none`}
                    style={{
                      letterSpacing: 2,
                      marginLeft: "6px",
                      fontWeight: 900,
                    }}
                  >
                    EduRoom
                  </span>
                )}
              </Link>
            </div>

            {/* NAVIGATION */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-x-1 ml-24">
              <Link to="/products" className={NAV_LINK_CLASS}>
                <AnimatedNavText
                  isActive={activeStates.isActiveAllProducts}
                  text="Tất Cả Phòng"
                  triggerKey={location.pathname}
                />
              </Link>

              <button
                type="button"
                onClick={() => {
                  requireAuth(() => {
                    navigate("/plans");
                  });
                }}
                className={NAV_LINK_CLASS}
              >
                <AnimatedNavText
                  isActive={activeStates.isActivePromotion}
                  text="Khuyến Mãi"
                  triggerKey={location.pathname}
                />
              </button>

              <button
                type="button"
                onClick={() => navigate("/about-us")}
                className={`${NAV_LINK_CLASS} bg-transparent border-0 focus:outline-none`}
              >
                <AnimatedNavText
                  isActive={activeStates.isActiveAboutUs}
                  text="Về Chúng Tôi"
                  triggerKey={activeSection}
                />
              </button>
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
              {/* Dark Mode */}
              <button
                onClick={() => {
                  setIsDarkMode((prev) => {
                    const newValue = !prev;
                    localStorage.setItem("landing_dark_mode", String(newValue));
                    window.dispatchEvent(
                      new CustomEvent("darkModeChanged", {
                        detail: { isDarkMode: newValue },
                      }),
                    );
                    return newValue;
                  });
                }}
                className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4da6ff] ${isDarkMode ? "bg-slate-700" : "bg-gray-300"}`}
              >
                <span
                  className={`inline-flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${isDarkMode ? "translate-x-7" : "translate-x-1"}`}
                >
                  {isDarkMode ? (
                    <FiMoon size={14} className="text-slate-700" />
                  ) : (
                    <FiSun size={14} className="text-yellow-500" />
                  )}
                </span>
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className={`${ICON_BUTTON_CLASS} bg-red-50 hover:bg-red-100`}
                title="Yêu thích"
              >
                <FaHeart
                  size={18}
                  className="md:text-[20px] text-[#ff3b6b] m-auto"
                />
              </Link>

              {/* Chat */}
              <button
                onClick={() => {
                  requireAuth(() => {
                    navigate("/chat");
                  });
                }}
                className={`${ICON_BUTTON_CLASS} bg-blue-50 hover:bg-blue-100`}
                title="Chat"
              >
                <FiMessageCircle
                  size={18}
                  className="md:text-[20px] text-[#4da6ff] m-auto"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Đăng phòng */}
              <button
                onClick={() => requireAuth(() => navigate("/post-item"))}
                className={`${PRIMARY_BUTTON_CLASS} bg-black hover:bg-gray-800 text-white border-black`}
                title="Đăng phòng"
              >
                <span className={BUTTON_TEXT_HOVER_CLASS}>Đăng phòng</span>
              </button>

              {/* --- 5. USER MENU MỚI --- */}
              {isLoading ? (
                // Skeleton Loader khi đang check Auth từ Context
                <div className="w-10 h-10 ml-2 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <UserMenu
                  isLoggedIn={isAuthenticated}
                  user={displayUser}
                  onLoginClick={() => setShowLoginModal(true)}
                  onLogoutClick={handleLogoutClick}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ height: headerHeight }} />

      {/* Modals */}
      <LoginPage
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterPage
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
};

export default Header;