import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useCanvasSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';

/**
 * Canvas clips come from the homelab work-server, which is a different box
 * from the music server and has its own token. Same two fields Tempo keeps.
 * An empty address means the Canvas tab is not shown at all.
 */
export const CanvasSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useCanvasSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateSetting = (updates: Partial<typeof settings>) => {
        setSettings({
            canvas: {
                ...settings,
                ...updates,
            },
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <TextInput
                    aria-label="Homelab server address"
                    defaultValue={settings.serverUrl}
                    onBlur={(e) => updateSetting({ serverUrl: e.currentTarget.value.trim() })}
                    placeholder="http://your-server:8766"
                    w="20rem"
                />
            ),
            description: t('setting.canvasServerUrl', { context: 'description' }),
            title: t('setting.canvasServerUrl'),
        },
        {
            control: (
                <TextInput
                    aria-label="Homelab token"
                    defaultValue={settings.token}
                    onBlur={(e) => updateSetting({ token: e.currentTarget.value.trim() })}
                    type="password"
                    w="20rem"
                />
            ),
            description: t('setting.canvasToken', { context: 'description' }),
            title: t('setting.canvasToken'),
        },
        {
            control: (
                <Switch
                    aria-label="Prefer wide canvas clips"
                    defaultChecked={settings.preferWide}
                    onChange={(e) => updateSetting({ preferWide: e.currentTarget.checked })}
                />
            ),
            description: t('setting.canvasPreferWide', { context: 'description' }),
            title: t('setting.canvasPreferWide'),
        },
    ];

    return <SettingsSection options={options} title={t('setting.canvasSettings')} />;
});

CanvasSettings.displayName = 'CanvasSettings';
