import { useEffect, useState } from "react";

interface UseCountUpProps {
  end: number;
  duration?: number;
  start?: number;
}

export function useCountUp({ end, duration = 10, start = 0 }: UseCountUpProps) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (count >= end) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= end) {
          clearInterval(timer);
          return end;
        }
        return prev + 1;
      });
    }, duration);

    return () => clearInterval(timer);
  }, [count, end, duration]);

  return count;
}
