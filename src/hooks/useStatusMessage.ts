import { useEffect } from 'react';

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

export const useAutoClearStatus = (
  statusMessage: StatusMessage,
  setStatusMessage: (value: StatusMessage) => void,
  delayMs = 3000
) => {
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), delayMs);
    return () => clearTimeout(timer);
  }, [statusMessage, setStatusMessage, delayMs]);
};
