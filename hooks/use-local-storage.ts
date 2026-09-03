import { useCallback, useSyncExternalStore } from "react";

const SYNC_EVENT = "local-storage-sync";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SYNC_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SYNC_EVENT, callback);
  };
}

export function useLocalStorage(key: string, defaultValue: boolean): [boolean, (value: boolean) => void] {
  const getSnapshot = useCallback(() => {
    const stored = window.localStorage.getItem(key);
    return stored !== null ? stored === "true" : defaultValue;
  }, [key, defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  const setValue = useCallback(
    (next: boolean) => {
      window.localStorage.setItem(key, String(next));
      window.dispatchEvent(new Event(SYNC_EVENT));
    },
    [key]
  );

  return [value, setValue];
}
