import { Outlet } from "react-router-dom";
import HeaderComponent from "../components/Header/Header";
import ChatBubble from "../pages/Customer/ChatBox/ChatBubble";
import "react-toastify/dist/ReactToastify.css";

declare global {
  interface Window {
    __hasLoadedOnce?: boolean;
  }
}

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent />
      <main className="flex-1 [view-transition-name:page-content]">
        <Outlet />
      </main>
      <ChatBubble />
    </div>
  );
}

export default RootLayout;
