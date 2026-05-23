import type { EditorDocument } from "../editor/document";
import type { PagePlacement, ViewportTransform } from "../editor/geometry";
import { pageRectToScreen, type Rect } from "../editor/geometry";
import { BLACK, WHITE } from "../editor/colors";
import type { GpuRect } from "./rect-renderer";

export type PageRenderInput = {
    document: EditorDocument,
    transform: ViewportTransform,
    pagePlacement: PagePlacement,
};

export type PageRenderer = {
    buildRects: (input: PageRenderInput) => GpuRect[];
};

export function createPageRenderer(): PageRenderer {
    function buildRects(input: PageRenderInput): GpuRect[] {
        const pageRect: Rect = {
            x: 0,
            y: 0,
            width: input.document.page.width,
            height: input.document.page.height,
        };

        const screenPageRect = pageRectToScreen(pageRect, input.pagePlacement, input.transform);

        const borderWidth = 1;

        return [
            {
                rect: screenPageRect,
                color: WHITE,
            },
            // top border
            {
                rect: {
                    x: screenPageRect.x,
                    y: screenPageRect.y,
                    width: screenPageRect.width,
                    height: borderWidth,
                },
                color: BLACK,
            },

            // left border
            {
                rect: {
                    x: screenPageRect.x,
                    y: screenPageRect.y,
                    width: borderWidth,
                    height: screenPageRect.height,
                },
                color: BLACK,
            },

            // right border
            {
                rect: {
                    x: screenPageRect.x + screenPageRect.width - borderWidth,
                    y: screenPageRect.y,
                    width: borderWidth,
                    height: screenPageRect.height,
                },
                color: BLACK,
            },

            // bottom border
            {
                rect: {
                    x: screenPageRect.x,
                    y: screenPageRect.y + screenPageRect.height - borderWidth,
                    width: screenPageRect.width,
                    height: borderWidth,
                },
                color: BLACK,
            },
        ];
    }

    return {
        buildRects,
    };
}
