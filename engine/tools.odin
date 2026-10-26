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

rect_tool_commit :: proc(interaction: ^Interaction_State) -> Interaction_Result {
	rect := rect_from_snapped_points(interaction.start_pointer_page, interaction.last_pointer_page)
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
