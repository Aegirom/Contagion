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
                : toast.type === "success"
                ? "border-green-500/40 bg-green-500/15 text-green-300"
                : toast.type === "error"
                ? "border-red-500/40 bg-red-500/15 text-red-300"
                : "border-phantom bg-obsidian/90 text-slate-300"
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
