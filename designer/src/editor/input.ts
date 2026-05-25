export function isPrimaryButtonDown(buttons: number): boolean {
    return (buttons & 1) !== 0;
}

export function isSecondaryButtonDown(buttons: number): boolean {
    return (buttons & 2) !== 0;
}

export function isMiddleButtonDown(buttons: number): boolean {
    return (buttons & 4) !== 0;
}
