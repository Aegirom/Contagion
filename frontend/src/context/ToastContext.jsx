import { createContext, useCallback, useContext, useState } from "react";

export const ToastContext = createContext();

const TOAST_DURATION = 3500;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "xp") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer animate-slideUp rounded-lg border px-4 py-3 font-code text-xs shadow-lg backdrop-blur-md transition-opacity duration-300 ${
              toast.type === "xp"
                ? "border-toxic/40 bg-toxic/15 text-toxic"
                :               toast.type === "success"
                ? "border-green-300 bg-green-50 text-green-700"
                : toast.type === "error"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-200 bg-white/90 text-gray-700"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
