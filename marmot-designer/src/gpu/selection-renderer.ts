import type { Rgba, Selection } from "../editor/document";
import type {
    PagePlacement,
    Rect,
    ViewportTransform,
} from "../editor/geometry";
import { pageRectToScreen } from "../editor/geometry";
import type { GpuRect } from "./rect-renderer";
import { getResizeHandlesForScreenRect, squareRectFromCenter } from "../editor/handles";

const SELECTION_COLOR: Rgba = {
    r: 0.2,
    g: 0.55,
    b: 1.0,
    a: 1.0,
};
const SELECTION_OUTLINE_WIDTH = 2;
const HANDLE_SIZE = 8;
const HANDLE_FILL_COLOR: Rgba = {
    r: 1,
    g: 1,
    b: 1,
    a: 1,
};
const HANDLE_STROKE_COLOR = SELECTION_COLOR;
const HANDLE_STROKE_WIDTH = 2;

export type SelectionRenderInput = {
    selection: Selection;
    selectedBounds: Rect | undefined;
    pagePlacement: PagePlacement;
    transform: ViewportTransform;
};

export type SelectionRenderer = {
    buildRects: (input: SelectionRenderInput) => GpuRect[];
};

export function createSelectionRenderer(): SelectionRenderer {
    function buildRects(input: SelectionRenderInput): GpuRect[] {
        if (input.selection.kind === "none") {
            return [];
        }
        if (!input.selectedBounds) {
            return [];
        }
        const screenBounds = pageRectToScreen(
            input.selectedBounds,
            input.pagePlacement,
            input.transform,
        );
        const outlineRects = buildScreenStrokeRects(
            screenBounds,
            SELECTION_OUTLINE_WIDTH,
            SELECTION_COLOR,
        );
        const handleRects = buildHandleRects(screenBounds);
        return [...outlineRects, ...handleRects];
    }

    return {
        buildRects,
    };
}

function buildScreenStrokeRects(
    rect: Rect,
    strokeWidth: number,
    color: Rgba,
): GpuRect[] {
    const half = strokeWidth / 2;
    return [
        // top
        {
            rect: {
                x: rect.x - half,
                y: rect.y - half,
                width: rect.width + strokeWidth,
                height: strokeWidth,
            },
            color,
        },
        // right
        {
            rect: {
                x: rect.x + rect.width - half,
                y: rect.y - half,
                width: strokeWidth,
                height: rect.height + strokeWidth,
            },
            color,
        },
        // bottom
        {
            rect: {
                x: rect.x - half,
                y: rect.y + rect.height - half,
                width: rect.width + strokeWidth,
                height: strokeWidth,
            },
            color,
        },
        // left
        {
            rect: {
                x: rect.x - half,
                y: rect.y - half,
                width: strokeWidth,
                height: rect.height + strokeWidth,
            },
            color,
        },
    ];
}

function buildHandleRects(screenBounds: Rect): GpuRect[] {
    const handles = getResizeHandlesForScreenRect(screenBounds);
    const rects: GpuRect[] = [];

    for (const handle of handles) {
        const outer = squareRectFromCenter(handle.x, handle.y, HANDLE_SIZE);
        const inner = squareRectFromCenter(
            handle.x,
            handle.y,
            Math.max(1, HANDLE_SIZE - HANDLE_STROKE_WIDTH * 2),
        );
        rects.push(
            {
                rect: outer,
                color: HANDLE_STROKE_COLOR,
            },
            {
                rect: inner,
                color: HANDLE_FILL_COLOR,
            }
        );
    }
    return rects;
}
