import { IconButton } from '@sharkord/ui';
import { Monitor, MonitorOff, Video, VideoOff } from 'lucide-react';
import { memo } from 'react';

type TStreamToggleButtonProps = {
  isDisabled: boolean;
  kind: 'video' | 'screen';
  onToggle: () => void;
};

const StreamToggleButton = memo(
  ({ isDisabled, kind, onToggle }: TStreamToggleButtonProps) => {
    const icons =
      kind === 'video'
        ? { enabled: Video, disabled: VideoOff }
        : { enabled: Monitor, disabled: MonitorOff };

    const labels =
      kind === 'video'
        ? { enable: 'Enable video', disable: 'Disable video' }
        : { enable: 'Enable screen', disable: 'Disable screen' };

    return (
      <IconButton
        variant={isDisabled ? 'destructive' : 'ghost'}
        icon={isDisabled ? icons.disabled : icons.enabled}
        onClick={onToggle}
        title={isDisabled ? labels.enable : labels.disable}
        size="sm"
      />
    );
  }
);

StreamToggleButton.displayName = 'StreamToggleButton';

export { StreamToggleButton };
