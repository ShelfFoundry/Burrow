import type { EditorDocument } from "./document";
import { BLACK, RED, rgba } from "./colors";

export function createSampleDocument(): EditorDocument {
    return {
        page: {
            width: 612,
            height: 792,
        },
        objects: [
            {
                id: 1,
                kind: "rect",
                name: "Border",
                x: 72,
                y: 72,
                width: 468,
                height: 648,
                fill: null,
                stroke: {
                    color: BLACK,
                    width: 2,
                },
            },
            {
                id: 2,
                kind: "rect",
                name: "Sale Price Box",
                x: 72,
                y: 380,
                width: 468,
                height: 130,
                fill: rgba(1, 0.92, 0.92, 1),
                stroke: {
                    color: RED,
                    width: 3,
                },
            },
            {
                id: 3,
                kind: "line",
                name: "Divider",
                x1: 72,
                y1: 340,
                x2: 540,
                y2: 340,
                stroke: {
                    color: BLACK,
                    width: 1,
                },
            },
        ],
    };
}
