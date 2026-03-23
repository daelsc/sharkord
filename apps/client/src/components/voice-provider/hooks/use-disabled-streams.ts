import { StreamKind } from '@sharkord/shared';
import { useCallback, useRef } from 'react';

const makeKey = (userId: number, kind: string) => `${userId}:${kind}`;

export const useDisabledStreams = () => {
  const disabled = useRef(new Set<string>());

  const disableStream = useCallback((userId: number, kind: StreamKind) => {
    disabled.current.add(makeKey(userId, kind));
  }, []);

  const enableStream = useCallback((userId: number, kind: StreamKind) => {
    disabled.current.delete(makeKey(userId, kind));
  }, []);

  const isStreamDisabled = useCallback((userId: number, kind: StreamKind) => {
    return disabled.current.has(makeKey(userId, kind));
  }, []);

  const clearDisabledStreams = useCallback(() => {
    disabled.current.clear();
  }, []);

  const clearDisabledStreamsForUser = useCallback((userId: number) => {
    for (const key of disabled.current) {
      if (key.startsWith(`${userId}:`)) {
        disabled.current.delete(key);
      }
    }
  }, []);

  return {
    disableStream,
    enableStream,
    isStreamDisabled,
    clearDisabledStreams,
    clearDisabledStreamsForUser
  };
};
