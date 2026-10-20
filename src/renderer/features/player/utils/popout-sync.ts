import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { setTimestamp, useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { PlayerStatus } from '/@/shared/types/types';

const CHANNEL_NAME = 'feishin-popout-sync';
const TICK_MS = 250;

interface Tick {
    status: PlayerStatus;
    timestamp: number;
    type: 'tick';
}

// `status` is deliberately excluded from the player store's persisted state, and the
// timestamp lives in IndexedDB, which fires no cross-window events. Neither reaches the
// popout on its own, so the main window pushes both over a BroadcastChannel.
export function startPopoutBroadcast() {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    const interval = setInterval(() => {
        channel.postMessage({
            status: usePlayerStoreBase.getState().player.status,
            timestamp: useTimestampStoreBase.getState().timestamp,
            type: 'tick',
        } satisfies Tick);
    }, TICK_MS);

    return () => {
        clearInterval(interval);
        channel.close();
    };
}

export function startPopoutReceive() {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<Tick>) => {
        const data = event.data;
        if (data?.type !== 'tick') return;

        setTimestamp(data.timestamp);

        if (usePlayerStoreBase.getState().player.status !== data.status) {
            usePlayerStoreBase.setState((state) => {
                state.player.status = data.status;
            });
        }
    };

    // Bulk state (current song, queue) does persist, so a write in the main window shows
    // up here as a storage event; rehydrating pulls it into this window's store.
    const handleStorage = (event: StorageEvent) => {
        if (event.key === 'player-store') {
            void usePlayerStoreBase.persist.rehydrate();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        channel.close();
        window.removeEventListener('storage', handleStorage);
    };
}
