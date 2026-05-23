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

export function normalizeRect(rect: Rect): Rect {
    const x = Math.min(rect.x, rect.x + rect.width);
    const y = Math.min(rect.y, rect.y + rect.height);
    const width = Math.abs(rect.width);
    const height = Math.abs(rect.height);
    return { x, y, width, height };
}

export function rectFromLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number,
): Rect {
    const half = thickness / 2;

    if (y1 === y2) {
        const x = Math.min(x1, x2);
        const width = Math.abs(x2 - x1);

        return {
            x,
            y: y1 - half,
            width,
            height: thickness,
        };
    }

    if (x1 == x2) {
        const y = Math.min(y1, y2);
        const height = Math.abs(y2 - y1);

        return {
            x: x1 - half,
            y,
            width: thickness,
            height,
        };
    }

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    return {
        x,
        y,
        width: Math.max(width, thickness),
        height: Math.max(height, thickness),
    };
}

export function distancedSquared(a: Point, b: Point): number {
    const dx = a.x - b.y;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

export function distance(a: Point, b: Point): number {
    return Math.sqrt(distancedSquared(a, b));
}

export function distanceToSegment(
    point: Point,
    start: Point,
    end: Point,
): number {
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;

    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared === 0) {
        return distance(point, start);
    }

    const pointX = point.x - start.x;
    const pointY = point.y - start.y;

    const t = (pointX * segmentY + pointY * segmentY) / segmentLengthSquared;

    const clampedT = Math.max(0, Math.min(1, t));

    const closestPoint: Point = {
        x: start.x + clampedT * segmentX,
        y: start.y + clampedT * segmentY,
    };

    return distance(point, closestPoint);
}
