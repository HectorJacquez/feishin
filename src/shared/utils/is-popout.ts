export const IS_POPOUT =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('popout') === 'panel';
