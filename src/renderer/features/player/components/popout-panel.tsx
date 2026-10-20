import clsx from 'clsx';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './popout-panel.module.css';

import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { FullScreenCanvas } from '/@/renderer/features/player/components/full-screen-canvas';
import { FullScreenSimilarSongs } from '/@/renderer/features/player/components/full-screen-similar-songs';
import { useVisualizerSystemAudio } from '/@/renderer/features/player/hooks/use-visualizer-system-audio';
import {
    useCanvasSettings,
    usePlaybackSettings,
    useSettingsStore,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { ItemListKey } from '/@/shared/types/types';

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

const moduleContentVariants: Variants = {
    animate: {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    initial: {
        opacity: 0,
    },
};

interface ControlItem {
    active: boolean;
    icon: keyof typeof AppIcon;
    label: string;
    onClick: () => void;
}

const FALLBACK_TAB = 'lyrics';
const CONTROLS_HIDE_MS = 2500;

function readInitialTab(): string {
    try {
        const raw = window.localStorage.getItem('store_full_screen_player');
        const activeTab = raw ? JSON.parse(raw)?.state?.activeTab : undefined;
        return typeof activeTab === 'string' && activeTab ? activeTab : FALLBACK_TAB;
    } catch {
        return FALLBACK_TAB;
    }
}

export const PopoutPanel = () => {
    const { t } = useTranslation();
    const { webAudio } = usePlaybackSettings();
    const visualizerType = useSettingsStore((store) => store.visualizer.type);
    const canvasServerUrl = useCanvasSettings().serverUrl;
    const canvasEnabled = canvasServerUrl.trim().length > 0;
    // Seeded from whatever the main window is showing, then left alone: each popout keeps
    // its own tab so separate windows can show different things at once.
    const [activeTab, setActiveTab] = useState(readInitialTab);

    useVisualizerSystemAudio({
        shouldAttemptConnection: activeTab === 'visualizer',
    });

    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isHoveringBarRef = useRef(false);

    const scheduleHide = useCallback(() => {
        clearTimeout(hideTimerRef.current);
        if (isHoveringBarRef.current) return;
        hideTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
    }, []);

    useEffect(() => {
        const reveal = () => {
            setControlsVisible(true);
            scheduleHide();
        };

        reveal();
        window.addEventListener('mousemove', reveal);

        return () => {
            window.removeEventListener('mousemove', reveal);
            clearTimeout(hideTimerRef.current);
        };
    }, [scheduleHide]);

    const handleBarEnter = () => {
        isHoveringBarRef.current = true;
        clearTimeout(hideTimerRef.current);
        setControlsVisible(true);
    };

    const handleBarLeave = () => {
        isHoveringBarRef.current = false;
        scheduleHide();
    };

    const toggleTab = (tab: string) => {
        setActiveTab((prev) => (prev === tab ? FALLBACK_TAB : tab));
    };

    const headerItems = useMemo(() => {
        const items: ControlItem[] = [
            {
                active: activeTab === 'queue',
                icon: 'queue',
                label: t('page.fullscreenPlayer.upNext'),
                onClick: () => toggleTab('queue'),
            },
            {
                active: activeTab === 'related',
                icon: 'related',
                label: t('page.fullscreenPlayer.related'),
                onClick: () => toggleTab('related'),
            },
            {
                active: activeTab === 'lyrics',
                icon: 'microphone',
                label: t('page.fullscreenPlayer.lyrics'),
                onClick: () => toggleTab('lyrics'),
            },
        ];

        if (webAudio) {
            items.push({
                active: activeTab === 'visualizer',
                icon: 'audioLines',
                label: t('page.fullscreenPlayer.visualizer'),
                onClick: () => toggleTab('visualizer'),
            });
        }

        if (canvasEnabled) {
            items.push({
                active: activeTab === 'canvas',
                icon: 'image',
                label: t('page.fullscreenPlayer.canvas'),
                onClick: () => toggleTab('canvas'),
            });
        }

        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, canvasEnabled, t, webAudio]);

    return (
        <div className={styles.container}>
            <Group
                className={clsx(styles.tabBar, {
                    [styles.tabBarVisible]: controlsVisible,
                })}
                gap="xs"
                onMouseEnter={handleBarEnter}
                onMouseLeave={handleBarLeave}
                p="0.5rem"
            >
                {headerItems.map((item) => (
                    <ActionIcon
                        icon={item.icon}
                        iconProps={{
                            color: item.active ? 'primary' : undefined,
                            size: 'lg',
                        }}
                        key={`tab-${item.label}`}
                        onClick={item.onClick}
                        tooltip={{ label: item.label }}
                        variant="subtle"
                    />
                ))}
            </Group>
            <div className={styles.content}>
                <AnimatePresence initial={false} mode="wait">
                    {activeTab === 'queue' ? (
                        <motion.div
                            animate="animate"
                            className={styles.tabContent}
                            exit="exit"
                            initial="initial"
                            key="queue"
                            variants={moduleContentVariants}
                        >
                            <PlayQueue
                                enableScrollShadow={false}
                                listKey={ItemListKey.FULL_SCREEN}
                                searchTerm={undefined}
                            />
                        </motion.div>
                    ) : activeTab === 'related' ? (
                        <motion.div
                            animate="animate"
                            className={styles.tabContent}
                            exit="exit"
                            initial="initial"
                            key="related"
                            variants={moduleContentVariants}
                        >
                            <FullScreenSimilarSongs />
                        </motion.div>
                    ) : activeTab === 'lyrics' ? (
                        <motion.div
                            animate="animate"
                            className={styles.tabContent}
                            exit="exit"
                            initial="initial"
                            key="lyrics"
                            variants={moduleContentVariants}
                        >
                            <Lyrics fadeOutNoLyricsMessage={false} settingsKey="popout" />
                        </motion.div>
                    ) : activeTab === 'visualizer' && webAudio ? (
                        <motion.div
                            animate="animate"
                            className={styles.tabContent}
                            exit="exit"
                            initial="initial"
                            key="visualizer"
                            variants={moduleContentVariants}
                        >
                            <Suspense fallback={<></>}>
                                {visualizerType === 'butterchurn' ? (
                                    <ButterchurnVisualizer />
                                ) : (
                                    <AudioMotionAnalyzerVisualizer />
                                )}
                            </Suspense>
                        </motion.div>
                    ) : activeTab === 'canvas' ? (
                        <motion.div
                            animate="animate"
                            className={styles.tabContent}
                            exit="exit"
                            initial="initial"
                            key="canvas"
                            variants={moduleContentVariants}
                        >
                            <FullScreenCanvas />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
};
