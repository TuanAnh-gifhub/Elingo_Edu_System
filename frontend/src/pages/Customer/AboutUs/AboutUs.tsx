import { motion } from "framer-motion";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { message } from "antd";
import {
  FaClock,
  FaShieldAlt,
  FaCreditCard,
  FaHeadset,
  FaSearch,
  FaCalendarCheck,
  FaCheckCircle,
  FaStar,
  FaQuoteLeft,
  FaQuoteRight,
  FaEnvelope,
  FaBuilding,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaGlobe,
  FaTiktok,
  FaFacebook,
} from "react-icons/fa";
import type { TeacherProfileDto } from "../../../services/teachers/teacherService";
interface AboutUsProps {
  isDarkMode?: boolean;
  teacherProfiles?: TeacherProfileDto[];
  variant?: "section" | "page";
}

const AboutUs = ({ 
  isDarkMode = false, 
  teacherProfiles = [], 
  variant = "page" // Lấy thêm variant từ Develop
}: AboutUsProps) => {
  // Lấy các State phục vụ tính năng từ nhánh Develop
  const [messageApi, contextHolder] = message.useMessage();
  const [isVisible, setIsVisible] = useState(true);
  const [email, setEmail] = useState("");
  
  // Logic xử lý Dark Mode nội bộ từ Develop (rất hữu ích để lưu cấu hình người dùng)
  const [internalDarkMode, setInternalDarkMode] = useState(() => {
    return localStorage.getItem("landing_dark_mode") === "true";
  });
  const aboutUsRef = useRef<HTMLDivElement>(null);
  const resolvedDarkMode = typeof isDarkMode === "boolean" ? isDarkMode : internalDarkMode;

  useEffect(() => {
    const handleDarkModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setInternalDarkMode(customEvent.detail.isDarkMode);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.01 }, // Lower threshold to trigger earlier
    );

    const currentRef = aboutUsRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const features = [
    {
      icon: FaClock,
      title: "Đặt Lớp Học Nhanh Chóng",
      description:
        "Chỉ với vài thao tác đơn giản, bạn có thể đặt lớp học và kết nối với giáo viên ngay lập tức",
    },
    {
      icon: FaShieldAlt,
      title: "Bảo Mật & An Toàn",
      description:
        "Hệ thống bảo mật cao, đảm bảo thông tin cá nhân và dữ liệu học tập luôn được bảo vệ",
    },
    {
      icon: FaCreditCard,
      title: "Thanh Toán Linh Hoạt",
      description: "Hỗ trợ nhiều hình thức thanh toán tiện lợi và an toàn cho học viên và giáo viên",
    },
    {
      icon: FaHeadset,
      title: "Hỗ Trợ 24/7",
      description:
        "Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn trong suốt quá trình học",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: FaSearch,
      title: "Tìm Kiếm Lớp Học & Giáo Viên",
      description:
        "Tìm lớp học và giáo viên phù hợp theo môn học, trình độ, khu vực hoặc hình thức học",
    },
    {
      number: "02",
      icon: FaCalendarCheck,
      title: "Đặt Lịch Học & Thanh Toán",
      description:
        "Chọn thời gian học phù hợp và thanh toán dễ dàng qua nhiều hình thức",
    },
    {
      number: "03",
      icon: FaCheckCircle,
      title: "Bắt Đầu Buổi Học",
      description:
        "Nhận xác nhận ngay lập tức và bắt đầu tham gia buổi học cùng giáo viên",
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Minh Anh",
      occupation: "Sinh viên",
      rating: 5,
      text: "Nhờ Elingo, mình dễ dàng tìm được giáo viên phù hợp và lịch học linh hoạt. Trải nghiệm học tập rất thoải mái và hiệu quả.",
      avatar:
        "https://ui-avatars.com/api/?name=Nguyen+Minh+Anh&background=4da6ff&color=fff&size=128",
    },
    {
      name: "Trần Hoàng Nam",
      occupation: "Freelancer",
      rating: 5,
      text: "Mình có thể dạy thêm ngoài giờ rất thuận tiện. Hệ thống quản lý lớp học và học viên rõ ràng, thanh toán minh bạch.",
      avatar:
        "https://ui-avatars.com/api/?name=Tran+Hoang+Nam&background=4da6ff&color=fff&size=128",
    },
    {
      name: "Lê Thị Hương",
      occupation: "Giáo viên",
      rating: 5,
      text: "Elingo giúp mình mở lớp nhanh chóng, quản lý lịch dạy và học viên dễ dàng. Học viên cũng phản hồi rất tích cực về trải nghiệm.",
      avatar:
        "https://ui-avatars.com/api/?name=Le+Thi+Huong&background=4da6ff&color=fff&size=128",
    },
  ];

  const companyInfoItems = [
    {
      icon: FaBuilding,
      label: "Đơn vị vận hành",
      value: "Công ty Cổ phần Công nghệ Giáo dục Elingo",
    },
    {
      icon: FaGlobe,
      label: "Mã số thuế",
      value: "0312 345 678",
    },
    {
      icon: FaPhoneAlt,
      label: "Hotline",
      value: "1900 636 888",
    },
    {
      icon: FaEnvelope,
      label: "Email hỗ trợ",
      value: "support@elingo.vn",
    },
    {
      icon: FaMapMarkerAlt,
      label: "Văn phòng",
      value: "Tầng 8, Halo Building, 48A Lê Văn Sỹ, Q.3, TP.HCM",
    },
    {
      icon: FaClock,
      label: "Giờ hỗ trợ",
      value: "08:00 - 22:00 (Thứ 2 - Chủ nhật)",
    },
  ];

  const strategicPillars = [
    {
      title: "Tầm nhìn",
      description:
        "Trở thành nền tảng học tập số tin cậy hàng đầu tại Việt Nam, nơi giáo viên và học viên có thể kết nối, cộng tác và phát triển năng lực bền vững.",
    },
    {
      title: "Sứ mệnh",
      description:
        "Chuẩn hóa quy trình mở lớp, đặt lịch và quản lý chất lượng học tập thông qua công nghệ, giúp việc học linh hoạt hơn nhưng vẫn đảm bảo hiệu quả rõ ràng.",
    },
    {
      title: "Giá trị cốt lõi",
      description:
        "Lấy người học làm trung tâm, minh bạch trong vận hành, liên tục cải tiến sản phẩm và tôn trọng cam kết chất lượng với cả học viên lẫn giáo viên.",
    },
  ];

  const qualityCommitments = [
    "Xác thực hồ sơ giáo viên theo quy trình nhiều bước trước khi mở lớp chính thức.",
    "Hiển thị thông tin lớp học minh bạch về lịch học, học phí và mô tả nội dung.",
    "Ghi nhận đánh giá sau mỗi trải nghiệm để cải thiện chất lượng liên tục.",
    "Hỗ trợ xử lý sự cố vận hành và tư vấn người dùng trong khung giờ cam kết.",
    "Bảo vệ dữ liệu tài khoản và dữ liệu học tập theo tiêu chuẩn bảo mật nội bộ.",
    "Duy trì chính sách hợp tác công bằng giữa nền tảng, giáo viên và người học.",
  ];

  const faqItems = [
    {
      question: "Elingo hỗ trợ những hình thức học nào?",
      answer:
        "Nền tảng hỗ trợ lớp học trực tuyến, lớp trực tiếp và các mô hình hybrid tùy theo thiết kế của giáo viên và nhu cầu học viên.",
    },
    {
      question: "Làm thế nào để trở thành giáo viên trên Elingo?",
      answer:
        "Bạn có thể đăng ký qua mục Xác minh giáo viên, cung cấp thông tin chuyên môn và chờ hệ thống xét duyệt để mở lớp trên nền tảng.",
    },
    {
      question: "Người học có thể theo dõi lịch sử học tập không?",
      answer:
        "Có. Học viên có thể theo dõi lớp đã đăng ký, tiến độ học và các hoạt động liên quan trực tiếp trong tài khoản cá nhân.",
    },
    {
      question: "Nếu gặp vấn đề thanh toán hoặc kỹ thuật thì xử lý thế nào?",
      answer:
        "Bạn có thể liên hệ hotline hoặc email hỗ trợ. Đội ngũ Elingo tiếp nhận và phản hồi theo mức độ ưu tiên của sự cố.",
    },
  ];

  const sortedTeacherProfiles = [...teacherProfiles].sort((a, b) => {
    const byAverage = (b.averageRating || 0) - (a.averageRating || 0);
    if (byAverage !== 0) {
      return byAverage;
    }
    return (b.totalReviews || 0) - (a.totalReviews || 0);
  });

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      messageApi.error("Vui lòng nhập email hợp lệ.");
      return;
    }

    messageApi.success("Đăng ký nhận ưu đãi thành công.");
    setEmail("");
  };

  return (
    <div
      ref={aboutUsRef}
      className="relative z-10 w-full py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {variant === "page" && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mb-14 rounded-2xl border p-6 md:p-8 ${
              resolvedDarkMode
                ? "bg-gray-800/90 border-gray-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-[#4da6ff] mb-2">Về Elingo</p>
                <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${resolvedDarkMode ? "text-white" : "text-slate-900"}`}>
                  Nền tảng kết nối học viên và giáo viên theo tiêu chuẩn chuyên nghiệp
                </h1>
                <p className={`text-sm md:text-base leading-relaxed ${resolvedDarkMode ? "text-gray-300" : "text-slate-600"}`}>
                  Elingo được xây dựng với mục tiêu số hóa trải nghiệm dạy và học, giúp giáo viên mở lớp nhanh,
                  học viên đăng ký minh bạch và toàn bộ quá trình vận hành được theo dõi tập trung.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <a
                    href="https://www.facebook.com/profile.php?id=61587382195113"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#4da6ff]/40 text-[#4da6ff] hover:bg-[#4da6ff]/10 transition-colors text-sm"
                  >
                    <FaFacebook />
                    Facebook chính thức
                  </a>
                  <a
                    href="https://www.tiktok.com/@elingo70?_r=1&_t=ZS-93edJ5PekA1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#4da6ff]/40 text-[#4da6ff] hover:bg-[#4da6ff]/10 transition-colors text-sm"
                  >
                    <FaTiktok />
                    TikTok chính thức
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
                {companyInfoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`rounded-xl border p-4 ${
                        resolvedDarkMode
                          ? "bg-gray-900/60 border-gray-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4da6ff]/15 text-[#4da6ff] flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="text-sm" />
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${resolvedDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                            {item.label}
                          </p>
                          <p className={`text-sm font-medium ${resolvedDarkMode ? "text-white" : "text-slate-800"}`}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {variant === "page" && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {strategicPillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className={`rounded-xl border p-6 ${
                    resolvedDarkMode
                      ? "bg-gray-800/90 border-gray-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <h3 className={`text-lg font-bold mb-3 ${resolvedDarkMode ? "text-white" : "text-slate-900"}`}>
                    {pillar.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${resolvedDarkMode ? "text-gray-300" : "text-slate-600"}`}>
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {sortedTeacherProfiles.length > 0 && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
                Giáo Viên Nổi Bật
              </h2>
              <p
                className={`text-sm md:text-base ${
                  resolvedDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Xếp hạng theo đánh giá từ cao xuống thấp
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedTeacherProfiles.map((teacher, index) => {
                const safeRating = Math.max(0, Math.min(5, Number(teacher.averageRating || 0)));
                const filledStars = Math.round(safeRating);
                return (
                  <motion.div
                    key={teacher.teacherId}
                    initial={{ opacity: 1, y: 0 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className={`rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                      resolvedDarkMode
                        ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                        : "bg-white/95 backdrop-blur-sm border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={teacher.avatar}
                        alt={teacher.teacherName}
                        className="w-12 h-12 rounded-full object-cover border border-sky-200"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <h3
                          className={`text-sm font-bold truncate ${
                            resolvedDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {teacher.teacherName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {teacher.totalReviews || 0} đánh giá
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <FaStar
                          key={`${teacher.teacherId}-star-${starIndex}`}
                          className={
                            starIndex < filledStars
                              ? "text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600">
                      {safeRating.toFixed(1)}/5.0
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Section 1: Tại Sao Chọn Chúng Tôi? */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
              Tại Sao Chọn Elingo?
            </h2>
            <p
              className={`text-sm md:text-base ${
                resolvedDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Chúng tôi cam kết mang đến trải nghiệm kết nối giáo viên và học viên tốt nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, y: 0 }}
                  animate={
                    isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }
                  }
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                    resolvedDarkMode
                      ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                      : "bg-white/95 backdrop-blur-sm border border-gray-100"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                      resolvedDarkMode ? "bg-[#4da6ff]/20" : "bg-[#4da6ff]/10"
                    }`}
                  >
                    <IconComponent className="text-2xl text-[#4da6ff]" />
                  </div>
                  <h3
                    className={`text-lg font-bold mb-3 ${
                      resolvedDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-xs md:text-sm leading-relaxed ${
                      resolvedDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Section 2: Cách Thức Hoạt Động */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
              Cách Thức Hoạt Động
            </h2>
            <p
              className={`text-sm md:text-base ${
                resolvedDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Quy trình đăng ký lớp học đơn giản chỉ với 3 bước
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={
                    isVisible
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div
                    className={`relative rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                      resolvedDarkMode
                        ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    {/* Number Badge */}
                    <div
                      className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        resolvedDarkMode
                          ? "bg-[#4da6ff] text-white"
                          : "bg-[#4da6ff] text-white"
                      } shadow-lg`}
                    >
                      {step.number}
                    </div>

                    <div
                      className={`w-20 h-20 rounded-lg flex items-center justify-center mb-6 ${
                        resolvedDarkMode ? "bg-[#4da6ff]/20" : "bg-[#4da6ff]/10"
                      }`}
                    >
                      <IconComponent className="text-3xl text-[#4da6ff]" />
                    </div>
                    <h3
                      className={`text-lg font-bold mb-3 ${
                        resolvedDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs md:text-sm leading-relaxed ${
                        resolvedDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Section 3: Khách Hàng Nói Gì Về Chúng Tôi */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
              Khách Hàng Nói Gì Về Chúng Tôi
            </h2>
            <p
              className={`text-sm md:text-base ${
                resolvedDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Hàng nghìn học viên và giáo viên hài lòng đã sử dụng nền tảng của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 1, y: 0 }}
                animate={
                  isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }
                }
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={`relative rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  resolvedDarkMode
                    ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                    : "bg-white border border-gray-100"
                }`}
              >
                {/* Quote marks */}
                <FaQuoteLeft
                  className={`absolute top-4 right-4 text-4xl opacity-20 ${
                    resolvedDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"
                  }`}
                />
                <FaQuoteRight
                  className={`absolute bottom-4 left-4 text-4xl opacity-20 ${
                    resolvedDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"
                  }`}
                />

                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-[#4da6ff]"
                  />
                  <div>
                    <h4
                      className={`font-bold text-base ${
                        resolvedDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {testimonial.name}
                    </h4>
                    <p
                      className={`text-xs ${
                        resolvedDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {testimonial.occupation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-sm" />
                  ))}
                </div>

                <p
                  className={`text-sm leading-relaxed relative z-10 ${
                    resolvedDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {testimonial.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {variant === "page" && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-[#4da6ff]">
                Cam Kết Chất Lượng Dịch Vụ
              </h2>
              <p className={`text-sm md:text-base ${resolvedDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Các nguyên tắc vận hành mà Elingo theo đuổi để đảm bảo trải nghiệm ổn định và chuyên nghiệp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualityCommitments.map((commitment, index) => (
                <div
                  key={commitment}
                  className={`rounded-xl border p-5 flex items-start gap-3 ${
                    resolvedDarkMode
                      ? "bg-gray-800/90 border-gray-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#4da6ff]/15 text-[#4da6ff] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className={`text-sm leading-relaxed ${resolvedDarkMode ? "text-gray-300" : "text-slate-700"}`}>
                    {commitment}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {variant === "page" && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-[#4da6ff]">
                Câu Hỏi Thường Gặp
              </h2>
              <p className={`text-sm md:text-base ${resolvedDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Một số thông tin nhanh giúp bạn hiểu rõ cách Elingo vận hành.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq) => (
                <div
                  key={faq.question}
                  className={`rounded-xl border p-5 ${
                    resolvedDarkMode
                      ? "bg-gray-800/90 border-gray-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <h3 className={`text-base font-semibold mb-2 ${resolvedDarkMode ? "text-white" : "text-slate-900"}`}>
                    {faq.question}
                  </h3>
                  <p className={`text-sm leading-relaxed ${resolvedDarkMode ? "text-gray-300" : "text-slate-600"}`}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Section 4: Đăng Ký Nhận Ưu Đãi */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-20 mt-20"
        >
          <div className="relative rounded-2xl overflow-hidden bg-linear-to-b from-blue-500 to-blue-700 p-8 md:p-12">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 text-center">
              {/* Envelope Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <FaEnvelope className="text-white text-3xl" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                Đăng Ký Nhận Ưu Đãi
              </h2>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-white/90 mb-8 max-w-2xl mx-auto">
                Nhận thông tin và các phòng học mới và ưu đãi đặc biệt ngay
                trong email của bạn
              </p>

              {/* Email Form */}
              {contextHolder}
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-gray-700 placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap"
                >
                  Đăng ký
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
