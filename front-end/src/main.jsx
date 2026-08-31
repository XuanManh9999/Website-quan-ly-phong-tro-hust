import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import AOS from "aos";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import "aos/dist/aos.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

AOS.init({
  duration: 400,
  easing: "ease-out",
  once: true,
  offset: 30,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3200}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
          className="toast-container"
          bodyClassName="toast-body"
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

