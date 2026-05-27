package designer

engine_set_interaction_pointer_start :: proc() {
	state.interaction.start_pointer_page = Point {
		x = state.pointer.page_x,
		y = state.pointer.page_y,
	}
	state.interaction.last_pointer_page = state.interaction.start_pointer_page

	state.interaction.start_pointer_screen = Point {
		x = state.pointer.x,
		y = state.pointer.y,
	}
	state.interaction.last_pointer_screen = state.interaction.start_pointer_screen
}

engine_start_line_handle_interaction :: proc(active_object_id: Object_Id, handle: Line_Handle) {
	state.interaction = Interaction_State{}
	state.interaction.mode = .Line_Handle
	state.interaction.line_handle = handle
	state.interaction.active_object_id = active_object_id
	engine_set_interaction_pointer_start()
}

engine_start_resize_interaction :: proc(active_object_id: Object_Id, handle: Resize_Handle) {
	state.interaction = Interaction_State{}
	state.interaction.mode = .Resize_Handle
	state.interaction.resize_handle = handle
	state.interaction.active_object_id = active_object_id
	engine_set_interaction_pointer_start()

	if active_object_id == Object_Id(0) {
		engine_capture_group_resize_snapshot()
	}

	object := document_get_object_by_id(&state.document, active_object_id)

	if object != nil && object.kind == .Rect {
		state.interaction.start_rect = object.rect
		state.interaction.has_start_rect = true
	}
}

engine_drag_resize_handle_by_current_pointer :: proc() -> bool {
	if state.interaction.mode != .Resize_Handle {
		return false
	}

	if state.interaction.active_object_id == Object_Id(0) {
		current := Point {
			x = state.pointer.page_x,
			y = state.pointer.page_y,
		}

		total_dx := current.x - state.interaction.start_pointer_page.x
		total_dy := current.y - state.interaction.start_pointer_page.y

		new_bounds: Rect

		if engine_shift_down() && resize_handle_is_corner(state.interaction.resize_handle) {
			new_bounds = resize_bounds_from_handle_aspect(
				state.interaction.group_resize.start_bounds,
				state.interaction.resize_handle,
				total_dx,
				total_dy,
				MIN_RECT_SIZE,
			)
		} else {
			new_bounds = resize_bounds_from_handle(
				state.interaction.group_resize.start_bounds,
				state.interaction.resize_handle,
				total_dx,
				total_dy,
				MIN_RECT_SIZE,
			)
		}

		ok := engine_apply_group_resize_snapshot(new_bounds)

		if !ok {
			return false
		}

		state.interaction.last_pointer_page = current
		state.interaction.last_pointer_screen = Point {
			x = state.pointer.x,
			y = state.pointer.y,
		}

		return true

	}

	if state.interaction.resize_handle == .None {
		return false
	}

	if state.interaction.active_object_id != Object_Id(0) &&
	   engine_shift_down() &&
	   resize_handle_is_corner(state.interaction.resize_handle) &&
	   state.interaction.has_start_rect {

		current := Point {
			x = state.pointer.page_x,
			y = state.pointer.page_y,
		}

		total_dx := current.x - state.interaction.start_pointer_page.x
		total_dy := current.y - state.interaction.start_pointer_page.y

		new_rect := rect_resize_from_handle_aspect(
			state.interaction.start_rect,
			state.interaction.resize_handle,
			total_dx,
			total_dy,
			MIN_RECT_SIZE,
		)

		ok := document_set_rect_by_id(
			&state.document,
			state.interaction.active_object_id,
			new_rect,
		)

		if !ok {
			return false
		}

		state.interaction.last_pointer_page = current
		state.interaction.last_pointer_screen = Point {
			x = state.pointer.x,
			y = state.pointer.y,
		}

		return true
	}

	current := Point {
		x = state.pointer.page_x,
		y = state.pointer.page_y,
	}

	dx := current.x - state.interaction.last_pointer_page.x
	dy := current.y - state.interaction.last_pointer_page.y

	if dx == 0.0 && dy == 0.0 {
		return true
	}

	ok := document_resize_rect_by_id(
		&state.document,
		state.interaction.active_object_id,
		state.interaction.resize_handle,
		dx,
		dy,
	)

	if !ok {
		return false
	}

	state.interaction.last_pointer_page = current
	state.interaction.last_pointer_screen = Point {
		x = state.pointer.x,
		y = state.pointer.y,
	}

	return true
}

engine_capture_group_resize_snapshot :: proc() -> bool {
	if state.selection.count <= 1 {
		return false
	}

	bounds, ok := selection_bounds(&state.document, &state.selection)

	if !ok {
		return false
	}

	state.interaction.group_resize = Group_Resize_State{}
	state.interaction.group_resize.active = true
	state.interaction.group_resize.start_bounds = bounds
	state.interaction.group_resize.current_bounds = bounds

	for i in 0 ..< state.selection.count {
		if state.interaction.group_resize.count >= MAX_RESIZE_SNAPSHOT_OBJECTS {
			break
		}

		id := state.selection.ids[i]
		object := document_get_object_by_id(&state.document, id)

		if object == nil {
			continue
		}

		index := state.interaction.group_resize.count

		state.interaction.group_resize.objects[index] = Resize_Object_Snapshot {
			id   = object.id,
			kind = object.kind,
			rect = object.rect,
			line = object.line,
		}

		state.interaction.group_resize.count += 1
	}

	return state.interaction.group_resize.count > 0
}

engine_apply_group_resize_snapshot :: proc(new_bounds: Rect) -> bool {
	group := &state.interaction.group_resize

	if !group.active {
		return false
	}

	from := group.start_bounds
	to := new_bounds

	for i in 0 ..< group.count {
		snapshot := group.objects[i]
		object := document_get_object_by_id(&state.document, snapshot.id)

		if object == nil {
			continue
		}

		if snapshot.kind == .Rect && object.kind == .Rect {
			object.rect = apply_group_resize_to_rect(snapshot.rect, from, to)
		} else if snapshot.kind == .Line && object.kind == .Line {
			object.line = apply_group_resize_to_line(snapshot.line, from, to)
		}
	}

	group.current_bounds = new_bounds
	return true
}

resize_bounds_from_handle :: proc(
	bounds: Rect,
	handle: Resize_Handle,
	dx, dy: f32,
	min_size: f32,
) -> Rect {
	x := bounds.x
	y := bounds.y
	w := bounds.width
	h := bounds.height

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

	if w < min_size {
		if handle == .NW || handle == .W || handle == .SW {
			x = x + w - min_size
		}

		w = min_size
	}

	if h < min_size {
		if handle == .NW || handle == .N || handle == .NE {
			y = y + h - min_size
		}

		h = min_size
	}

	return Rect{x = x, y = y, width = w, height = h}
}

map_point_between_rects :: proc(point: Point, from: Rect, to: Rect) -> Point {
	sx := f32(1.0)
	sy := f32(1.0)

	if from.width != 0.0 {
		sx = to.width / from.width
	}

	if from.height != 0.0 {
		sy = to.height / from.height
	}

	return Point{x = to.x + (point.x - from.x) * sx, y = to.y + (point.y - from.y) * sy}
}

apply_group_resize_to_rect :: proc(rect: Rect_Object, from: Rect, to: Rect) -> Rect_Object {
	p0 := map_point_between_rects(Point{x = rect.x, y = rect.y}, from, to)

	p1 := map_point_between_rects(
		Point{x = rect.x + rect.width, y = rect.y + rect.height},
		from,
		to,
	)

	result := rect
	result.x = p0.x
	result.y = p0.y
	result.width = p1.x - p0.x
	result.height = p1.y - p0.y

	if result.width < MIN_RECT_SIZE {
		result.width = MIN_RECT_SIZE
	}

	if result.height < MIN_RECT_SIZE {
		result.height = MIN_RECT_SIZE
	}

	return result
}

apply_group_resize_to_line :: proc(line: Line_Object, from: Rect, to: Rect) -> Line_Object {
	p1 := map_point_between_rects(Point{x = line.x1, y = line.y1}, from, to)

	p2 := map_point_between_rects(Point{x = line.x2, y = line.y2}, from, to)

	result := line
	result.x1 = p1.x
	result.y1 = p1.y
	result.x2 = p2.x
	result.y2 = p2.y

	return result
}

resize_handle_is_corner :: proc(handle: Resize_Handle) -> bool {
	return handle == .NW || handle == .NE || handle == .SE || handle == .SW
}

resize_bounds_from_handle_aspect :: proc(
	start: Rect,
	handle: Resize_Handle,
	total_dx, total_dy: f32,
	min_size: f32,
) -> Rect {
	result := start

	if start.width <= 0.0 || start.height <= 0.0 {
		return result
	}

	aspect := start.width / start.height

	left := start.x
	top := start.y
	right := start.x + start.width
	bottom := start.y + start.height

	free_width := start.width
	free_height := start.height

	if handle == .SE {
		free_width = max_f32(min_size, start.width + total_dx)
		free_height = max_f32(min_size, start.height + total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = left
		result.y = top
		return result
	}

	if handle == .NE {
		free_width = max_f32(min_size, start.width + total_dx)
		free_height = max_f32(min_size, start.height - total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = left
		result.y = bottom - result.height
		return result
	}

	if handle == .SW {
		free_width = max_f32(min_size, start.width - total_dx)
		free_height = max_f32(min_size, start.height + total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = right - result.width
		result.y = top
		return result
	}

	if handle == .NW {
		free_width = max_f32(min_size, start.width - total_dx)
		free_height = max_f32(min_size, start.height - total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = right - result.width
		result.y = bottom - result.height
		return result
	}

	return resize_bounds_from_handle(start, handle, total_dx, total_dy, min_size)
}

rect_resize_from_handle_aspect :: proc(
	start: Rect_Object,
	handle: Resize_Handle,
	total_dx, total_dy: f32,
	min_size: f32,
) -> Rect_Object {
	result := start

	if start.width <= 0.0 || start.height <= 0.0 {
		return result
	}

	aspect := start.width / start.height

	left := start.x
	top := start.y
	right := start.x + start.width
	bottom := start.y + start.height

	free_width := start.width
	free_height := start.height

	if handle == .SE {
		free_width = max_f32(min_size, start.width + total_dx)
		free_height = max_f32(min_size, start.height + total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = left
		result.y = top
		return result
	}

	if handle == .NE {
		free_width = max_f32(min_size, start.width + total_dx)
		free_height = max_f32(min_size, start.height - total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = left
		result.y = bottom - result.height
		return result
	}

	if handle == .SW {
		free_width = max_f32(min_size, start.width - total_dx)
		free_height = max_f32(min_size, start.height + total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = right - result.width
		result.y = top
		return result
	}

	if handle == .NW {
		free_width = max_f32(min_size, start.width - total_dx)
		free_height = max_f32(min_size, start.height - total_dy)

		width_from_height := free_height * aspect
		height_from_width := free_width / aspect

		if abs_f32(free_width - start.width) >= abs_f32(free_height - start.height) {
			result.width = free_width
			result.height = height_from_width
		} else {
			result.width = width_from_height
			result.height = free_height
		}

		result.x = right - result.width
		result.y = bottom - result.height
		return result
	}

	return result
}
