import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa uma função assíncrona e controla loading/erro.
 * @param {Function} fn - Função que retorna uma Promise
 * @param {Array} deps - Dependências que disparam nova execução
 * @param {object} options - { refreshInterval: ms } para atualizar periodicamente
 */
export const useAsync = (fn, deps = [], { refreshInterval } = {}) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent = false) => {
    let cancelled = false;
    if (!silent) setState((prev) => ({ ...prev, loading: true, error: null }));

    fnRef.current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!cancelled) setState((prev) => ({ data: prev.data, error, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = run();
    if (!refreshInterval) return cancel;

    const timer = setInterval(() => {
      if (!document.hidden) run(true);
    }, refreshInterval);

    return () => {
      cancel();
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
};
