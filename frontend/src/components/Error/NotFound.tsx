import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Prevent body scroll when this component is mounted
  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow || "unset";
    };
  }, []);

  // Listen for dark mode changes
  React.useEffect(() => {
    const handleDarkModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(customEvent.detail.isDarkMode);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange);
  }, []);

  return (
    <div className={`fixed inset-0 overflow-hidden h-screen w-screen ${
      isDarkMode 
        ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-b from-blue-200 via-blue-100 to-white"
    }`}>
      {/* Wavy background patterns */}
      <div className="absolute inset-0 opacity-30">
        <div className={`absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl opacity-50 ${
          isDarkMode ? "bg-blue-900" : "bg-blue-300"
        }`}></div>
        <div className={`absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl opacity-40 ${
          isDarkMode ? "bg-blue-800" : "bg-blue-200"
        }`}></div>
        <div className={`absolute bottom-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 ${
          isDarkMode ? "bg-blue-900" : "bg-blue-100"
        }`}></div>
      </div>

      {/* Globe icon in top right */}
      <div className={`absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 opacity-60 ${
        isDarkMode ? "text-blue-500" : "text-blue-400"
      }`}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>

      {/* Small 404 text at top */}
      <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 text-lg sm:text-xl font-light opacity-40 ${
        isDarkMode ? "text-blue-400" : "text-blue-300"
      }`}>
        404
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 pt-12 sm:pt-16 overflow-hidden">
        {/* 404 Numbers Container */}
        <div className="relative mb-4 sm:mb-6 md:mb-8 w-full max-w-3xl scale-75 sm:scale-90 md:scale-100">
          {/* Large 404 Numbers */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2 relative">
            {/* First 4 - Tilted */}
            <div className="relative z-10">
              <div className="relative">
                <div className={`text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black drop-shadow-2xl transform -rotate-6 leading-none ${
                  isDarkMode ? "text-blue-400" : "text-blue-500"
                }`}>
                  4
                </div>
                {/* Shadow for 3D effect */}
                <div className={`absolute inset-0 text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black opacity-30 blur-sm transform translate-x-1 translate-y-1 -rotate-6 leading-none pointer-events-none ${
                  isDarkMode ? "text-blue-600" : "text-blue-700"
                }`}>
                  4
                </div>
              </div>
              
              {/* Person with magnifying glass on left */}
              <div className="absolute -left-3 sm:-left-4 md:-left-6 lg:-left-8 bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-6 z-20">
                <div className="relative">
                  {/* Person body */}
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-blue-400 rounded-full relative">
                    {/* Head */}
                    <div className="absolute -top-0.5 sm:-top-1 md:-top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-blue-300 rounded-full"></div>
                    {/* Body */}
                    <div className="absolute top-1 sm:top-1.5 md:top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-3.5 sm:h-4 md:w-4 md:h-5 lg:w-5 lg:h-6 bg-blue-500 rounded-b-full"></div>
                  </div>
                  {/* Magnifying glass */}
                  <div className="absolute -right-1.5 sm:-right-2 md:-right-3 top-0.5 sm:top-1 md:top-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 border-2 border-blue-600 rounded-full bg-white/20">
                    <div className="absolute bottom-0 right-0 w-0.5 h-1 sm:w-1 sm:h-1.5 md:w-1 md:h-2 lg:w-1.5 lg:h-3 bg-blue-600 transform rotate-45 origin-bottom"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zero */}
            <div className="relative z-10">
              <div className="relative">
                <div className={`text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black drop-shadow-2xl leading-none ${
                  isDarkMode ? "text-blue-400" : "text-blue-500"
                }`}>
                  0
                </div>
                {/* Shadow for 3D effect */}
                <div className={`absolute inset-0 text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black opacity-30 blur-sm transform translate-x-1 translate-y-1 leading-none pointer-events-none ${
                  isDarkMode ? "text-blue-600" : "text-blue-700"
                }`}>
                  0
                </div>
              </div>
              
              {/* "Oops" speech bubble */}
              <div className="absolute -top-3 sm:-top-4 md:-top-6 lg:-top-8 left-1/2 transform -translate-x-1/2 z-30">
                <div className={`text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 rounded-full relative shadow-md ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-400"
                }`}>
                  oops
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${
                    isDarkMode ? "border-t-blue-600" : "border-t-blue-400"
                  }`}></div>
                </div>
              </div>

              {/* Small fallen figure */}
              <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 left-1/2 transform -translate-x-1/2 z-20">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-orange-500 rounded-full opacity-70"></div>
              </div>
            </div>

            {/* Second 4 */}
            <div className="relative z-10">
              <div className="relative">
                <div className={`text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black drop-shadow-2xl leading-none ${
                  isDarkMode ? "text-blue-400" : "text-blue-500"
                }`}>
                  4
                </div>
                {/* Shadow for 3D effect */}
                <div className={`absolute inset-0 text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black opacity-30 blur-sm transform translate-x-1 translate-y-1 leading-none pointer-events-none ${
                  isDarkMode ? "text-blue-600" : "text-blue-700"
                }`}>
                  4
                </div>
              </div>
              
              {/* "Not found" speech bubble */}
              <div className="absolute -top-3 sm:-top-4 md:-top-6 lg:-top-8 right-0 z-30">
                <div className={`text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 rounded-full relative whitespace-nowrap shadow-md ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-400"
                }`}>
                  not found
                  <div className={`absolute bottom-0 right-2 sm:right-2.5 md:right-3 translate-y-full w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${
                    isDarkMode ? "border-t-blue-600" : "border-t-blue-400"
                  }`}></div>
                </div>
              </div>

              {/* Person with wrench and plug on right */}
              <div className="absolute -right-3 sm:-right-4 md:-right-6 lg:-right-8 bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-6 z-20">
                <div className="relative">
                  {/* Person body */}
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-blue-400 rounded-full relative">
                    {/* Head */}
                    <div className="absolute -top-0.5 sm:-top-1 md:-top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-blue-300 rounded-full"></div>
                    {/* Body */}
                    <div className="absolute top-1 sm:top-1.5 md:top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-3.5 sm:h-4 md:w-4 md:h-5 lg:w-5 lg:h-6 bg-blue-500 rounded-b-full"></div>
                  </div>
                  {/* Wrench */}
                  <div className="absolute -left-3 sm:-left-3.5 md:-left-4 lg:-left-5 top-0.5 sm:top-0.5 md:top-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 w-full h-full">
                      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                    </svg>
                  </div>
                  {/* Plug */}
                  <div className="absolute -left-1 sm:-left-1 md:-left-1.5 lg:-left-2 top-2 sm:top-2.5 md:top-3 lg:top-4 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5">
                    <div className="w-full h-0.5 sm:h-1 md:h-1 bg-blue-600 rounded-t"></div>
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      <div className="w-0.5 h-0.5 sm:h-1 md:h-1 bg-blue-600"></div>
                      <div className="w-0.5 h-0.5 sm:h-1 md:h-1 bg-blue-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small plants/organic elements */}
        <div className="absolute bottom-12 sm:bottom-16 md:bottom-20 left-1/4 flex gap-2 sm:gap-3 opacity-60 z-0">
          <div className="relative">
            <div className="w-0.5 h-2 sm:h-2.5 md:h-3 bg-orange-400"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full"></div>
          </div>
          <div className="relative">
            <div className="w-0.5 h-1.5 sm:h-2 md:h-2.5 bg-red-400"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full"></div>
          </div>
        </div>
        <div className="absolute bottom-10 sm:bottom-12 md:bottom-16 right-1/4 flex gap-2 opacity-60 z-0">
          <div className="relative">
            <div className="w-0.5 h-1.5 sm:h-2 md:h-2.5 bg-orange-400"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full"></div>
          </div>
        </div>

        {/* Vietnamese text */}
        <div className="text-center mb-4 sm:mb-6 mt-2 sm:mt-4 relative z-10 px-4">
          <p className={`text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 ${
            isDarkMode ? "text-gray-200" : "text-gray-700"
          }`}>
            Xin lỗi, trang bạn tìm kiếm không tồn tại
          </p>
          <p className={`text-xs sm:text-sm md:text-base ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}>
            Có thể URL bị hỏng hoặc trang đã bị xóa
          </p>
        </div>

        {/* Go home button */}
        <Link
          to="/"
          className="relative z-20 px-6 py-2 sm:px-7 sm:py-2.5 md:px-8 md:py-3 bg-[#4da6ff] text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-[#3d8cff] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span className="text-white">Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
