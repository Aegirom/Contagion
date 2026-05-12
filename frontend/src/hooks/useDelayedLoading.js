import { useState, useEffect, useRef } from "react";

export const useDelayedLoading = (loading, delay = 80) => {
  const [showLoading, setShowLoading] = useState(false);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
    if (loading) {
      const id = setTimeout(() => {
        if (loadingRef.current) {
          setShowLoading(true);
        }
      }, delay);
      return () => clearTimeout(id);
    }
    setShowLoading(false);
  }, [loading, delay]);

  return showLoading;
};

export default useDelayedLoading;
