"use client";

import { useRef, useState, useEffect } from "react";

interface UseAnimateOnScrollOptions {
  readonly threshold?: number;
  readonly rootMargin?: string;
}

interface UseAnimateOnScrollReturn {
  readonly ref: React.RefObject<HTMLElement | null>;
  readonly isVisible: boolean;
}

export function useAnimateOnScroll(
  options: UseAnimateOnScrollOptions = {}
): UseAnimateOnScrollReturn {
  const { threshold = 0.1, rootMargin = "0px" } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
