import { useCallback, useEffect, useState } from "react";

const DARK_MODE_STORAGE_KEY = "landing_dark_mode";

const readDarkModeFromStorage = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "true";
};

export const useCustomerDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(readDarkModeFromStorage);

  useEffect(() => {
    const handleDarkModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      setIsDarkMode(Boolean(customEvent.detail?.isDarkMode));
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== DARK_MODE_STORAGE_KEY) {
        return;
      }

      setIsDarkMode(event.newValue === "true");
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("darkModeChanged", handleDarkModeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setDarkMode = useCallback((nextValue: boolean) => {
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(
      new CustomEvent("darkModeChanged", {
        detail: { isDarkMode: nextValue },
      }),
    );
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  return { isDarkMode, setDarkMode, toggleDarkMode };
};

