import { useEffect, useState } from 'react';

/**
 * Data atual que se atualiza sozinha (para contagens regressivas e "há X min")
 */
export const useNow = (interval = 30000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);

  return now;
};
