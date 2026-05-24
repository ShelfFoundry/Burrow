import type {
    EditorDocument,
    EditorObject,
    LineObject,
    RectObject,
    StrokeStyle,
} from "../editor/document";
import type {
    PagePlacement,
    Rect,
    ViewportTransform,
} from "../editor/geometry";
import {
    pageRectToScreen,
    rectFromLine,
} from "../editor/geometry";
import type { GpuRect } from "./rect-renderer";

export type ObjectRenderInput = {
    document: EditorDocument;
    pagePlacement: PagePlacement;
    transform: ViewportTransform;
};

export type ObjectRenderer = {
    buildRects: (input: ObjectRenderInput) => GpuRect[];
};

export function createObjectRenderer(): ObjectRenderer {
    function buildObjectRects(
        object: EditorObject,
        pagePlacement: PagePlacement,
        transform: ViewportTransform,
    ): GpuRect[] {
        switch (object.kind) {
            case "rect":
                return buildRectObjectRects(object, pagePlacement, transform);

            case "line":
                return buildLineObjectRects(object, pagePlacement, transform);
        }
    }

    function buildRects(input: ObjectRenderInput): GpuRect[] {
        const rects: GpuRect[] = [];

        for (const object of input.document.objects) {
            rects.push(
                ...buildObjectRects(
                    object,
                    input.pagePlacement,
                    input.transform,
                ),
            );
        }

        return rects;
    }

    return {
        buildRects,
    };
}

function buildStrokeRects(
    rect: Rect,
    stroke: StrokeStyle,
    pagePlacement: PagePlacement,
    transform: ViewportTransform,
): GpuRect[] {
    const strokeWidth = stroke.width;

    const top: Rect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: strokeWidth,
    };

    const left: Rect = {
        x: rect.x,
        y: rect.y,
        width: strokeWidth,
        height: rect.height,
    };

    const right: Rect = {
        x: rect.x + rect.width - strokeWidth,
        y: rect.y,
        width: strokeWidth,
        height: rect.height,
    };

    const bottom: Rect = {
        x: rect.x,
        y: rect.y + rect.height - strokeWidth,
        width: rect.width,
        height: strokeWidth,
    };

    return [top, left, right, bottom].map((strokeRect) => ({
        rect: pageRectToScreen(strokeRect, pagePlacement, transform),
        color: stroke.color,
    }));
}

function buildRectObjectRects(
    object: RectObject,
    pagePlacement: PagePlacement,
    transform: ViewportTransform,
): GpuRect[] {
    const rect: Rect = {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
    };

    const rects: GpuRect[] = [];

    if (object.fill) {
        rects.push({
            rect: pageRectToScreen(rect, pagePlacement, transform),
            color: object.fill,
        });
    }

    if (object.stroke) {
        rects.push(
            ...buildStrokeRects(rect, object.stroke, pagePlacement, transform),
        );
    }

    return rects;
}

function buildLineObjectRects(
    object: LineObject,
    pagePlacement: PagePlacement,
    transform: ViewportTransform,
): GpuRect[] {
    const lineRect = rectFromLine(
        object.x1,
        object.y1,
        object.x2,
        object.y2,
        object.stroke.width,
    );

    return [
        {
            rect: pageRectToScreen(lineRect, pagePlacement, transform),
            color: object.stroke.color,
        },
    ];
}
