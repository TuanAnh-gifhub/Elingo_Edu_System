import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
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
} from "react-icons/fa";
import type { TeacherProfileDto } from "../../../services/teachers/teacherService";
interface AboutUsProps {
  isDarkMode?: boolean;
  teacherProfiles?: TeacherProfileDto[];
}

const AboutUs = ({ isDarkMode = false, teacherProfiles = [] }: AboutUsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const aboutUsRef = useRef<HTMLDivElement>(null);

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

  const sortedTeacherProfiles = [...teacherProfiles].sort((a, b) => {
    const byAverage = (b.averageRating || 0) - (a.averageRating || 0);
    if (byAverage !== 0) {
      return byAverage;
    }
    return (b.totalReviews || 0) - (a.totalReviews || 0);
  });

  return (
    <div
      ref={aboutUsRef}
      className="relative z-10 w-full py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
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
                  isDarkMode ? "text-gray-300" : "text-gray-600"
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
                      isDarkMode
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
                            isDarkMode ? "text-white" : "text-gray-900"
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
                isDarkMode ? "text-gray-300" : "text-gray-600"
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
                    isDarkMode
                      ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                      : "bg-white/95 backdrop-blur-sm border border-gray-100"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                      isDarkMode ? "bg-[#4da6ff]/20" : "bg-[#4da6ff]/10"
                    }`}
                  >
                    <IconComponent className="text-2xl text-[#4da6ff]" />
                  </div>
                  <h3
                    className={`text-lg font-bold mb-3 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-xs md:text-sm leading-relaxed ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
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
                isDarkMode ? "text-gray-300" : "text-gray-600"
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
                      isDarkMode
                        ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    {/* Number Badge */}
                    <div
                      className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode
                          ? "bg-[#4da6ff] text-white"
                          : "bg-[#4da6ff] text-white"
                      } shadow-lg`}
                    >
                      {step.number}
                    </div>

                    <div
                      className={`w-20 h-20 rounded-lg flex items-center justify-center mb-6 ${
                        isDarkMode ? "bg-[#4da6ff]/20" : "bg-[#4da6ff]/10"
                      }`}
                    >
                      <IconComponent className="text-3xl text-[#4da6ff]" />
                    </div>
                    <h3
                      className={`text-lg font-bold mb-3 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs md:text-sm leading-relaxed ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
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
                isDarkMode ? "text-gray-300" : "text-gray-600"
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
                  isDarkMode
                    ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
                    : "bg-white border border-gray-100"
                }`}
              >
                {/* Quote marks */}
                <FaQuoteLeft
                  className={`absolute top-4 right-4 text-4xl opacity-20 ${
                    isDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"
                  }`}
                />
                <FaQuoteRight
                  className={`absolute bottom-4 left-4 text-4xl opacity-20 ${
                    isDarkMode ? "text-[#4da6ff]" : "text-[#4da6ff]"
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
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {testimonial.name}
                    </h4>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
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
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {testimonial.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AboutUs;
