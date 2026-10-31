"use client";

import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState(initial);
  const initialRef = useRef(initial);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    try {
      setValue(JSON.parse(raw) as T);
    } catch {
      setValue(initialRef.current);
    }
  }, [key]);

  function write(next: T) {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  return [value, write];
}
