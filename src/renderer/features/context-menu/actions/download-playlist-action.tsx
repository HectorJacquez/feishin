import isElectron from 'is-electron';
import { useCallback } from 'react';

import { api } from '/@/renderer/api';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Playlist } from '/@/shared/types/domain-types';

interface DownloadPlaylistActionProps {
    items: Playlist[];
}

const utils = isElectron() ? window.api.utils : null;

export const DownloadPlaylistAction = ({ items }: DownloadPlaylistActionProps) => {
    const server = useCurrentServer();

    const onSelect = useCallback(async () => {
        if (!utils || items.length !== 1) return;

        const playlist = items[0]!;

        try {
            const songList = await api.controller.getPlaylistSongList({
                apiClientProps: { serverId: server.id },
                query: { id: playlist.id },
            });

            if (!songList?.items?.length) return;

            const songs = songList.items.map((song, i) => {
                const ext = song.container || 'mp3';
                const track = String(i + 1).padStart(2, '0');
                const artist = song.artistName || 'Unknown';
                const title = song.name || 'Unknown';
                const filename = `${track} - ${artist} - ${title}.${ext}`
                    .replace(/[<>:"/\\|?*]/g, '_');

                return {
                    filename,
                    url: api.controller.getDownloadUrl({
                        apiClientProps: { serverId: server.id },
                        query: { id: song.id },
                    }),
                };
            });

            const name = playlist.name.replace(/[<>:"/\\|?*]/g, '_');
            await utils.downloadPlaylistZip({ name, songs });
        } catch (error) {
            console.error('Failed to download playlist:', error);
        }
    }, [items, server]);

    return (
        <ContextMenu.Item
            disabled={!isElectron() || items.length !== 1}
            leftIcon="download"
            onSelect={onSelect}
        >
            Download as Zip
        </ContextMenu.Item>
    );
};
