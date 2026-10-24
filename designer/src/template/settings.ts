import { createStore } from "solid-js/store";

// NOTE: everything in this file is mock data for the template settings panel.
// Options and label specs are placeholders until they come from the AIMS API.

export type SelectOption<T extends string> = {
    value: T;
    label: string;
};

// Values are the ditherer names the render engine's dither crate accepts.
export type DitheringAlgorithm =
    | "floyd"
    | "atkinson"
    | "stucki"
    | "burkes"
    | "jarvis"
    | "sierra";

export const DITHERING_OPTIONS: SelectOption<DitheringAlgorithm>[] = [
    { value: "floyd", label: "Floyd–Steinberg" },
    { value: "atkinson", label: "Atkinson" },
    { value: "stucki", label: "Stucki" },
    { value: "burkes", label: "Burkes" },
    { value: "jarvis", label: "Jarvis–Judice–Ninke" },
    { value: "sierra", label: "Sierra" },
];

export type PaletteId = "bw" | "bwr" | "bwy" | "bwry" | "7-color";

export type PaletteOption = SelectOption<PaletteId> & {
    colors: string[];
};

export const PALETTE_OPTIONS: PaletteOption[] = [
    { value: "bw", label: "Black / White", colors: ["#000000", "#ffffff"] },
    { value: "bwr", label: "Black / White / Red", colors: ["#000000", "#ffffff", "#d0021b"] },
    { value: "bwy", label: "Black / White / Yellow", colors: ["#000000", "#ffffff", "#f5c400"] },
    {
        value: "bwry",
        label: "4 color display",
        colors: ["#000000", "#ffffff", "#d0021b", "#f5c400"],
    },
    // SoluM calls this "7 color", but the panel only has six.
    {
        value: "7-color",
        label: "7 color display",
        colors: ["#000000", "#ffffff", "#d0021b", "#f5c400", "#2e7d32", "#1e4fd8"],
    },
];

export type LabelSizeId = "2.6" | "4.2" | "7.5" | "9.7";

export type LabelSizeOption = SelectOption<LabelSizeId> & {
    width: number;
    height: number;
};

// NOTE: placeholder resolutions; confirm against the AIMS label type list.
export const LABEL_SIZE_OPTIONS: LabelSizeOption[] = [
    { value: "2.6", label: '2.6" — 296 × 152', width: 296, height: 152 },
    { value: "4.2", label: '4.2" — 400 × 300', width: 400, height: 300 },
    { value: "7.5", label: '7.5" — 800 × 480', width: 800, height: 480 },
    { value: "9.7", label: '9.7" — 672 × 960', width: 672, height: 960 },
];

export type Orientation = "landscape" | "portrait";

export const MOCK_PRODUCTS: SelectOption<string>[] = [
    { value: "100234", label: "100234 — Organic Bananas" },
    { value: "100871", label: "100871 — Whole Milk 1gal" },
    { value: "204510", label: "204510 — Sourdough Loaf" },
    { value: "318842", label: "318842 — Cold Brew 12oz" },
];

export type DeviceStatus =
    | { kind: "no-device" }
    | { kind: "unchecked" }
    | { kind: "checking" }
    | { kind: "online"; battery: number; signalDbm: number; lastSeen: string }
    | { kind: "offline"; lastSeen: string };

export type TemplateSettings = {
    name: string;
    deviceId: string;
    productId: string;
    labelSize: LabelSizeId;
    orientation: Orientation;
    palette: PaletteId;
    dithering: DitheringAlgorithm;
    deviceStatus: DeviceStatus;
};

export function createTemplateSettingsStore() {
    return createStore<TemplateSettings>({
        name: "Untitled template",
        deviceId: "",
        productId: "",
        labelSize: "9.7",
        orientation: "portrait",
        palette: "7-color",
        dithering: "floyd",
        deviceStatus: { kind: "no-device" },
    });
}

export function findLabelSize(id: LabelSizeId): LabelSizeOption {
    return LABEL_SIZE_OPTIONS.find((option) => option.value === id) ?? LABEL_SIZE_OPTIONS[0];
}

export function findPalette(id: PaletteId): PaletteOption {
    return PALETTE_OPTIONS.find((option) => option.value === id) ?? PALETTE_OPTIONS[0];
}
