package designer

MAX_SELECTED_OBJECTS :: 128

Selection_State :: struct {
	count: int,
	ids:   [MAX_SELECTED_OBJECTS]Object_Id,
}

Resize_Handle :: enum {
	None,
	NW,
	N,
	NE,
	E,
	SE,
	S,
	SW,
	W,
}

selection_clear :: proc(selection: ^Selection_State) {
	selection.count = 0
}

selection_contains :: proc(selection: ^Selection_State, id: Object_Id) -> bool {
	for i in 0 ..< selection.count {
		if selection.ids[i] == id {
			return true
		}
	}

	return false
}

selection_add :: proc(selection: ^Selection_State, id: Object_Id) -> bool {
	if id == Object_Id(0) {
		return false
	}

	if selection_contains(selection, id) {
		return true
	}

	if selection.count >= MAX_SELECTED_OBJECTS {
		return false
	}

	selection.ids[selection.count] = id
	selection.count += 1
	return true
}

selection_remove :: proc(selection: ^Selection_State, id: Object_Id) -> bool {
	for i in 0 ..< selection.count {
		if selection.ids[i] == id {
			last_index := selection.count - 1
			selection.ids[i] = selection.ids[last_index]
			selection.count -= 1
			return true
		}
	}

	return false
}

selection_toggle :: proc(selection: ^Selection_State, id: Object_Id) -> bool {
	if selection_contains(selection, id) {
		return selection_remove(selection, id)
	}

	return selection_add(selection, id)
}

selection_replace :: proc(selection: ^Selection_State, id: Object_Id) {
	selection_clear(selection)

	if id != Object_Id(0) {
		selection_add(selection, id)
	}
}

selection_handle_center :: proc(bounds_screen: Rect, handle: Resize_Handle) -> Point {
	x0 := bounds_screen.x
	y0 := bounds_screen.y
	x1 := bounds_screen.x + bounds_screen.width
	y1 := bounds_screen.y + bounds_screen.height

	cx := bounds_screen.x + bounds_screen.width / 2.0
	cy := bounds_screen.y + bounds_screen.height / 2.0

	if handle == .NW {
		return Point{x = x0, y = y0}
	}

	if handle == .N {
		return Point{x = cx, y = y0}
	}

	if handle == .NE {
		return Point{x = x1, y = y0}
	}

	if handle == .E {
		return Point{x = x1, y = cy}
	}

	if handle == .SE {
		return Point{x = x1, y = y1}
	}

	if handle == .S {
		return Point{x = cx, y = y1}
	}

	if handle == .SW {
		return Point{x = x0, y = y1}
	}

	if handle == .W {
		return Point{x = x0, y = cy}
	}

	return Point{}
}

selection_handle_rect :: proc(center: Point) -> Rect {
	size := f32(HANDLE_SIZE_SCREEN)
	half := f32(size / 2.0)

	return Rect{x = center.x - half, y = center.y - half, width = size, height = size}
}
