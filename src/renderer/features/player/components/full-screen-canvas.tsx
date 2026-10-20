import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './full-screen-canvas.module.css';

import { canvasClipUrl } from '/@/renderer/features/player/utils/canvas-clip';
import { useCanvasSettings, usePlayerSong } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';

interface FullScreenCanvasProps {
    /** True when rendered inside the whole-window overlay rather than the tab. */
    overlay?: boolean;
}

/**
 * The album's canvas clip, played behind nothing: this is the whole tab.
 *
 * Clips come from the homelab server, not from the music server, keyed by
 * the Navidrome album id the song already carries. The wide (16:9) variant
 * is asked for first because this window is landscape; the server answers
 * 404 until one has been rendered, in which case the portrait clip is
 * tried, and if that is missing too the tab says so instead of showing a
 * broken player. A miss is the normal case for most albums, so it is quiet.
 */
export const FullScreenCanvas = memo(({ overlay }: FullScreenCanvasProps) => {
    const { t } = useTranslation();
    const song = usePlayerSong();
    const settings = useCanvasSettings();
    const { canvasExpanded } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();

    // Same move as the visualizer's expand button: leave the full-screen
    // player and take the whole window, or come back.
    const handleToggleFullscreen = () => {
        setStore({ canvasExpanded: !canvasExpanded, expanded: false });
    };

    const expandButton = (
        <Group
            className={styles.iconGroup}
            gap="xs"
            pos="absolute"
            right="var(--theme-spacing-sm)"
            top="var(--theme-spacing-sm)"
        >
            <ActionIcon
                icon="expand"
                iconProps={{ size: 'lg' }}
                onClick={handleToggleFullscreen}
                variant="subtle"
            />
        </Group>
    );

    const albumId = song?.albumId;
    const [variant, setVariant] = useState<'none' | 'portrait' | 'wide'>(
        settings.preferWide ? 'wide' : 'portrait',
    );

    // A new album starts the search over, from the preferred variant.
    useEffect(() => {
        setVariant(settings.preferWide ? 'wide' : 'portrait');
    }, [albumId, settings.preferWide]);

    const src = useMemo(() => {
        if (!albumId || variant === 'none') return undefined;
        return canvasClipUrl(settings.serverUrl, settings.token, albumId, variant === 'wide');
    }, [albumId, settings.serverUrl, settings.token, variant]);

    const handleError = () => {
        // Wide missing: fall back to portrait. Portrait missing: give up.
        setVariant((current) => (current === 'wide' ? 'portrait' : 'none'));
    };

    const containerClass = overlay ? styles.containerOverlay : styles.container;

    if (!settings.serverUrl) {
        return (
            <div className={containerClass}>
                <Text className={styles.message}>{t('page.fullscreenPlayer.canvasNotConfigured')}</Text>
                {expandButton}
            </div>
        );
    }

    if (!src) {
        return (
            <div className={containerClass}>
                <Text className={styles.message}>{t('page.fullscreenPlayer.canvasNotFound')}</Text>
                {expandButton}
            </div>
        );
    }

    return (
        <div className={containerClass}>
            <video
                autoPlay
                className={variant === 'wide' ? styles.videoWide : styles.videoPortrait}
                disablePictureInPicture
                key={src}
                loop
                muted
                onError={handleError}
                playsInline
                src={src}
            />
            {expandButton}
        </div>
    );
});

FullScreenCanvas.displayName = 'FullScreenCanvas';
