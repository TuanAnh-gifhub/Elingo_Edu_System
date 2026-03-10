import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { FaFacebook, FaInstagram, FaTwitter, FaHome } from "react-icons/fa";

interface FooterProps {
  isDarkMode?: boolean;
}

const Footer = forwardRef<HTMLElement, FooterProps>(({ isDarkMode }, ref) => {
  return (
    <footer
      ref={ref}
      className={`w-full relative z-20 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 lg:gap-8 mb-8">
         {/* Column 1: Elingo Branding and Social Media */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#4da6ff] rounded-lg flex items-center justify-center">
                <FaHome className="text-white text-xl" />
              </div>
             <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Elingo</h3>
            </div>
            <p
              className={`text-sm leading-relaxed ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Elingo là nền tảng kết nối giáo viên mở lớp học trực tiếp, quản lý và học tập dễ dàng.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                className="w-10 h-10 bg-blue-50 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#4da6ff] hover:bg-blue-100 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook className="text-gray-700 text-lg" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-blue-50 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#4da6ff] hover:bg-blue-100 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="text-gray-700 text-lg" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-blue-50 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-[#4da6ff] hover:bg-blue-100 transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="text-gray-700 text-lg" />
              </a>
            </div>
          </div>

          {/* Column 2: Liên Kết Nhanh */}
          <div className="space-y-4">
            <h4
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Liên Kết Nhanh
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about-us"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#4da6ff] transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Phòng học
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Tin tức
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Điều khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ Trợ */}
          <div className="space-y-4">
            <h4
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Hỗ Trợ
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#4da6ff] transition-colors"
                >
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Liên Hệ */}
          <div className="space-y-4">
            <h4
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Liên Hệ
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-[#4da6ff] text-lg mt-0.5 shrink-0" />
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  123 Đường ABC, Quận 1, TP.HCM
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-[#4da6ff] text-lg shrink-0" />
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  0800 456 789
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-[#4da6ff] text-lg shrink-0" />
                <a
                  href="mailto:info@eduroom.vn"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#4da6ff] transition-colors"
                >
                  info@eduroom.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className={`border-t pt-6 ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
          <p className={`text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
           © 2026 Elingo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
