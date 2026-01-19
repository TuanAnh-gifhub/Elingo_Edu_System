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
  FaEnvelope
} from "react-icons/fa";

interface AboutUsProps {
  isDarkMode?: boolean;
}

const AboutUs = ({ isDarkMode = false }: AboutUsProps) => {
  const [isVisible, setIsVisible] = useState(true); // Set to true initially to show content immediately
  const [email, setEmail] = useState("");
  const aboutUsRef = useRef<HTMLDivElement>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log("Subscribing with email:", email);
    setEmail("");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.01 } // Lower threshold to trigger earlier
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
      title: "Đặt Phòng Nhanh Chóng",
      description: "Chỉ với vài thao tác đơn giản, bạn có thể đặt phòng học ngay lập tức"
    },
    {
      icon: FaShieldAlt,
      title: "Bảo Mật & An Toàn",
      description: "Hệ thống bảo mật cao, đảm bảo thông tin cá nhân luôn được bảo vệ"
    },
    {
      icon: FaCreditCard,
      title: "Thanh Toán Linh Hoạt",
      description: "Hỗ trợ nhiều hình thức thanh toán tiện lợi và an toàn"
    },
    {
      icon: FaHeadset,
      title: "Hỗ Trợ 24/7",
      description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc"
    }
  ];

  const steps = [
    {
      number: "01",
      icon: FaSearch,
      title: "Tìm Kiếm Phòng",
      description: "Tìm kiếm phòng học phù hợp với nhu cầu của bạn theo địa điểm, sức chứa và giá cả"
    },
    {
      number: "02",
      icon: FaCalendarCheck,
      title: "Đặt Phòng & Thanh Toán",
      description: "Chọn thời gian phù hợp và thanh toán dễ dàng qua nhiều hình thức"
    },
    {
      number: "03",
      icon: FaCheckCircle,
      title: "Xác Nhận & Sử Dụng",
      description: "Nhận xác nhận ngay lập tức và bắt đầu sử dụng phòng học của bạn"
    }
  ];

  const testimonials = [
    {
      name: "Nguyễn Minh Anh",
      occupation: "Sinh viên",
      rating: 5,
      text: "Phòng học rất sạch sẽ, yên tĩnh và đầy đủ tiện nghi. Giá cả hợp lý, dịch vụ tốt. Tôi sẽ tiếp tục sử dụng!",
      avatar: "https://ui-avatars.com/api/?name=Nguyen+Minh+Anh&background=4da6ff&color=fff&size=128"
    },
    {
      name: "Trần Hoàng Nam",
      occupation: "Freelancer",
      rating: 5,
      text: "Không gian làm việc chuyên nghiệp, internet nhanh. Rất phù hợp cho những người làm việc tự do như tôi",
      avatar: "https://ui-avatars.com/api/?name=Tran+Hoang+Nam&background=4da6ff&color=fff&size=128"
    },
    {
      name: "Lê Thị Hương",
      occupation: "Giáo viên",
      rating: 5,
      text: "Đặt phòng nhanh chóng và tiện lợi. Phòng học có đầy đủ thiết bị cần thiết cho buổi dạy của tôi",
      avatar: "https://ui-avatars.com/api/?name=Le+Thi+Huong&background=4da6ff&color=fff&size=128"
    }
  ];

  return (
    <div 
      ref={aboutUsRef}
      className="relative z-10 w-full py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section 1: Tại Sao Chọn Chúng Tôi? */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#4da6ff]">
              Tại Sao Chọn Chúng Tôi?
            </h2>
            <p className={`text-sm md:text-base ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Chúng tôi cam kết mang đến trải nghiệm thuê phòng học tốt nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, y: 0 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                    isDarkMode 
                      ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' 
                      : 'bg-white/95 backdrop-blur-sm border border-gray-100'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                    isDarkMode ? 'bg-[#4da6ff]/20' : 'bg-[#4da6ff]/10'
                  }`}>
                    <IconComponent className="text-2xl text-[#4da6ff]" />
                  </div>
                  <h3 className={`text-lg font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`text-xs md:text-sm leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
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
            <p className={`text-sm md:text-base ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Quy trình đặt phòng đơn giản chỉ với 3 bước
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div className={`relative rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                    isDarkMode 
                      ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' 
                      : 'bg-white border border-gray-100'
                  }`}>
                    {/* Number Badge */}
                    <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isDarkMode ? 'bg-[#4da6ff] text-white' : 'bg-[#4da6ff] text-white'
                    } shadow-lg`}>
                      {step.number}
                    </div>

                    <div className={`w-20 h-20 rounded-lg flex items-center justify-center mb-6 ${
                      isDarkMode ? 'bg-[#4da6ff]/20' : 'bg-[#4da6ff]/10'
                    }`}>
                      <IconComponent className="text-3xl text-[#4da6ff]" />
                    </div>
                    <h3 className={`text-lg font-bold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs md:text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
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
            <p className={`text-sm md:text-base ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Hàng nghìn khách hàng hài lòng đã sử dụng dịch vụ của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 1, y: 0 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={`relative rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  isDarkMode 
                    ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' 
                    : 'bg-white border border-gray-100'
                }`}
              >
                {/* Quote marks */}
                <FaQuoteLeft className={`absolute top-4 right-4 text-4xl opacity-20 ${
                  isDarkMode ? 'text-[#4da6ff]' : 'text-[#4da6ff]'
                }`} />
                <FaQuoteRight className={`absolute bottom-4 left-4 text-4xl opacity-20 ${
                  isDarkMode ? 'text-[#4da6ff]' : 'text-[#4da6ff]'
                }`} />

                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-[#4da6ff]"
                  />
                  <div>
                    <h4 className={`font-bold text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {testimonial.name}
                    </h4>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {testimonial.occupation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-sm" />
                  ))}
                </div>

                <p className={`text-sm leading-relaxed relative z-10 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {testimonial.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section 4: Đăng Ký Nhận Ưu Đãi */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-20 mt-20"
        >
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-blue-500 to-blue-700 p-8 md:p-12">
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
                Nhận thông tin và các phòng học mới và ưu đãi đặc biệt ngay trong email của bạn
              </p>

              {/* Email Form */}
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
