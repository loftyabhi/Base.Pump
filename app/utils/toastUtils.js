import toast from "react-hot-toast";

// ✅ Unified Base-blue Toast Theme
const baseToastOptions = {
  style: {
    background: "linear-gradient(90deg, #0052FF, #00D2FF)",
    color: "white",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderRadius: "10px",
    padding: "12px 18px",
    fontFamily: "Inter, sans-serif",
  },
  duration: 4000,
  position: "top-center",
};

// ✅ Clean reusable functions
export const showSuccess = (msg) => toast.success(msg, baseToastOptions);
export const showError = (msg) => toast.error(msg, baseToastOptions);
export const showInfo = (msg) => toast(msg, { ...baseToastOptions, icon: "ℹ️" });
export const showLoading = (msg) => toast.loading(msg, baseToastOptions);
export const dismissToasts = () => toast.dismiss();

export default {
  showSuccess,
  showError,
  showInfo,
  showLoading,
  dismissToasts,
};
