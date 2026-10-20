import type { MantineThemeOverride } from '@mantine/core';

import { generateColors } from '@mantine/colors-generator';
import { useMantineColorScheme } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import aeroShapeCss from './shapes/aero.css?inline';
import crtScanlinesCss from './shapes/crt-scanlines.css?inline';
import courierPrimeFontUrl from './shapes/courier_prime.ttf?url';
import vt323FontUrl from './shapes/vt323.ttf?url';
import pixelFontUrl from './shapes/press-start-2p.ttf?url';
import quicksandFontUrl from './shapes/quicksand.ttf?url';
import retroShapeCss from './shapes/retro.css?inline';
import typePacksCss from './shapes/type-packs.css?inline';
import zineShapeCss from './shapes/zine.css?inline';

import { useCustomThemes } from '/@/renderer/store/custom-themes.store';
import {
    useAccent,
    useCrtScanlines,
    useFontSettings,
    useNativeAspectRatio,
    useShapeStyle,
    useThemeSettings,
    useTypePack,
} from '/@/renderer/store/settings.store';
import { createMantineTheme } from '/@/renderer/themes/mantine-theme';
import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme, AppThemeConfiguration } from '/@/shared/themes/app-theme-types';
import { FontType } from '/@/shared/types/types';

export const THEME_DATA = [
    { label: 'Default Dark', type: 'dark', value: AppTheme.DEFAULT_DARK },
    { label: 'Default Light', type: 'light', value: AppTheme.DEFAULT_LIGHT },
    { label: 'Nord', type: 'dark', value: AppTheme.NORD },
    { label: 'Dracula', type: 'dark', value: AppTheme.DRACULA },
    { label: 'One Dark', type: 'dark', value: AppTheme.ONE_DARK },
    { label: 'Solarized Dark', type: 'dark', value: AppTheme.SOLARIZED_DARK },
    { label: 'Solarized Light', type: 'light', value: AppTheme.SOLARIZED_LIGHT },
    { label: 'Everforest Dark', type: 'dark', value: AppTheme.EVERFOREST_DARK },
    { label: 'Everforest Light', type: 'light', value: AppTheme.EVERFOREST_LIGHT },
    { label: 'GitHub Dark', type: 'dark', value: AppTheme.GITHUB_DARK },
    { label: 'GitHub Light', type: 'light', value: AppTheme.GITHUB_LIGHT },
    { label: 'Glassy Dark', type: 'dark', value: AppTheme.GLASSY_DARK },
    { label: 'Monokai', type: 'dark', value: AppTheme.MONOKAI },
    { label: 'High Contrast Dark', type: 'dark', value: AppTheme.HIGH_CONTRAST_DARK },
    { label: 'High Contrast Light', type: 'light', value: AppTheme.HIGH_CONTRAST_LIGHT },
    { label: 'Tokyo Night', type: 'dark', value: AppTheme.TOKYO_NIGHT },
    { label: 'Catppuccin Mocha', type: 'dark', value: AppTheme.CATPPUCCIN_MOCHA },
    { label: 'Catppuccin Latte', type: 'light', value: AppTheme.CATPPUCCIN_LATTE },
    { label: 'Gruvbox Dark', type: 'dark', value: AppTheme.GRUVBOX_DARK },
    { label: 'Gruvbox Light', type: 'light', value: AppTheme.GRUVBOX_LIGHT },
    { label: 'Night Owl', type: 'dark', value: AppTheme.NIGHT_OWL },
    { label: 'Material Dark', type: 'dark', value: AppTheme.MATERIAL_DARK },
    { label: 'Material Light', type: 'light', value: AppTheme.MATERIAL_LIGHT },
    { label: 'Ayu Dark', type: 'dark', value: AppTheme.AYU_DARK },
    { label: 'Ayu Light', type: 'light', value: AppTheme.AYU_LIGHT },
    { label: 'Shades of Purple', type: 'dark', value: AppTheme.SHADES_OF_PURPLE },
    { label: 'VS Code Dark+', type: 'dark', value: AppTheme.VSCODE_DARK_PLUS },
    { label: 'VS Code Light+', type: 'light', value: AppTheme.VSCODE_LIGHT_PLUS },
    { label: 'Rosé Pine', type: 'dark', value: AppTheme.ROSE_PINE },
    { label: 'Rosé Pine Moon', type: 'dark', value: AppTheme.ROSE_PINE_MOON },
    { label: 'Rosé Pine Dawn', type: 'light', value: AppTheme.ROSE_PINE_DAWN },
    { label: 'Zenburn', type: 'dark', value: AppTheme.ZENBURN },
    // hedgy-themes:start
    { label: 'Hedgy Aero Sky', type: 'dark', value: AppTheme.HEDGY_AERO_SKY },
    { label: 'Hedgy Arcade Amber', type: 'dark', value: AppTheme.HEDGY_ARCADE_AMBER },
    { label: 'Hedgy Deep Sea', type: 'dark', value: AppTheme.HEDGY_DEEP_SEA },
    { label: 'Hedgy Ember', type: 'dark', value: AppTheme.HEDGY_EMBER },
    { label: 'Hedgy Forest', type: 'dark', value: AppTheme.HEDGY_FOREST },
    { label: 'Hedgy Game Boy (DMG)', type: 'dark', value: AppTheme.HEDGY_GAME_BOY_DMG },
    { label: 'Hedgy GB Light', type: 'dark', value: AppTheme.HEDGY_GB_LIGHT },
    { label: 'Hedgy GB Pocket', type: 'dark', value: AppTheme.HEDGY_GB_POCKET },
    { label: 'Hedgy GBC Grape', type: 'dark', value: AppTheme.HEDGY_GBC_GRAPE },
    { label: 'Hedgy Midnight', type: 'dark', value: AppTheme.HEDGY_MIDNIGHT },
    { label: 'Hedgy Mono', type: 'dark', value: AppTheme.HEDGY_MONO },
    { label: 'Hedgy Paper (light)', type: 'light', value: AppTheme.HEDGY_PAPER_LIGHT },
    // hedgy-themes:end
];

export const useAppTheme = (overrideTheme?: AppTheme) => {
    const accent = useAccent();
    const nativeImageAspect = useNativeAspectRatio();
    const shape = useShapeStyle();
    const crtScanlines = useCrtScanlines();
    const typePack = useTypePack();
    const { builtIn, custom, system, type } = useFontSettings();
    // Not read directly, but its identity changes whenever the custom
    // themes folder is reloaded, which is what we want to react to below.
    const customThemes = useCustomThemes();
    const textStyleRef = useRef<HTMLStyleElement | null>(null);
    const themeInlineStylesRef = useRef<HTMLStyleElement | null>(null);
    const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
    const {
        followSystemTheme,
        primaryShade,
        theme,
        themeDark,
        themeLight,
        useThemeAccentColor,
        useThemePrimaryShade,
    } = useThemeSettings();

    const mqListener = (e: any) => {
        setIsDarkTheme(e.matches);
    };

    const applyInlineStylesheets = useCallback((inlineCssStrings: string[] = []) => {
        const cssText = inlineCssStrings.filter(Boolean).join('\n');

        if (!themeInlineStylesRef.current) {
            const styleEl = document.createElement('style');
            styleEl.id = 'theme-inline-styles';
            document.head.appendChild(styleEl);
            themeInlineStylesRef.current = styleEl;
        }

        themeInlineStylesRef.current.textContent = cssText;
    }, []);

    const getSelectedTheme = () => {
        if (overrideTheme) {
            return overrideTheme;
        }

        if (followSystemTheme) {
            return isDarkTheme ? themeDark : themeLight;
        }

        return theme;
    };

    const selectedTheme = getSelectedTheme();

    useEffect(() => {
        const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
        darkThemeMq.addListener(mqListener);
        return () => darkThemeMq.removeListener(mqListener);
    }, []);

    useEffect(() => {
        if (type === FontType.SYSTEM && system) {
            const root = document.documentElement;
            root.style.setProperty(
                '--theme-content-font-family',
                'dynamic-font, "Noto Sans JP", "Noto Sans Hebrew", sans-serif',
            );

            if (!textStyleRef.current) {
                textStyleRef.current = document.createElement('style');
                document.body.appendChild(textStyleRef.current);
            }

            textStyleRef.current.textContent = `
            @font-face {
                font-family: "dynamic-font";
                src: local("${system}");
            }`;
        } else if (type === FontType.CUSTOM && custom) {
            const root = document.documentElement;
            root.style.setProperty(
                '--theme-content-font-family',
                'dynamic-font, "Noto Sans JP", "Noto Sans Hebrew", sans-serif',
            );

            if (!textStyleRef.current) {
                textStyleRef.current = document.createElement('style');
                document.body.appendChild(textStyleRef.current);
            }

            // Note: we change the url to bust caches when changing the path
            // The url provided here does NOT matter, validation is done
            // on the main process. Any feishin:/ url will fetch the same
            // item, which the renderer will check via magic number to be
            // some font item
            textStyleRef.current.textContent = `
            @font-face {
                font-family: "dynamic-font";
                src: url("feishin:${custom}");
            }`;
        } else {
            const root = document.documentElement;
            root.style.setProperty(
                '--theme-content-font-family',
                `${builtIn}, "Noto Sans JP", "Noto Sans Hebrew", sans-serif`,
            );
        }
    }, [builtIn, custom, system, type]);

    const appTheme: AppThemeConfiguration = useMemo(() => {
        const themeProperties = getAppTheme(selectedTheme);

        // Use theme's primary color if useThemeAccentColor is enabled, otherwise use custom accent
        const primaryColor = useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent;

        // Use theme's primary shade if useThemePrimaryShade is enabled, otherwise use slider value (0-9)
        const effectivePrimaryShade: MantineThemeOverride['primaryShade'] = useThemePrimaryShade
            ? themeProperties.mantineOverride?.primaryShade
            : ({ dark: primaryShade, light: primaryShade } as MantineThemeOverride['primaryShade']);

        return {
            ...themeProperties,
            colors: {
                ...themeProperties.colors,
                primary: primaryColor,
            },
            mantineOverride: {
                ...themeProperties.mantineOverride,
                ...(effectivePrimaryShade != null && { primaryShade: effectivePrimaryShade }),
            },
        };
        // customThemes is not read directly above, but getAppTheme resolves
        // custom theme ids through a registry that's mutated in place
        // whenever the themes folder is reloaded (see custom-themes.store.ts).
        // Including it here is what makes an edited custom theme's colors
        // get picked up without a manual reselect.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- customThemes is read indirectly via getAppTheme's registry lookup, not referenced directly above
    }, [
        accent,
        customThemes,
        primaryShade,
        selectedTheme,
        useThemeAccentColor,
        useThemePrimaryShade,
    ]);

    useEffect(() => {
        const root = document.documentElement;
        const themeProperties = getAppTheme(selectedTheme);
        const primaryColor = useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent;
        const effectivePrimaryShade: MantineThemeOverride['primaryShade'] = useThemePrimaryShade
            ? themeProperties.mantineOverride?.primaryShade
            : ({ dark: primaryShade, light: primaryShade } as MantineThemeOverride['primaryShade']);
        const mode = themeProperties.mode ?? (isDarkTheme ? 'dark' : 'light');
        const shadeIndex = Math.min(
            9,
            Math.max(
                0,
                typeof effectivePrimaryShade === 'object'
                    ? (effectivePrimaryShade?.[mode] ?? 6)
                    : (effectivePrimaryShade ?? 6),
            ),
        );
        const primaryScale = generateColors(primaryColor);
        const primaryAtShade = primaryScale[shadeIndex];
        root.style.setProperty('--theme-colors-primary', primaryAtShade);
    }, [
        accent,
        customThemes,
        isDarkTheme,
        primaryShade,
        selectedTheme,
        useThemeAccentColor,
        useThemePrimaryShade,
    ]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-image-fit', nativeImageAspect ? 'contain' : 'cover');
    }, [nativeImageAspect]);

    // Shape overlays ride on top of whatever palette is active: the root
    // carries data-shape and one style element carries the overlay CSS,
    // which reads the palette through --theme-colors-* variables.
    useEffect(() => {
        const css = { aero: aeroShapeCss, classic: '', retro: retroShapeCss, zine: zineShapeCss }[shape];
        document.documentElement.setAttribute('data-shape', shape);

        let styleElement = document.getElementById('shape-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'shape-style';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = css;
    }, [shape]);

    // Scanlines: one class on the root; 'auto' means "with Retro CRT".
    useEffect(() => {
        const on = crtScanlines === 'on' || (crtScanlines === 'auto' && shape === 'retro');
        document.documentElement.classList.toggle('crt-scan', on);

        let styleElement = document.getElementById('crt-scanlines-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'crt-scanlines-style';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = crtScanlinesCss;
    }, [crtScanlines, shape]);

    // Type pack: data-type on the root; the pixel font's URL is a build
    // asset, so it is spliced into the stylesheet here rather than in CSS.
    useEffect(() => {
        document.documentElement.setAttribute('data-type', typePack);

        let styleElement = document.getElementById('type-pack-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'type-pack-style';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = typePacksCss
            .replace('__PIXEL_FONT_URL__', pixelFontUrl)
            .replace('__COURIER_PRIME_FONT_URL__', courierPrimeFontUrl)
            .replace('__QUICKSAND_FONT_URL__', quicksandFontUrl)
            .replace('__VT323_FONT_URL__', vt323FontUrl);
    }, [typePack]);

    useEffect(() => {
        applyInlineStylesheets(appTheme?.stylesheets ?? []);
    }, [selectedTheme, appTheme?.stylesheets, applyInlineStylesheets]);

    const themeVars = useMemo(() => {
        return Object.entries(appTheme?.app ?? {})
            .map(([key, value]) => {
                return [`--theme-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    const colorVars = useMemo(() => {
        return Object.entries(appTheme?.colors ?? {})
            .map(([key, value]) => {
                return [`--theme-colors-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', selectedTheme);

        if (themeVars.length > 0 || colorVars.length > 0) {
            let styleElement = document.getElementById('theme-variables');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'theme-variables';
                document.head.appendChild(styleElement);
            }

            let cssText = ':root {\n';

            for (const [key, value] of themeVars) {
                cssText += `  ${key}: ${value};\n`;
            }

            for (const [key, value] of colorVars) {
                cssText += `  ${key}: ${value};\n`;
            }

            cssText += '}';

            styleElement.textContent = cssText;
        }
    }, [colorVars, selectedTheme, themeVars]);

    const mantineTheme = useMemo(
        () => createMantineTheme(appTheme as AppThemeConfiguration),
        [appTheme],
    );

    return {
        mode: appTheme?.mode || 'dark',
        theme: mantineTheme,
    };
};

export const useSetColorScheme = () => {
    const { setColorScheme } = useMantineColorScheme();

    return { setColorScheme };
};

export const useColorScheme = () => {
    const { colorScheme } = useMantineColorScheme();

    return colorScheme === 'dark' ? 'dark' : 'light';
};

export const useAppThemeColors = () => {
    const accent = useAccent();
    const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [isDarkTheme] = useState(getCurrentTheme());
    // Not read directly, but its identity changes whenever the custom
    // themes folder is reloaded, which is what we want to react to below.
    const customThemes = useCustomThemes();
    const {
        followSystemTheme,
        primaryShade,
        theme,
        themeDark,
        themeLight,
        useThemeAccentColor,
        useThemePrimaryShade,
    } = useThemeSettings();

    const getSelectedTheme = () => {
        if (followSystemTheme) {
            return isDarkTheme ? themeDark : themeLight;
        }

        return theme;
    };

    const selectedTheme = getSelectedTheme();

    const appTheme: AppThemeConfiguration = useMemo(() => {
        const themeProperties = getAppTheme(selectedTheme);

        // Use theme's primary color if useThemeAccentColor is enabled, otherwise use custom accent
        const primaryColor = useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent;

        // Use theme's primary shade if useThemePrimaryShade is enabled, otherwise use slider value (0-9)
        const effectivePrimaryShade: MantineThemeOverride['primaryShade'] = useThemePrimaryShade
            ? themeProperties.mantineOverride?.primaryShade
            : ({ dark: primaryShade, light: primaryShade } as MantineThemeOverride['primaryShade']);

        return {
            ...themeProperties,
            colors: {
                ...themeProperties.colors,
                primary: primaryColor,
            },
            mantineOverride: {
                ...themeProperties.mantineOverride,
                ...(effectivePrimaryShade != null && { primaryShade: effectivePrimaryShade }),
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- customThemes is read indirectly via getAppTheme's registry lookup, not referenced directly above
    }, [
        accent,
        customThemes,
        primaryShade,
        selectedTheme,
        useThemeAccentColor,
        useThemePrimaryShade,
    ]);

    const themeVars = useMemo(() => {
        return Object.entries(appTheme?.app ?? {})
            .map(([key, value]) => {
                return [`--theme-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    const colorVars = useMemo(() => {
        return Object.entries(appTheme?.colors ?? {})
            .map(([key, value]) => {
                return [`--theme-colors-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    return {
        color: Object.fromEntries(colorVars),
        theme: Object.fromEntries(themeVars),
    };
};
