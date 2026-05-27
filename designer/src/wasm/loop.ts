export type OdinRenderLoop = {
    requestRender: () => void;
    start: () => void;
    stop: () => void;
};

export function createOdinRenderLoop(
    render: () => boolean,
): OdinRenderLoop {
    let running = false;
    let dirty = true;
    let animationFrameId = 0;

    function frame() {
        if (!running) {
            return;
        }

        if (dirty) {
            dirty = false;
            render();
        }

        animationFrameId = requestAnimationFrame(frame);
    }

    return {
        requestRender() {
            dirty = true;
        },

        start() {
            if (running) {
                return;
            }

            running = true;
            dirty = true;
            animationFrameId = requestAnimationFrame(frame);
        },

        stop() {
            running = false;

            if (animationFrameId !== 0) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
        },
    };
}
