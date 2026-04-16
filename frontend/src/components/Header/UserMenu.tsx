import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiHeart,
  FiLogOut,
  FiChevronDown,
  FiCreditCard,
  FiFileText,
  FiStar,
} from "react-icons/fi";


// Style lấy từ Header cũ của bạn để đồng bộ
const PRIMARY_BUTTON_CLASS = "px-1.5 md:px-4 py-1.5 md:py-2 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out border hover:border-[#4da6ff]";
const BUTTON_TEXT_HOVER_CLASS = "text-[11px] md:text-xs whitespace-nowrap inline-block hover:scale-110 transition-transform duration-300 ease-in-out";

interface UserMenuProps {
  isLoggedIn: boolean;
  user?: { name: string; avatar?: string } | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  isHeaderTransparent?: boolean;
}

const UserMenu = ({ isLoggedIn, user, onLoginClick, onLogoutClick, isHeaderTransparent = false }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // TRƯỜNG HỢP 1: CHƯA ĐĂNG NHẬP -> Hiện nút Đăng nhập cũ
  if (!isLoggedIn) {
    return (
      <button
        onClick={onLoginClick}
        className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center justify-center h-10 md:h-11 px-3 md:px-5 py-2 md:py-2.5 ${
          isHeaderTransparent
            ? "bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30"
            : "bg-white hover:bg-gray-100 text-black border-gray-300"
        }`}
        title="Đăng nhập"
      >
        <span className={`${BUTTON_TEXT_HOVER_CLASS} leading-none`}>Đăng nhập</span>
      </button>
    );
  }

  // TRƯỜNG HỢP 2: ĐÃ ĐĂNG NHẬP -> Hiện Avatar + Dropdown
  const displayName = user?.name || "Member";
  const displayAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all shadow-sm ${
          isHeaderTransparent
            ? "border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30"
            : "border-gray-200 bg-white hover:border-[#4da6ff] hover:bg-blue-50"
        }`}
      >
        <img
          src={displayAvatar}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover border border-gray-200"
        />
        <span
          className={`text-xs font-semibold max-w-[100px] truncate hidden md:block ${
            isHeaderTransparent ? "text-white" : "text-gray-700"
          }`}
        >
          {displayName}
        </span>
        <FiChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${
            isHeaderTransparent ? "text-white/80" : "text-gray-400"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[9999] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-50 mb-1">
              <p className="text-sm font-bold text-gray-800 truncate">{displayName}</p>
             <p className="text-xs text-gray-500">Thành viên Elingo</p>
            </div>

            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition-colors"
            >
              <FiUser className="w-4 h-4" />
              Thông tin cá nhân
            </Link>

            <Link
              to="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition-colors"
            >
              <FiHeart className="w-4 h-4" />
              Lớp học yêu thích
            </Link>

            <Link
              to="/wallet"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition-colors"
            >
              <FiCreditCard className="w-4 h-4" />
              Ví cá nhân
            </Link>

            <Link
              to="/subscription"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
            >
              <FiStar className="w-4 h-4" />
              <span>Gói Premium</span>
            </Link>

            <div className="h-px bg-gray-100 my-1 mx-4" />

            <button
              onClick={() => {
                setIsOpen(false);
                onLogoutClick();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <FiLogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;