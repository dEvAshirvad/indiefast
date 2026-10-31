"use client";

import { type RefObject, useEffect, useState } from "react";

export function useIntersection(ref: RefObject<Element | null>): boolean {
  const [intersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry?.isIntersecting ?? false);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return intersecting;
}
