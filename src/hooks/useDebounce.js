// src/hooks/useDebounce.js - Hook utilitário para debounce
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook que retorna um valor com debounce
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Atraso em ms
 * @returns {any} - Valor após o debounce
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook que retorna uma função com debounce
 * @param {Function} callback - Função a ser chamada
 * @param {number} delay - Atraso em ms
 * @returns {Function} - Função debounced
 */
export function useDebouncedCallback(callback, delay = 300) {
    const timerRef = useRef(null);

    const debouncedCallback = useCallback((...args) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    // Cleanup no unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

/**
 * Hook que retorna uma função com throttle
 * Executa no máximo uma vez a cada intervalo
 * @param {Function} callback - Função a ser chamada
 * @param {number} delay - Intervalo mínimo entre chamadas
 * @returns {Function} - Função throttled
 */
export function useThrottledCallback(callback, delay = 300) {
    const lastRun = useRef(0);
    const timerRef = useRef(null);

    const throttledCallback = useCallback((...args) => {
        const now = Date.now();
        const timeSinceLastRun = now - lastRun.current;

        if (timeSinceLastRun >= delay) {
            lastRun.current = now;
            callback(...args);
        } else {
            // Agenda para executar após o delay
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                lastRun.current = Date.now();
                callback(...args);
            }, delay - timeSinceLastRun);
        }
    }, [callback, delay]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return throttledCallback;
}

export default useDebounce;
