import type { Rect } from "../editor/geometry";
import type { Rgba } from "../editor/document";
import type { WebGpuState } from "./webgpu";

export type GpuRect = {
    rect: Rect;
    color: Rgba;
};

export type RectRenderer = {
    render: (
        pass: GPURenderPassEncoder,
        rects: GpuRect[],
        canvasWidth: number,
        canvasHeight: number,
    ) => void;
};

export function createRectRenderer(gpu: WebGpuState): RectRenderer {
    const shaderModule = gpu.device.createShaderModule({
        label: "Rect Shader",
        code: RECT_SHADER,
    });

    const pipeline = gpu.device.createRenderPipeline({
        label: "Rect Pipeline",
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
            buffers: [
                {
                    arrayStride: 6 * 4,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x2",
                        },
                        {
                            shaderLocation: 1,
                            offset: 2 * 4,
                            format: "float32x4"
                        }
                    ],
                }
            ],
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [
                {
                    format: gpu.format,
                }
            ],
        },
        primitive: {
            topology: "triangle-list",
        }
    });

    function render(
        pass: GPURenderPassEncoder,
        rects: GpuRect[],
        canvasWidth: number,
        canvasHeight: number,
    ) {
        if (rects.length === 0) {
            return;
        }

        const vertices: number[] = [];
        for (const rect of rects) {
            pushRectVertices(vertices, rect, canvasWidth, canvasHeight);
        }

        const vertexData = new Float32Array(vertices);

        const vertexBuffer = gpu.device.createBuffer({
            label: "Rect Vertex Buffer",
            size: vertexData.byteLength,
            // @ts-ignore
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        gpu.device.queue.writeBuffer(vertexBuffer, 0, vertexData);

        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(vertexData.length / 6);
    }

    return {
        render,
    };
}

function screenToClip(
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number
): { x: number; y: number } {
    return {
        x: (x / canvasWidth) * 2 - 1,
        y: 1 - (y / canvasHeight) * 2,
    };
}

function pushRectVertices(
    vertices: number[],
    gpuRect: GpuRect,
    canvasWidth: number,
    canvasHeight: number,
) {
    const { rect, color } = gpuRect;

    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.width;
    const y1 = rect.y + rect.height;

    const p0 = screenToClip(x0, y0, canvasWidth, canvasHeight);
    const p1 = screenToClip(x0, y1, canvasWidth, canvasHeight);
    const p2 = screenToClip(x1, y0, canvasWidth, canvasHeight);
    const p3 = screenToClip(x1, y1, canvasWidth, canvasHeight);

    // NOTE: triangle 1: top-left, bottom-left, top-right
    pushVertex(vertices, p0.x, p0.y, color);
    pushVertex(vertices, p1.x, p1.y, color);
    pushVertex(vertices, p2.x, p2.y, color);

    // NOTE: triangle 2: top-right, bottom-left, bottom-right
    pushVertex(vertices, p2.x, p2.y, color);
    pushVertex(vertices, p1.x, p1.y, color);
    pushVertex(vertices, p3.x, p3.y, color);
}

function pushVertex(vertices: number[], x: number, y: number, color: Rgba) {
    vertices.push(x, y, color.r, color.g, color.b, color.a);
}

const RECT_SHADER = `
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) color: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(input.position, 0.0, 1.0);
  output.color = input.color;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
`;
