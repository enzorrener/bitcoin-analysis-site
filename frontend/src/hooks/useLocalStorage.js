import { useCallback, useEffect, useRef, useState } from 'react';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Estado persistido no navegador (sobrevive a recarregamentos)
 */
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => read(key, initialValue));
  const keyRef = useRef(key);

  // Troca de chave (ex: outro usuário logado) recarrega o valor salvo
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(read(key, initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Armazenamento indisponível (modo privado): mantém só em memória
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
};
