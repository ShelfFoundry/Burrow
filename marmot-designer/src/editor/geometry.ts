export type Point = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
};

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type ViewportTransform = {
    zoom: number;
    panX: number;
    panY: number;
};

export type PagePlacement = {
    x: number;
    y: number;
};

export function worldToScreen(point: Point, transform: ViewportTransform): Point {
    return {
        x: point.x * transform.zoom + transform.panX,
        y: point.y * transform.zoom + transform.panY,
    };
}

export function screenToWorld(
    point: Point,
    transform: ViewportTransform
): Point {
    return {
        x: (point.x - transform.panX) / transform.zoom,
        y: (point.y - transform.panY) / transform.zoom,
    };
}

export function pageToWorld(point: Point, pagePlacement: PagePlacement): Point {
    return {
        x: point.x + pagePlacement.x,
        y: point.y + pagePlacement.y,
    };
}

export function worldToPage(point: Point, pagePlacement: PagePlacement): Point {
    return {
        x: point.x - pagePlacement.x,
        y: point.y - pagePlacement.y,
    };
}

export function pageToScreen(
    point: Point,
    pagePlacement: PagePlacement,
    transform: ViewportTransform
): Point {
    return worldToScreen(pageToWorld(point, pagePlacement), transform);
}

export function screenToPage(
    point: Point,
    pagePlacement: PagePlacement,
    transform: ViewportTransform
): Point {
    return worldToPage(screenToWorld(point, transform), pagePlacement);
}

export function pageRectToScreen(
    rect: Rect,
    pagePlacement: PagePlacement,
    transform: ViewportTransform
): Rect {
    const topLeft = pageToScreen(
        { x: rect.x, y: rect.y },
        pagePlacement,
        transform
    );

    return {
        x: topLeft.x,
        y: topLeft.y,
        width: rect.width * transform.zoom,
        height: rect.height * transform.zoom,
    };
}

export function screenRectToPage(
    rect: Rect,
    pagePlacement: PagePlacement,
    transform: ViewportTransform
): Rect {
    const topLeft = screenToPage(
        { x: rect.x, y: rect.y },
        pagePlacement,
        transform
    );

    return {
        x: topLeft.x,
        y: topLeft.y,
        width: rect.width / transform.zoom,
        height: rect.height / transform.zoom,
    };
}

export function computeInitialViewport(
    canvasSize: Size,
    pageSize: Size,
    padding = 48,
): { transform: ViewportTransform, pagePlacement: PagePlacement } {
    const availableWidth = Math.max(1, canvasSize.width - padding * 2);
    const availableHeight = Math.max(1, canvasSize.height - padding * 2);

    const zoomX = availableWidth / pageSize.width;
    const zoomY = availableHeight / pageSize.height;

    const zoom = Math.min(zoomX, zoomY);

    const pageWorldWidth = pageSize.width;
    const pageWorldHeight = pageSize.height;

    const pageScreenWidth = pageWorldWidth * zoom;
    const pageScreenHeight = pageWorldHeight * zoom;

    const panX = (canvasSize.width - pageScreenWidth) / 2;
    const panY = (canvasSize.height - pageScreenHeight) / 2;

    return {
        transform: {
            zoom,
            panX,
            panY,
        },
        pagePlacement: {
            x: 0,
            y: 0,
        },
    };
}

export function pointInRect(point: Point, rect: Rect): boolean {
    return (
        point.x >= rect.x &&
        point.y >= rect.y &&
        point.x <= rect.y + rect.width &&
        point.y <= rect.y + rect.height
    );
}

export function pointInPage(point: Point, pageSize: Size): boolean {
    return (
        point.x >= 0 &&
        point.y >= 0 &&
        point.x <= pageSize.width &&
        point.y <= pageSize.height
    );
}
