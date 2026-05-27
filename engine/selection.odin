package designer

MAX_SELECTED_OBJECTS :: 128

Selection_State :: struct {
	count: int,
	ids:   [MAX_SELECTED_OBJECTS]Object_Id,
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
