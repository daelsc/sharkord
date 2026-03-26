import { useCallback, useMemo } from 'react';
import { useVolumeControl } from '../volume-control-context';

type TStreamVolumeProps =
  | { type: 'user'; userId: number }
  | { type: 'external'; pluginId: string; streamKey: string };

export const useStreamVolumeControl = (props: TStreamVolumeProps) => {
  const {
    getVolume,
    setVolume,
    toggleMute,
    getUserVolumeKey,
    getExternalVolumeKey
  } = useVolumeControl();

  const volumeKey =
    props.type === 'user'
      ? getUserVolumeKey(props.userId)
      : getExternalVolumeKey(props.pluginId, props.streamKey);

  const defaultVolume = props.type === 'external' ? 0 : 100;
  const volume = getVolume(volumeKey, defaultVolume);
  const isMuted = volume === 0;

  const handleSetVolume = useCallback(
    (val: number) => {
      setVolume(volumeKey, val);
    },
    [setVolume, volumeKey]
  );

  const handleToggleMute = useCallback(() => {
    toggleMute(volumeKey, defaultVolume);
  }, [toggleMute, volumeKey, defaultVolume]);

  return useMemo(
    () => ({
      volumeKey,
      volume,
      isMuted,
      setVolume: handleSetVolume,
      toggleMute: handleToggleMute
    }),
    [volumeKey, volume, isMuted, handleSetVolume, handleToggleMute]
  );
};
