import { usePlaybackType } from '/@/renderer/store';
import { IS_POPOUT } from '/@/shared/utils/is-popout';
import { PlayerType } from '/@/shared/types/types';

// Audio plays in the main window, so the popout can only reach it through system
// loopback capture — the same path LOCAL playback uses. Reporting LOCAL here keeps that
// branch active without changing playback semantics anywhere outside the visualizer.
export const useVisualizerPlaybackType = () => {
    const playbackType = usePlaybackType();
    return IS_POPOUT ? PlayerType.LOCAL : playbackType;
};
