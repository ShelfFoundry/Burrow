package designer

import "core:math"

Point :: struct {
	x: f32,
	y: f32,
}

Size :: struct {
	width:  f32,
	height: f32,
}

Rect :: struct {
	x:      f32,
	y:      f32,
	width:  f32,
	height: f32,
}

Viewport_Transform :: struct {
	zoom:  f32,
	pan_x: f32,
	pan_y: f32,
}

page_to_screen :: proc(point: Point, transform: Viewport_Transform) -> Point {
	return Point {
		x = point.x * transform.zoom + transform.pan_x,
		y = point.y * transform.zoom + transform.pan_y,
	}
}

screen_to_page :: proc(point: Point, transform: Viewport_Transform) -> Point {
	return Point {
		x = (point.x - transform.pan_x) / transform.zoom,
		y = (point.y - transform.pan_y) / transform.zoom,
	}
}

page_rect_to_screen :: proc(rect: Rect, transform: Viewport_Transform) -> Rect {
	top_left := page_to_screen(Point{x = rect.x, y = rect.y}, transform)
	return Rect {
		x = top_left.x,
		y = top_left.y,
		width = rect.width * transform.zoom,
		height = rect.height * transform.zoom,
	}
}

rect_right :: proc(rect: Rect) -> f32 {
	return rect.x + rect.width
}

rect_bottom :: proc(rect: Rect) -> f32 {
	return rect.y + rect.height
}

rect_union :: proc(a, b: Rect) -> Rect {
	x0 := min_f32(a.x, b.x)
	y0 := min_f32(a.y, b.y)
	x1 := max_f32(rect_right(a), rect_right(b))
	y1 := max_f32(rect_bottom(a), rect_bottom(b))

	return Rect{x = x0, y = y0, width = x1 - x0, height = y1 - y0}
}

compute_initial_viewport :: proc(
	canvas_size: Size,
	page_size: Size,
	padding: f32,
) -> Viewport_Transform {
	available_width := max_f32(1.0, canvas_size.width - padding * 2.0)
	available_height := max_f32(1.0, canvas_size.height - padding * 2.0)

	zoom_x := available_width / page_size.width
	zoom_y := available_height / page_size.height

	zoom := min_f32(zoom_x, zoom_y)

	page_screen_width := page_size.width * zoom
	page_screen_height := page_size.height * zoom

	pan_x := (canvas_size.width - page_screen_width) / 2.0
	pan_y := (canvas_size.height - page_screen_height) / 2.0

	return Viewport_Transform{zoom = zoom, pan_x = pan_x, pan_y = pan_y}
}

point_in_rect :: proc(point: Point, rect: Rect) -> bool {
	return(
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height \
	)
}

distance_point_to_segment :: proc(point, a, b: Point) -> f32 {
	ab_x := b.x - a.x
	ab_y := b.y - a.y

	ap_x := point.x - a.x
	ap_y := point.y - a.y

	ab_len_sq := ab_x * ab_x + ab_y * ab_y

	if ab_len_sq <= 0.0001 {
		dx := point.x - a.x
		dy := point.y - a.y
		return length_f32(dx, dy)
	}

	t := (ap_x * ab_x + ap_y * ab_y) / ab_len_sq

	if t < 0.0 {
		t = 0.0
	} else if t > 1.0 {
		t = 1.0
	}

	closest := Point {
		x = a.x + ab_x * t,
		y = a.y + ab_y * t,
	}

	dx := point.x - closest.x
	dy := point.y - closest.y

	return length_f32(dx, dy)
}

min_f32 :: proc(a, b: f32) -> f32 {
	if a < b {
		return a
	}
	return b
}

max_f32 :: proc(a, b: f32) -> f32 {
	if a > b {
		return a
	}
	return b
}

length_f32 :: proc(x, y: f32) -> f32 {
	return math.sqrt_f32(x * x + y * y)
}

abs_f32 :: proc(value: f32) -> f32 {
	if value < 0.0 {
		return -value
	}

	return value
}
