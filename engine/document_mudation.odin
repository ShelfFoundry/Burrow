package designer

document_move_line_handle_by_id :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	handle: Line_Handle,
	x, y: f32,
) -> bool {
	object := document_get_object_by_id(document, id)

	if object == nil {
		return false
	}

	if object.kind != .Line {
		return false
	}

	if handle == .Start {
		object.line.x1 = x
		object.line.y1 = y
		return true
	}

	if handle == .End {
		object.line.x2 = x
		object.line.y2 = y
		return true
	}

	return false
}

rect_resize_from_handle :: proc(rect: ^Rect_Object, handle: Resize_Handle, dx, dy: f32) {
	if rect == nil {
		return
	}

	x := rect.x
	y := rect.y
	w := rect.width
	h := rect.height

	if handle == .NW {
		x += dx
		y += dy
		w -= dx
		h -= dy
	} else if handle == .N {
		y += dy
		h -= dy
	} else if handle == .NE {
		y += dy
		w += dx
		h -= dy
	} else if handle == .E {
		w += dx
	} else if handle == .SE {
		w += dx
		h += dy
	} else if handle == .S {
		h += dy
	} else if handle == .SW {
		x += dx
		w -= dx
		h += dy
	} else if handle == .W {
		x += dx
		w -= dx
	}

	if w < MIN_RECT_SIZE {
		if handle == .NW || handle == .W || handle == .SW {
			x = x + w - MIN_RECT_SIZE
		}

		w = MIN_RECT_SIZE
	}

	if h < MIN_RECT_SIZE {
		if handle == .NW || handle == .N || handle == .NE {
			y = y + h - MIN_RECT_SIZE
		}

		h = MIN_RECT_SIZE
	}

	rect.x = x
	rect.y = y
	rect.width = w
	rect.height = h
}

document_resize_rect_by_id :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	handle: Resize_Handle,
	dx, dy: f32,
) -> bool {
	object := document_get_object_by_id(document, id)

	if object == nil {
		return false
	}

	if object.kind != .Rect {
		return false
	}

	rect_resize_from_handle(&object.rect, handle, dx, dy)
	return true
}
