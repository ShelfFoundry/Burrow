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

selection_bounds :: proc(document: ^Editor_Document, selection: ^Selection_State) -> (Rect, bool) {
	if document == nil || selection == nil || selection.count == 0 {
		return Rect{}, false
	}

	has_bounds := false
	result := Rect{}

	for i in 0 ..< selection.count {
		id := selection.ids[i]
		object := document_get_object_by_id(document, id)

		if object == nil {
			continue
		}

		bounds := object_bounds(object^)

		if !has_bounds {
			result = bounds
			has_bounds = true
		} else {
			result = rect_union(result, bounds)
		}
	}

	return result, has_bounds
}
