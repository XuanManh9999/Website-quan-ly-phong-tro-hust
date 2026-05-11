import { toast } from "react-toastify";

const baseOptions = {
  position: "top-right",
  autoClose: 3200,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

const normalize = (message, fallback) => {
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
};

export const notify = {
  success(message, options = {}) {
    return toast.success(normalize(message, "Thao tác thành công"), {
      ...baseOptions,
      ...options
    });
  },
  error(message, options = {}) {
    return toast.error(normalize(message, "Đã có lỗi xảy ra"), {
      ...baseOptions,
      ...options
    });
  },
  info(message, options = {}) {
    return toast.info(normalize(message, "Thông báo"), {
      ...baseOptions,
      ...options
    });
  },
  warning(message, options = {}) {
    return toast.warning(normalize(message, "Cảnh báo"), {
      ...baseOptions,
      ...options
    });
  }
};
