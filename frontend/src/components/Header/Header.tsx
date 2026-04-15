import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiMoon, FiSun } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// Import components
import LoginPage from "../../pages/Customer/LoginPage/LoginPage";
import ScrambleText from "./ScrambleText";
import UserMenu from "./UserMenu";

// --- QUAN TRỌNG: Import Hook từ AuthContext ---
import { useAuth } from "../../context/AuthContext";

const logo =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%234da6ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' font-weight='bold' fill='white'%3EElingo%3C/text%3E%3C/svg%3E";

const useScrollspy = () => ({ activeSection: "hero" });

// Hàm check auth đơn giản (có thể nâng cấp sau để check isAuthenticated từ context)
const useAuthCheck = () => {
  const { isAuthenticated } = useAuth();
  const requireAuth = (cb: () => void) => {
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

const HEADER_CONFIG = { MIN_HEIGHT: 64 } as const;

const ICON_BUTTON_CLASS =
  "relative w-9 h-9 md:w-10 md:h-10 grid place-items-center rounded-full border border-transparent hover:border-[#4da6ff] shadow-sm hover:shadow-md hover:scale-105 transition-transform duration-300 ease-in-out origin-center will-change-transform";
const PRIMARY_BUTTON_CLASS =
  "px-1.5 md:px-4 py-1.5 md:py-2 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out border hover:border-[#4da6ff]";
const BUTTON_TEXT_HOVER_CLASS =
  "text-[11px] md:text-xs whitespace-nowrap inline-block hover:scale-110 transition-transform duration-300 ease-in-out";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/classes", label: "Lớp học" },
  { to: "/community", label: "Cộng đồng" },
];

const NAV_PILL_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.9,
} as const;

const Header = () => {
  // --- 1. LẤY DATA TỪ CONTEXT ---
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const { activeSection } = useScrollspy();
  const { requireAuth } = useAuthCheck();
  const { unreadCount } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHeaderTransparent, setIsHeaderTransparent] =
    useState<boolean>(false);
  const [isNavPointerDown, setIsNavPointerDown] = useState(false);
  const [hoveredNavPath, setHoveredNavPath] = useState<string | null>(null);

  // --- 2. CÁC STATE UI (Giao diện) ---
  const [headerHeight, setHeaderHeight] = useState<number>(
    HEADER_CONFIG.MIN_HEIGHT,
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("landing_dark_mode") === "true";
  });

  const headerRef = useRef<HTMLElement>(null);
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

  // Make header transparent when user is at the very top (hero/video area on landing page)
  useEffect(() => {
    const isHome = location.pathname === "/";

    // Compute desired transparency state
    const shouldBeTransparent = isHome && window.scrollY < 40;

    // Update state in next tick to avoid cascading renders
    const timeoutId = setTimeout(() => {
      setIsHeaderTransparent(shouldBeTransparent);
    }, 0);

    // Only add scroll listener if on home page
    if (!isHome) {
      return () => clearTimeout(timeoutId);
    }

    const onScroll = () => {
      // Threshold to avoid flicker while still near the top
      setIsHeaderTransparent(window.scrollY < 40);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerRelease = () => setIsNavPointerDown(false);

    window.addEventListener("mouseup", handlePointerRelease);
    window.addEventListener("blur", handlePointerRelease);

    return () => {
      window.removeEventListener("mouseup", handlePointerRelease);
      window.removeEventListener("blur", handlePointerRelease);
    };
  }, []);

  const isNavItemActive = (path: string) => {
    if (path === "/") {
      return (
        location.pathname === "/" ||
        location.pathname === "/home" ||
        location.pathname === "/landing"
      );
    }

    return location.pathname.startsWith(path);
  };

  const handleNavPointerEnter = (path: string) => {
    if (!isNavPointerDown || isNavItemActive(path)) {
      return;
    }

    navigate(path, { viewTransition: true });
  };

  const highlightedNavPath =
    hoveredNavPath ?? NAV_LINKS.find((item) => isNavItemActive(item.to))?.to;

  // Chuẩn bị dữ liệu hiển thị cho UserMenu
  // UserResponse currently exposes userName (no fullName)
  const displayUser = user
    ? {
        name: user.userName || "User",
        // avatar: user.avatar // Nếu sau này có avatar thì thêm vào
      }
    : null;

  return (
    <>
      <header
        ref={headerRef}
        className={`w-full fixed top-0 left-0 right-0 z-50 text-[#0e0e0e] text-base leading-[1.4] transition-colors duration-300 ${
          isHeaderTransparent
            ? "border-b-0 shadow-none bg-transparent"
            : "border-b-2 border-[#4da6ff] shadow-sm bg-[rgba(228,228,228,0.82)] backdrop-blur-[2px]"
        }`}
        style={{ minHeight: `${HEADER_CONFIG.MIN_HEIGHT}px` }}
      >
        <div
          className={`w-full max-w-screen-2xl mx-auto px-2 md:px-4 flex flex-col items-center justify-center h-auto ${headerHeightClass}`}
        >
          <div className="relative flex items-center justify-between w-full gap-2 md:gap-4">
            {/* LOGO */}
            <div className="flex items-center shrink-0 gap-1 md:gap-3">
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
                  alt="Elingo Logo"
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
                        text="Elingo"
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
                    Elingo
                  </span>
                )}
              </Link>
            </div>

            <nav
              className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10"
              onMouseDown={() => setIsNavPointerDown(true)}
              onMouseLeave={() => {
                setIsNavPointerDown(false);
                setHoveredNavPath(null);
              }}
            >
              <div
                className={`inline-flex items-center rounded-full border px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md ${
                  isHeaderTransparent
                    ? "border-white/25 bg-white/10"
                    : "border-slate-200/80 bg-white/80"
                }`}
              >
                {NAV_LINKS.map((item) => {
                  const isHighlighted = highlightedNavPath === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      viewTransition
                      onMouseEnter={() => {
                        setHoveredNavPath(item.to);
                        handleNavPointerEnter(item.to);
                      }}
                      className="relative isolate rounded-full px-5 py-2.5 text-sm font-semibold !text-[#2563eb] hover:!text-[#2563eb] visited:!text-[#2563eb] focus:!text-[#2563eb] transition-colors duration-200 select-none"
                    >
                      {isHighlighted ? (
                        <motion.span
                          layoutId="header-nav-pill"
                          transition={NAV_PILL_TRANSITION}
                          className="absolute inset-0 z-0 rounded-full border border-[#0c69db]/40 bg-[#60a5fa] shadow-[0_12px_26px_rgba(16,94,205,0.34)]"
                        />
                      ) : null}
                      <motion.span
                        transition={{ duration: 0.18 }}
                        className="relative z-20 !text-[#2563eb]"
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              {(() => {
                const iconBgClass = isHeaderTransparent
                  ? "bg-transparent hover:bg-white/10"
                  : "";
                const chatBgClass = isHeaderTransparent
                  ? iconBgClass
                  : "bg-blue-50 hover:bg-blue-100";

                return (
                  <>
                    {/* Dark Mode */}
                    <button
                      onClick={() => {
                        setIsDarkMode((prev) => {
                          const newValue = !prev;
                          localStorage.setItem(
                            "landing_dark_mode",
                            String(newValue),
                          );
                          window.dispatchEvent(
                            new CustomEvent("darkModeChanged", {
                              detail: { isDarkMode: newValue },
                            }),
                          );
                          return newValue;
                        });
                      }}
                      className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none ${
                        isHeaderTransparent
                          ? "bg-white/10 hover:bg-white/15"
                          : isDarkMode
                            ? "bg-slate-700"
                            : "bg-gray-300"
                      }`}
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


                    {/* Chat */}
                    <button
                      onClick={() => {
                        requireAuth(() => {
                          navigate("/chat");
                        });
                      }}
                      className={`${ICON_BUTTON_CLASS} ${chatBgClass}`}
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
                      className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center justify-center h-10 md:h-11 px-3 md:px-5 py-2 md:py-2.5 bg-[#4da6ff]/70 hover:bg-[#4da6ff]/90 text-white border-[#4da6ff]/50 hover:border-[#4da6ff]`}
                      title="Đăng tin"
                    >
                      <span
                        className={`${BUTTON_TEXT_HOVER_CLASS} leading-none`}
                      >
                        Đăng phòng
                      </span>
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
                        isHeaderTransparent={isHeaderTransparent}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      <div style={{ height: headerHeight }} />

      {/* Modal Login + Register (slide trong 1 popup) */}
      <LoginPage
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default Header;
