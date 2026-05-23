import type { Rgba } from "./document";

export const WHITE: Rgba = { r: 1, g: 1, b: 1, a: 1 };
export const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
export const RED: Rgba = { r: 1, g: 0, b: 0, a: 1 };
export const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 };

export function rgba(r: number, g: number, b: number, a = 1): Rgba {
    return { r, g, b, a };
};
