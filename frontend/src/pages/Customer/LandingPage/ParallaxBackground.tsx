import { useEffect, useRef, useState } from "react";

interface ParallaxBackgroundProps {
  isDarkMode: boolean;
}

function ParallaxBackground({ isDarkMode }: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main background with gradient */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100vw",
          height: "100vh",
          background: isDarkMode 
            ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
            : "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #ffffff 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      
      {/* Subtle pattern overlay */}
      <div
        ref={backgroundRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
          opacity: isDarkMode ? 0.03 : 0.05,
          backgroundImage: isDarkMode
            ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`
            : `radial-gradient(circle at 2px 2px, rgba(77,166,255,0.1) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
          transform: `translateY(${scrollY * 0.3}px)`,
          transition: "transform 0.1s ease-out",
        }}
        aria-hidden="true"
      />
      
      {/* Elegant wave pattern */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
          opacity: isDarkMode ? 0.08 : 0.12,
          background: isDarkMode
            ? `linear-gradient(180deg, transparent 0%, rgba(77,166,255,0.1) 50%, transparent 100%)`
            : `linear-gradient(180deg, transparent 0%, rgba(77,166,255,0.08) 50%, transparent 100%)`,
        }}
        aria-hidden="true"
      />
      
      {/* Soft light rays effect */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
          opacity: isDarkMode ? 0.05 : 0.08,
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDarkMode ? "rgba(77,166,255,0.3)" : "rgba(77,166,255,0.2)"} stopOpacity="1" />
            <stop offset="100%" stopColor={isDarkMode ? "rgba(77,166,255,0)" : "rgba(77,166,255,0)"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="20%" cy="10%" rx="30%" ry="40%" fill="url(#lightGradient)" />
        <ellipse cx="80%" cy="20%" rx="25%" ry="35%" fill="url(#lightGradient)" />
        </svg>
    </>
  );
}

export default ParallaxBackground;
