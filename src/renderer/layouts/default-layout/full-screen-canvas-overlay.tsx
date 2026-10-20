import { AnimatePresence } from 'motion/react';

import { FullScreenCanvasExpanded } from '/@/renderer/features/player/components/full-screen-canvas-expanded';
import { useFullScreenPlayerStore } from '/@/renderer/store/full-screen-player.store';

export const FullScreenCanvasOverlay = () => {
    const { canvasExpanded: isFullScreenCanvasExpanded } = useFullScreenPlayerStore();

    return (
        <AnimatePresence initial={false}>
            {isFullScreenCanvasExpanded && <FullScreenCanvasExpanded />}
        </AnimatePresence>
    );
};
