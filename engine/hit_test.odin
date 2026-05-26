package designer

Hit_Result_Kind :: enum {
	None,
	Object,
}

Hit_Result :: struct {
	kind:         Hit_Result_Kind,
	object_id:    Object_Id,
	object_index: int,
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
