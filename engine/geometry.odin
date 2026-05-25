package designer

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

compute_initial_viewport :: proc(
	canvas_size: Size,
	page_size: Size,
	padding: f32,
) -> Viewport_Transform {
	available_width := max_f32(1.0, canvas_size.width - padding * 2.0)
	available_height := max_f32(1.0, canvas_size.height - padding * 2.0)

	zoom_x := available_width / page_size.width
	zoom_y := available_width / page_size.height

	zoom := min_f32(zoom_x, zoom_y)

	page_screen_width := page_size.width * zoom
	page_screen_height := page_size.height * zoom

	pan_x := (canvas_size.width - page_screen_width) / 2.0
	pan_y := (canvas_size.height - page_screen_height) / 2.0

	return Viewport_Transform{zoom = zoom, pan_x = pan_x, pan_y = pan_y}
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
