/**
 * Where an album's canvas clip lives on the homelab server.
 *
 * Same route Tempo's player and the car app use: `/canvas/<albumId>.mp4`, or
 * `/canvas/<albumId>-wide.mp4` for the 16:9 variant, token as a query
 * parameter. The album id is the Navidrome one, which is the one thing every
 * client already agrees on without normalising names.
 */
export const canvasClipUrl = (
    serverUrl: string,
    token: string,
    albumId: string,
    wide: boolean,
): string => {
    const base = serverUrl.trim().replace(/\/+$/, '');
    const suffix = wide ? '-wide' : '';
    const query = token ? `?token=${encodeURIComponent(token.trim())}` : '';
    return `${base}/canvas/${encodeURIComponent(albumId)}${suffix}.mp4${query}`;
};
