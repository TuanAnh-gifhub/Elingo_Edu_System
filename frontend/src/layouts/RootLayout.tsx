import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import HeaderComponent from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import ChatBubble from "../pages/Customer/ChatBox/ChatBubble";
import "react-toastify/dist/ReactToastify.css";

declare global {
  interface Window {
    __hasLoadedOnce?: boolean;
  }
}

function RootLayout() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("landing_dark_mode") === "true";
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    const handleDarkModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(customEvent.detail.isDarkMode);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent />
      <main className="flex-1 [view-transition-name:page-content]">
        <Outlet />
      </main>
      <Footer isDarkMode={isDarkMode} />
      <ChatBubble />
    </div>
  );
}

export default RootLayout;
