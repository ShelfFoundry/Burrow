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

document_set_rect_geometry_by_id :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	x, y, width, height: f32,
) -> bool {
	object := document_get_object_by_id(document, id)
	if object == nil || object.kind != .Rect {
		return false
	}

	after := object^
	after.rect.x = x
	after.rect.y = y
	after.rect.width = max(width, MIN_RECT_SIZE)
	after.rect.height = max(height, MIN_RECT_SIZE)

	object_snap_to_pixels(&after)
	return document_set_object(document, after)
}
