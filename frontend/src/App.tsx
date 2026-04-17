import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { router } from "./routes/Router";
import { useCustomerDarkMode } from "./hooks/useCustomerDarkMode";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  const { isDarkMode } = useCustomerDarkMode();

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </>
  );
}

export default App;
