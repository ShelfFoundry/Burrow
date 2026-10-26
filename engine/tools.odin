package designer

select_tool_pointer_down :: proc() -> Interaction_Result {
	// NOTE: handles first, then objects
	// falls back to the document hit test when no handle
	// is under the pointer
	hit := engine_hit_test_interaction_at_current_pointer()

	#partial switch hit.kind {
	case .Resize_Handle:
		engine_start_resize_interaction(hit.object_id, hit.resize_handle)
		return Interaction_Result {
			kind = .Resize_Handle,
			object_id = hit.object_id,
			resize_handle = hit.resize_handle,
		}
	case .Line_Handle:
		engine_start_line_handle_interaction(hit.object_id, hit.line_handle)
		return Interaction_Result {
			kind = .Line_Handle,
			object_id = hit.object_id,
			line_handle = hit.line_handle,
		}
	}

	// NOTE: modifier-click toggles the hit object and never
	// starts a move. On empty space it leaves selection alone.
	if engine_multi_select_modifier_down() {
		if hit.kind == .Object {
			selection_toggle(&state.selection, hit.object_id)
		}
		return Interaction_Result{kind = .Selection_Changed, object_id = hit.object_id}
	}

	// NOTE: inside a multi-selections bounds move whole group
	if engine_pointer_inside_selection_group_bounds() {
		engine_start_move_interaction(Object_Id(0))
		return Interaction_Result{kind = .Move_Selection}
	}

	if hit.kind == .Object {
		if !selection_contains(&state.selection, hit.object_id) {
			selection_replace(&state.selection, hit.object_id)
		}
		engine_start_move_interaction(hit.object_id)
		return Interaction_Result{kind = .Move_Selection, object_id = hit.object_id}
	}

	selection_clear(&state.selection)
	return Interaction_Result{kind = .Selection_Changed}
}

rect_tool_pointer_down :: proc() -> Interaction_Result {
	selection_clear(&state.selection)
	engine_begin_interaction(.Creating_Rect)
	return Interaction_Result{kind = .Creating_Rect}
}

rect_tool_object :: proc(interaction: ^Interaction_State) -> Editor_Object {
	rect := rect_from_snapped_points(interaction.start_pointer_page, interaction.last_pointer_page)

	return Editor_Object {
		kind = .Rect,
		rect = Rect_Object {
			x = rect.x,
			y = rect.y,
			width = rect.width,
			height = rect.height,
			fill_enabled = true,
			fill = RGBA{0.0, 0.0, 0.0, 1.0},
		},
	}
}

rect_tool_commit :: proc(interaction: ^Interaction_State) -> Interaction_Result {
	rect := rect_tool_object(interaction).rect
	if rect.width < MIN_RECT_SIZE || rect.height < MIN_RECT_SIZE {
		return Interaction_Result{kind = .None}
	}

	id := document_add_rect_auto_id(
		&state.document,
		state.document.next_object_id,
		rect.x,
		rect.y,
		rect.width,
		rect.height,
		RGBA{0.0, 0.0, 0.0, 1.0},
	)
	if id == Object_Id(0) {
		return Interaction_Result{kind = .Document_Full}
	}

	selection_replace(&state.selection, id)
	engine_set_tool(.Select)
	return Interaction_Result{kind = .Object_Created, object_id = id}
}

line_tool_pointer_down :: proc() -> Interaction_Result {
	selection_clear(&state.selection)
	engine_begin_interaction(.Creating_Line)
	return Interaction_Result{kind = .Creating_Line}
}

line_tool_object :: proc(interaction: ^Interaction_State) -> Editor_Object {
	start := interaction.start_pointer_page
	end := interaction.last_pointer_page

	if engine_shift_down() {
		end = snap_point_to_45_from_anchor(start, end)
	}

	return Editor_Object {
		kind = .Line,
		line = Line_Object {
			x1 = start.x,
			y1 = start.y,
			x2 = end.x,
			y2 = end.y,
			stroke = Stroke_Style{color = RGBA{0.0, 0.0, 0.0, 1.0}, width = 2.0},
		},
	}
}

line_tool_commit :: proc(interaction: ^Interaction_State) -> Interaction_Result {
	line := line_tool_object(interaction).line

	dx := line.x2 - line.x1
	dy := line.y2 - line.y1
	if dx * dx + dy * dy < MIN_LINE_LENGTH * MIN_LINE_LENGTH {
		return Interaction_Result{kind = .None}
	}

	id := document_add_line_auto_id(
		&state.document,
		state.document.next_object_id,
		line.x1,
		line.y1,
		line.x2,
		line.y2,
		line.stroke,
	)
	if id == Object_Id(0) {
		return Interaction_Result{kind = .Document_Full}
	}

	selection_replace(&state.selection, id)
	engine_set_tool(.Select)
	return Interaction_Result{kind = .Object_Created, object_id = id}
}
