import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import HeaderComponent from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import ChatBubble from "../pages/Customer/ChatBox/ChatBubble";
import { useCustomerDarkMode } from "../hooks/useCustomerDarkMode";
import "react-toastify/dist/ReactToastify.css";

declare global {
  interface Window {
    __hasLoadedOnce?: boolean;
  }
}

function RootLayout() {
  const location = useLocation();
  const { isDarkMode } = useCustomerDarkMode();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div
      data-customer-theme={isDarkMode ? "dark" : "light"}
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDarkMode ? "customer-theme-dark" : "customer-theme-light"
      }`}
    >
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
