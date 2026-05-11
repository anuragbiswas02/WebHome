import { useCallback, useEffect, useState } from "react";

export function useFocusMode() {
  const [focusMode, setFocusMode] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("focusMode") === "1";
  });

  useEffect(() => {
    localStorage.setItem("focusMode", focusMode ? "1" : "0");
  }, [focusMode]);

  const toggle = useCallback(() => setFocusMode((f) => !f), []);

  return { focusMode, toggleFocusMode: toggle, setFocusMode };
}
