package designer

object_rect_bounds :: proc(object: Editor_Object) -> Rect {
	return Rect {
		x = object.rect.x,
		y = object.rect.y,
		width = object.rect.width,
		height = object.rect.height,
	}
}

object_line_bounds :: proc(object: Editor_Object) -> Rect {
	x_min := min_f32(object.line.x1, object.line.x2)
	y_min := min_f32(object.line.y1, object.line.y2)
	x_max := max_f32(object.line.x1, object.line.x2)
	y_max := max_f32(object.line.y1, object.line.y2)

	half_stroke := object.line.stroke.width / 2.0

	return Rect {
		x = x_min - half_stroke,
		y = y_min - half_stroke,
		width = (x_max - x_min) + half_stroke * 2.0,
		height = (y_max - y_min) + half_stroke * 2.0,
	}
}

object_bounds :: proc(object: Editor_Object) -> Rect {
	if object.kind == .Rect {
		return object_rect_bounds(object)
	}

	if object.kind == .Line {
		return object_line_bounds(object)
	}

	return Rect{}
}
