import clsx from 'clsx';
import { motion, Variants } from 'motion/react';
import {
    lazy,
    memo,
    ReactNode,
    Suspense,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useLocation } from 'react-router';

import styles from './full-screen-visualizer.module.css';

import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { FullScreenVisualizerSongInfo } from '/@/renderer/features/player/components/full-screen-visualizer-song-info';
import { openFullScreenPlayerSettingsModal } from '/@/renderer/features/player/utils/open-full-screen-player-settings-modal';
import { VISUALIZER_FULLSCREEN_TARGET_ID } from '/@/renderer/hooks/use-fullscreen-toggle';
import { useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import {
    usePlaybackSettings,
    useSettingsStore,
    useWindowSettings,
} from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Platform } from '/@/shared/types/types';

const AudioMotionAnalyzerVisualizer = lazy(() =>
    import('../../visualizer/components/audiomotionanalyzer/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const ButterchurnVisualizer = lazy(() =>
    import('../../visualizer/components/butternchurn/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const containerVariants: Variants = {
    closed: {
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
        y: '100%',
    },
    open: {
        transition: {
            delay: 0.1,
            duration: 0.5,
            ease: 'easeInOut',
        },
        y: 0,
    },
};

interface VisualizerContainerProps {
    children: ReactNode;
    immersive?: boolean;
    isMobile?: boolean;
    windowBarStyle: Platform;
}

export const VisualizerContainer = memo(
    ({ children, immersive, isMobile, windowBarStyle }: VisualizerContainerProps) => {
        const hasWindowBar =
            windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS;
        return (
            <motion.div
                animate="open"
                className={clsx(styles.container, {
                    [styles.containerImmersive]: immersive,
                    [styles.mobileContainer]: isMobile,
                    [styles.mobileContainerWithWindowBar]: isMobile && hasWindowBar,
                })}
                exit="closed"
                initial="closed"
                transition={{ duration: 2 }}
                variants={containerVariants}
            >
                {children}
            </motion.div>
        );
    },
);

VisualizerContainer.displayName = 'VisualizerContainer';

export const FullScreenVisualizer = () => {
    const { setStore } = useFullScreenPlayerStoreActions();
    const { visualizerLyricsOverlay, visualizerReturnToPlayer } = useFullScreenPlayerStore();
    const { windowBarStyle } = useWindowSettings();
    const { webAudio } = usePlaybackSettings();
    const visualizerType = useSettingsStore((store) => store.visualizer.type);
    const isMobile = useIsMobile();
    const [immersive, setImmersive] = useState(false);

    const location = useLocation();
    const isOpenedRef = useRef<boolean | null>(null);

    const handleCloseVisualizer = () => {
        if (document.fullscreenElement) return;

        if (immersive) {
            setImmersive(false);
            return;
        }

        setStore({
            expanded: visualizerReturnToPlayer,
            visualizerExpanded: false,
            visualizerReturnToPlayer: false,
        });
    };

    const handleToggleLyricsOverlay = () => {
        setStore({ visualizerLyricsOverlay: !visualizerLyricsOverlay });
    };

    const handleToggleImmersive = useCallback(() => {
        setImmersive((prev) => !prev);
    }, []);

    useHotkeys([['Escape', handleCloseVisualizer]]);

    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    useLayoutEffect(() => {
        if (isOpenedRef.current !== null) {
            setStore({ visualizerExpanded: false, visualizerReturnToPlayer: false });
        }

        isOpenedRef.current = true;
    }, [location, setStore]);

    return (
        <VisualizerContainer immersive={immersive} isMobile={isMobile} windowBarStyle={windowBarStyle}>
            <div
                className={styles.visualizerContainer}
                id={VISUALIZER_FULLSCREEN_TARGET_ID}
            >
                {webAudio ? (
                    <Suspense fallback={<></>}>
                        {visualizerType === 'butterchurn' ? (
                            <ButterchurnVisualizer />
                        ) : (
                            <AudioMotionAnalyzerVisualizer />
                        )}
                    </Suspense>
                ) : null}
                <FullScreenVisualizerSongInfo />
                {visualizerLyricsOverlay && (
                    <div className={styles.lyricsOverlay}>
                        <Lyrics fadeOutNoLyricsMessage />
                    </div>
                )}
                <Group className={styles.controlsContainer} gap="sm" p="0.5rem">
                    <ActionIcon
                        icon="arrowDownS"
                        iconProps={{ size: 'lg' }}
                        onClick={handleCloseVisualizer}
                        tooltip={{ label: 'Minimize' }}
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="settings2"
                        iconProps={{ size: 'lg' }}
                        onClick={openFullScreenPlayerSettingsModal}
                        tooltip={{ label: 'Settings' }}
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="microphone"
                        iconProps={{ size: 'lg' }}
                        onClick={handleToggleLyricsOverlay}
                        tooltip={{ label: 'Lyrics overlay' }}
                        variant={visualizerLyricsOverlay ? 'filled' : 'subtle'}
                    />
                    <ActionIcon
                        icon={immersive ? 'shrink' : 'expand'}
                        iconProps={{ size: 'lg' }}
                        onClick={handleToggleImmersive}
                        tooltip={{ label: immersive ? 'Show controls' : 'Immersive' }}
                        variant="subtle"
                    />
                </Group>
            </div>
        </VisualizerContainer>
    );
};
