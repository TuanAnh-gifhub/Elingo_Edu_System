import { forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiShield,
  FiBookOpen,
} from "react-icons/fi";
import { FaFacebook, FaTiktok } from "react-icons/fa";

interface FooterProps {
  isDarkMode?: boolean;
}

const Footer = forwardRef<HTMLElement, FooterProps>(({ isDarkMode }, ref) => {
  return (
    <footer
      ref={ref}
      className={`w-full relative z-20 border-t ${
        isDarkMode
          ? "bg-slate-950 text-slate-100 border-slate-800"
          : "bg-white text-slate-800 border-slate-200"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-12 md:py-14">
        <div
          className={`rounded-2xl border p-5 md:p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
            isDarkMode
              ? "border-slate-800 bg-slate-900/60"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-[#4da6ff]">Elingo Education Platform</p>
            <h3 className="text-lg md:text-xl font-bold mt-1">
              Nền tảng kết nối lớp học hiện đại và minh bạch
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <FiShield className="text-[#4da6ff]" />
              Bảo mật tài khoản
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <FiBookOpen className="text-[#4da6ff]" />
              Học tập linh hoạt
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#4da6ff] rounded-xl flex items-center justify-center">
                <FiBookOpen className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold">Elingo</h3>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              Công ty Cổ phần Công nghệ Giáo dục Elingo.
              <br />
              MST: 0312 345 678 - Cấp ngày 12/06/2023 tại Sở KH&DT TP.HCM.
              <br />
              Vận hành nền tảng quản lý lớp học và trải nghiệm học tập số.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.facebook.com/profile.php?id=61587382195113"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:border-[#4da6ff] hover:bg-blue-50 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook className="text-slate-700 text-lg" />
              </a>
              <a
                href="https://www.tiktok.com/@elingo70?_r=1&_t=ZS-93edJ5PekA1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:border-[#4da6ff] hover:bg-blue-50 transition-colors"
                aria-label="TikTok"
              >
                <FaTiktok className="text-slate-700 text-lg" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold">Sản phẩm</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/classes"
                  className={`text-sm hover:text-[#4da6ff] transition-colors ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Danh sách lớp học
                </Link>
              </li>
              <li>
                <Link
                  to="/classes"
                  className="text-sm text-gray-600 hover:text-[#4da6ff] transition-colors"
                >
                  Lớp học
                  to="/community"
                  className={`text-sm hover:text-[#4da6ff] transition-colors ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Cộng đồng học tập
                </Link>
              </li>
              <li>
                <Link
                  to="/subscription"
                  className={`text-sm hover:text-[#4da6ff] transition-colors ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Gói Premium
                </Link>
              </li>
              <li>
                <Link
                  to="/teacher-verification"
                  className={`text-sm hover:text-[#4da6ff] transition-colors ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Trở thành giáo viên
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold">Thông tin & Chính sách</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about-us"
                  className={`text-sm hover:text-[#4da6ff] transition-colors ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Điều khoản sử dụng
                </span>
              </li>
              <li>
                <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Chính sách bảo mật
                </span>
              </li>
              <li>
                <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Quy chế hoạt động nền tảng
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-[#4da6ff] text-lg mt-0.5 shrink-0" />
                <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Tầng 8, Tòa nhà Halo, 48A Lê Văn Sỹ, Q.3, TP.HCM
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-[#4da6ff] text-lg shrink-0" />
                <a
                  href="tel:1900636888"
                  className={`text-sm hover:text-[#4da6ff] ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  1900 636 888
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-[#4da6ff] text-lg shrink-0" />
                <a
                  href="mailto:support@elingo.vn"
                  className={`text-sm hover:text-[#4da6ff] ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  support@elingo.vn
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiClock className="text-[#4da6ff] text-lg shrink-0" />
                <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Hỗ trợ: 08:00 - 22:00, Thứ 2 - Chủ nhật
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t pt-6 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
            <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
              © 2026 Elingo Education Technology JSC. All rights reserved.
            </p>
            <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
              Nền tảng học tập trực tuyến và quản lý lớp học chuyên nghiệp.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
