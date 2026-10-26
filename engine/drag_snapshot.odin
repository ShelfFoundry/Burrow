package designer

Drag_Snapshot :: struct {
	bounds:  Rect,
	count:   int,
	objects: [MAX_SELECTED_OBJECTS]Editor_Object,
}

drag_snapshot_capture :: proc(
	snapshot: ^Drag_Snapshot,
	document: ^Editor_Document,
	selection: ^Selection_State,
) -> bool {
	snapshot^ = Drag_Snapshot{}

	for i in 0 ..< selection.count {
		object := document_get_object_by_id(document, selection.ids[i])
		if object == nil {
			continue
		}
		snapshot.objects[snapshot.count] = object^
		snapshot.count += 1
	}
	bounds, ok := selection_bounds(document, selection)
	snapshot.bounds = bounds

	return ok && snapshot.count > 0
}

drag_snapshot_restore :: proc(snapshot: ^Drag_Snapshot, document: ^Editor_Document) {
	for i in 0 ..< snapshot.count {
		saved := snapshot.objects[i]
		object := document_get_object_by_id(document, saved.id)
		if object != nil {
			object^ = saved
		}
	}
}

drag_snapshot_apply_resize :: proc(
	snapshot: ^Drag_Snapshot,
	document: ^Editor_Document,
	new_bounds: Rect,
) {
	for i in 0 ..< snapshot.count {
		saved := snapshot.objects[i]
		object := document_get_object_by_id(document, saved.id)
		if object == nil {
			continue
		}
		switch saved.kind {
		case .Rect:
			object.rect = rect_object_map_bounds(saved.rect, snapshot.bounds, new_bounds)
		case .Line:
			object.line = line_object_map_bounds(saved.line, snapshot.bounds, new_bounds)
		}
		object_snap_to_pixels(object)
	}
}

drag_snapshot_apply_translate :: proc(
	snapshot: ^Drag_Snapshot,
	document: ^Editor_Document,
	dx, dy: f32,
) {
	for i in 0 ..< snapshot.count {
		saved := snapshot.objects[i]
		object := document_get_object_by_id(document, saved.id)
		if object == nil {
			continue
		}
		object^ = saved
		object_translate(object, dx, dy)
		object_snap_to_pixels(object)
	}
}
