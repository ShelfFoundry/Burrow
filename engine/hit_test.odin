package designer

Hit_Result_Kind :: enum {
	None,
	Object,
	Resize_Handle,
	Line_Handle,
}

Hit_Result :: struct {
	kind:          Hit_Result_Kind,
	object_id:     Object_Id,
	object_index:  int,
	resize_handle: Resize_Handle,
	line_handle:   Line_Handle,
}

hit_test_rect_object :: proc(object: Editor_Object, point: Point) -> bool {
	bounds := object_rect_bounds(object)
	return point_in_rect(point, bounds)
}

hit_test_line_object :: proc(object: Editor_Object, point: Point, tolerance: f32) -> bool {
	bounds := object_line_bounds(object)

	if !point_in_rect(point, bounds) {
		return false
	}

	a := Point {
		x = object.line.x1,
		y = object.line.y1,
	}
	b := Point {
		x = object.line.x2,
		y = object.line.y2,
	}

	distance := distance_point_to_segment(point, a, b)

	half_width := object.line.stroke.width / 2.0

	return distance <= half_width + tolerance
}

hit_test_object :: proc(object: Editor_Object, point: Point, tolerance: f32) -> bool {
	if object.kind == .Rect {
		return hit_test_rect_object(object, point)
	}

	if object.kind == .Line {
		return hit_test_line_object(object, point, tolerance)
	}

	return false
}

hit_test_document :: proc(document: ^Editor_Document, point: Point, tolerance: f32) -> Hit_Result {
	if document == nil {
		return Hit_Result{kind = .None}
	}

	if document.object_count <= 0 {
		return Hit_Result{kind = .None}
	}

	i := document.object_count - 1

	for {
		object := document.objects[i]

		if hit_test_object(object, point, tolerance) {
			return Hit_Result{kind = .Object, object_id = object.id, object_index = i}
		}

		if i == 0 {
			break
		}

		i -= 1
	}

	return Hit_Result{kind = .None}
}

hit_test_resize_handles :: proc(
	bounds_page: Rect,
	transform: Viewport_Transform,
	screen_point: Point,
) -> Resize_Handle {
	bounds_screen := page_rect_to_screen(bounds_page, transform)

	handles := [?]Resize_Handle{.NW, .N, .NE, .E, .SE, .S, .SW, .W}

	for handle in handles {
		center := selection_handle_center(bounds_screen, handle)
		rect := handle_hit_rect(center)

		if point_in_rect(screen_point, rect) {
			return handle
		}
	}

	return .None
}

hit_test_line_endpoint_handles :: proc(
	object: Editor_Object,
	transform: Viewport_Transform,
	screen_point: Point,
) -> Line_Handle {
	p1_page := Point {
		x = object.line.x1,
		y = object.line.y1,
	}
	p2_page := Point {
		x = object.line.x2,
		y = object.line.y2,
	}

	p1_screen := page_to_screen(p1_page, transform)
	p2_screen := page_to_screen(p2_page, transform)

	start_rect := handle_hit_rect(p1_screen)
	end_rect := handle_hit_rect(p2_screen)

	if point_in_rect(screen_point, start_rect) {
		return .Start
	}

	if point_in_rect(screen_point, end_rect) {
		return .End
	}

	return .None
}

hit_test_selection_handles :: proc(
	document: ^Editor_Document,
	selection: ^Selection_State,
	transform: Viewport_Transform,
	screen_point: Point,
) -> Hit_Result {
	if document == nil || selection == nil || selection.count == 0 {
		return Hit_Result{kind = .None}
	}

	// Single selection: object-specific handles.
	if selection.count == 1 {
		object := document_get_object_by_id(document, selection.ids[0])

		if object == nil {
			return Hit_Result{kind = .None}
		}

		if object.kind == .Line {
			line_handle := hit_test_line_endpoint_handles(object^, transform, screen_point)

			if line_handle != .None {
				return Hit_Result {
					kind = .Line_Handle,
					object_id = object.id,
					line_handle = line_handle,
				}
			}

			return Hit_Result{kind = .None}
		}

		if object.kind == .Rect {
			bounds := object_bounds(object^)

			resize_handle := hit_test_resize_handles(bounds, transform, screen_point)

			if resize_handle != .None {
				return Hit_Result {
					kind = .Resize_Handle,
					object_id = object.id,
					resize_handle = resize_handle,
				}
			}
		}

		return Hit_Result{kind = .None}
	}

	// Multi-selection: group bounds handles.
	bounds, ok := selection_bounds(document, selection)

	if !ok {
		return Hit_Result{kind = .None}
	}

	resize_handle := hit_test_resize_handles(bounds, transform, screen_point)

	if resize_handle != .None {
		return Hit_Result {
			kind = .Resize_Handle,
			object_id = Object_Id(0),
			resize_handle = resize_handle,
		}
	}

	return Hit_Result{kind = .None}
}
