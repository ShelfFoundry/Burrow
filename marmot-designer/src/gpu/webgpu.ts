export type WebGpuState = {
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
};

export type FrameState = {
    encoder: GPUCommandEncoder;
    pass: GPURenderPassEncoder;
}


export async function initWebGpu(canvas: HTMLCanvasElement): Promise<WebGpuState> {
    if (!navigator.gpu) {
        throw new Error("WebGPU is not available in this browser");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No suitabale GPU adapter found");
    }

    const device = await adapter.requestDevice();

    const context = canvas.getContext("webgpu") as GPUCanvasContext;
    if (!context) {
        throw new Error("Could not get WebGPU cnavas context");
    }

    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: "opaque",
    });

    return {
        adapter,
        device,
        context,
        format,
    };
}

export function beginFrame(state: WebGpuState): FrameState {
    const textureView = state.context.getCurrentTexture().createView();
    const encoder = state.device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: textureView,
                clearValue: {
                    r: 0.16,
                    g: 0.17,
                    b: 0.18,
                    a: 1.0,
                },
                loadOp: "clear",
                storeOp: "store",
            },
        ],
    });

    return {
        encoder,
        pass,
    };
}

export function endFrame(
    state: WebGpuState,
    frame: FrameState,
): void {
    frame.pass.end();
    const commandBuffer = frame.encoder.finish();
    state.device.queue.submit([commandBuffer]);
}

export function clearFrame(state: WebGpuState): void {
    const textureView = state.context.getCurrentTexture().createView();
    const commandEncoder = state.device.createCommandEncoder();

    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: textureView,
                clearValue: {
                    r: 1.0,
                    g: 0.13,
                    b: 0.15,
                    a: 1.0,
                },
                loadOp: "clear",
                storeOp: "store",
            }
        ]
    });
    renderPass.end();

    const commandBuffer = commandEncoder.finish();

    state.device.queue.submit([commandBuffer]);
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
    const devicePixelRatio = window.devicePixelRatio || 1;

    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * devicePixelRatio));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * devicePixelRatio));

    const needsResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needsResize) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needsResize;
}
