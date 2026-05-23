import type { EditorObject } from "./document";
import type { SelectionSummary } from "../App";

export function objectToSelectionSummary(object: EditorObject): SelectionSummary {
  switch (object.kind) {
    case "rect":
      return {
        kind: "object",
        id: object.id,
        objectType: object.kind,
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      };

    case "line":
      return {
        kind: "object",
        id: object.id,
        objectType: object.kind,
        x: object.x1,
        y: object.y1,
        width: object.x2 - object.x1,
        height: object.y2 - object.y1,
      };
  }
}
