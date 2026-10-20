import isElectron from 'is-electron';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';

import { useAppTracker } from '/@/renderer/features/analytics/hooks/use-app-tracker';
import { CommandPalette } from '/@/renderer/features/search/components/command-palette';
import { useGarbageCollection } from '/@/renderer/hooks/use-garbage-collection';
import { HotkeyItem, useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { DefaultLayout } from '/@/renderer/layouts/default-layout';
import { MobileLayout } from '/@/renderer/layouts/mobile-layout/mobile-layout';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCommandPaletteState,
    useLayoutHotkeyBindings,
    useSettingsStoreActions,
    useZoomFactor,
    useZoomPerDisplay,
} from '/@/renderer/store';

interface ResponsiveLayoutProps {
    shell?: boolean;
}

const ResponsiveLayoutBase = ({ shell }: ResponsiveLayoutProps) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileLayout shell={shell} />;
    }

    return <DefaultLayout shell={shell} />;
};

export const ResponsiveLayout = ({ shell }: ResponsiveLayoutProps) => {
    useAppTracker();

    return (
        <>
            <ResponsiveLayoutBase shell={shell} />
            <LayoutHotkeys />
            <GarbageCollection />
        </>
    );
};

const localSettings = isElectron() ? window.api.localSettings : null;

const LayoutHotkeys = () => {
    const navigate = useNavigate();
    const zoomFactor = useZoomFactor();
    const zoomPerDisplay = useZoomPerDisplay();
    const { setSettings } = useSettingsStoreActions();
    const bindings = useLayoutHotkeyBindings();
    const { close, open, opened, toggle } = useCommandPaletteState();
    const isSmallDisplayRef = useRef(false);

    const handlers = useMemo(
        () => ({
            close,
            open,
            toggle,
        }),
        [close, open, toggle],
    );

    const updateZoom = useCallback(
        (increase: number) => {
            const newVal = zoomFactor + increase;
            if (newVal > 300 || newVal < 50 || !localSettings) return;

            setSettings({
                general: {
                    zoomFactor: newVal,
                },
            });
            if (!isSmallDisplayRef.current || !zoomPerDisplay.enabled) {
                localSettings?.setZoomFactor(newVal);
            }
        },
        [setSettings, zoomFactor, zoomPerDisplay.enabled],
    );

    useEffect(() => {
        if (localSettings) {
            if (isSmallDisplayRef.current && zoomPerDisplay.enabled) {
                localSettings.setZoomFactor(zoomPerDisplay.zoomFactor);
            } else {
                localSettings.setZoomFactor(zoomFactor);
            }
        }
    }, [zoomFactor, zoomPerDisplay]);

    useEffect(() => {
        if (!localSettings) return undefined;
        const cleanup = localSettings.onDisplayChanged((info) => {
            const isSmall = info.width <= zoomPerDisplay.widthThreshold;
            isSmallDisplayRef.current = isSmall;
            if (zoomPerDisplay.enabled && isSmall) {
                localSettings.setZoomFactor(zoomPerDisplay.zoomFactor);
            } else {
                localSettings.setZoomFactor(zoomFactor);
            }
        });
        return cleanup;
    }, [zoomFactor, zoomPerDisplay]);

    const hotkeys = useMemo<HotkeyItem[]>(
        () => [
            [bindings.globalSearch.hotkey, open],
            [bindings.browserBack.hotkey, () => navigate(-1)],
            [bindings.browserForward.hotkey, () => navigate(1)],
            [bindings.navigateHome.hotkey, () => navigate(AppRoute.HOME)],
            ...(localSettings
                ? ([
                      [bindings.zoomIn.hotkey, () => updateZoom(5)],
                      [bindings.zoomOut.hotkey, () => updateZoom(-5)],
                  ] as HotkeyItem[])
                : []),
        ],
        [bindings, navigate, open, updateZoom],
    );

    const modalProps = useMemo(
        () => ({
            handlers,
            opened,
        }),
        [handlers, opened],
    );

    useHotkeys(hotkeys);

    return <CommandPalette modalProps={modalProps} />;
};

const GarbageCollection = () => {
    useGarbageCollection();
    return null;
};
