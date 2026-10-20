import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import styles from './full-screen-visualizer.module.css';

import { FullScreenCanvas } from '/@/renderer/features/player/components/full-screen-canvas';
import { VisualizerContainer } from '/@/renderer/features/player/components/full-screen-visualizer';
import { FullScreenVisualizerSongInfo } from '/@/renderer/features/player/components/full-screen-visualizer-song-info';
import { useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { useFullScreenPlayerStoreActions } from '/@/renderer/store/full-screen-player.store';
import { useWindowSettings } from '/@/renderer/store/settings.store';

/**
 * The canvas clip taking the whole window, the way the visualizer can.
 * Same container, same Escape-to-close, same close-on-navigation; only the
 * content differs.
 */
export const FullScreenCanvasExpanded = () => {
    const { setStore } = useFullScreenPlayerStoreActions();
    const { windowBarStyle } = useWindowSettings();
    const isMobile = useIsMobile();

    const location = useLocation();
    const isOpenedRef = useRef<boolean | null>(null);

    const handleClose = () => {
        setStore({ canvasExpanded: false });
    };

    useHotkeys([['Escape', handleClose]]);

    useLayoutEffect(() => {
        if (isOpenedRef.current !== null) {
            setStore({ canvasExpanded: false });
        }

        isOpenedRef.current = true;
    }, [location, setStore]);

    return (
        <VisualizerContainer isMobile={isMobile} windowBarStyle={windowBarStyle}>
            <div className={styles.visualizerContainer}>
                <FullScreenCanvas overlay />
                <FullScreenVisualizerSongInfo />
            </div>
        </VisualizerContainer>
    );
};
