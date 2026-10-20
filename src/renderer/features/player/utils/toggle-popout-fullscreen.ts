// The popout is already its own window, so "expand" there means native fullscreen for
// that window rather than the main window's expanded-visualizer overlay, which this
// process does not render.
export function togglePopoutFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        return;
    }

    document.documentElement.requestFullscreen().catch(() => {});
}
