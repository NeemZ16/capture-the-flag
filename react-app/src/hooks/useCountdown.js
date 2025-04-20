import { useState, useEffect } from 'react';

export default function useCountdown(initial = 0) {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return [remaining, setRemaining];
}