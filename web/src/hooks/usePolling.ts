
import { useEffect, useRef } from 'react';

interface UsePollingOptions {
  enabled: boolean;
  interval: number;
  onPoll: () => Promise<void> | void;
}

export const usePolling = ({ enabled, interval, onPoll }: UsePollingOptions) => {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (enabled) {
      intervalRef.current = setInterval(onPoll, interval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, onPoll]);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  return { stopPolling };
};
