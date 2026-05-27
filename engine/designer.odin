package designer

@(export)
designer_version :: proc() -> i32 {
	return 1
}

@(export)
designer_init :: proc(width: i32, height: i32) -> i32 {
	engine_init(width, height)
	return 1
}

@(export)
designer_is_initialized :: proc() -> i32 {
	if engine_is_initialzied() {
		return 1
	}
	return 0
}

@(export)
designer_resize :: proc(width: i32, height: i32) {
	engine_resize(width, height)
}

@(export)
designer_fit_page_to_viewport :: proc() {
	engine_fit_page_to_viewport()
}

@(export)
designer_frame :: proc() -> i32 {
	return engine_frame()
}

@(export)
designer_viewport_width :: proc() -> i32 {
	return engine_viewport_width()
}

@(export)
designer_viewport_height :: proc() -> i32 {
	return engine_viewport_height()
}

@(export)
designer_page_width :: proc() -> f32 {
	return engine_page_width()
}

@(export)
designer_page_height :: proc() -> f32 {
	return engine_page_height()
}

@(export)
designer_object_count :: proc() -> i32 {
	return engine_object_count()
}

@(export)
designer_zoom :: proc() -> f32 {
	return engine_zoom()
}

@(export)
designer_pan_x :: proc() -> f32 {
	return engine_pan_x()
}

@(export)
designer_pan_y :: proc() -> f32 {
	return engine_pan_y()
}

@(export)
designer_pointer_down_interaction :: proc() -> i32 {
	result := engine_pointer_down_interaction()
	return i32(result.kind)
}

@(export)
designer_pointer_move_interaction :: proc() -> i32 {
	result := engine_pointer_move_interaction()
	return i32(result.kind)
}

@(export)
designer_pointer_up_interaction :: proc() -> i32 {
	result := engine_pointer_up_interaction()
	return i32(result.kind)
}

@(export)
designer_pointer_down :: proc(x, y: f32, button, buttons: i32, modifiers: i32) {
	engine_pointer_down(x, y, button, buttons, modifiers)
}

@(export)
designer_pointer_move :: proc(x, y: f32, buttons: i32, modifiers: i32) {
	engine_pointer_move(x, y, buttons, modifiers)
}

@(export)
designer_pointer_up :: proc(x, y: f32, button, buttons: i32, modifiers: i32) {
	engine_pointer_up(x, y, button, buttons, modifiers)
}

@(export)
designer_pointer_cancel :: proc() {
	engine_pointer_cancel()
}

@(export)
designer_pointer_leave :: proc() {
	engine_pointer_leave()
}

@(export)
designer_pointer_x :: proc() -> f32 {
	return engine_pointer_x()
}

@(export)
designer_pointer_y :: proc() -> f32 {
	return engine_pointer_y()
}

@(export)
designer_pointer_page_x :: proc() -> f32 {
	return engine_pointer_page_x()
}

@(export)
designer_pointer_page_y :: proc() -> f32 {
	return engine_pointer_page_y()
}

@(export)
designer_pointer_buttons :: proc() -> i32 {
	return engine_pointer_buttons()
}

@(export)
designer_pointer_is_down :: proc() -> i32 {
	return engine_pointer_is_down()
}

@(export)
designer_pointer_inside :: proc() -> i32 {
	return engine_pointer_inside()
}

@(export)
designer_update_selection_from_current_pointer :: proc() -> i32 {
	return engine_update_selection_from_current_pointer()
}

@(export)
designer_selection_count :: proc() -> i32 {
	return i32(state.selection.count)
}

@(export)
designer_selection_id_at :: proc(index: i32) -> i32 {
	if index < 0 || int(index) >= state.selection.count {
		return 0
	}

	return i32(state.selection.ids[index])
}

@(export)
designer_selection_contains :: proc(id: i32) -> i32 {
	if selection_contains(&state.selection, Object_Id(id)) {
		return 1
	}

	return 0
}

@(export)
designer_clear_selection :: proc() {
	engine_clear_selection()
}

@(export)
designer_gpu_is_initialized :: proc() -> i32 {
	if engine_gpu_is_initialized() {
		return 1
	}
	return 0
}

@(export)
designer_gpu_clear_frame :: proc() -> i32 {
	if engine_gpu_clear_frame() {
		return 1
	}

	return 0
}

@(export)
designer_debug_hit_test_current_pointer_kind :: proc() -> i32 {
	return engine_debug_hit_test_current_pointer_kind()
}

@(export)
designer_debug_hit_test_current_pointer_object_id :: proc() -> i32 {
	return engine_debug_hit_test_current_pointer_object_id()
}

@(export)
designer_debug_hit_test_point_object_id :: proc(page_x, page_y: f32) -> i32 {
	return engine_debug_hit_test_point_object_id(page_x, page_y)
}

@(export)
designer_debug_first_object_bounds_x :: proc() -> f32 {
	return engine_debug_first_object_bounds_x()
}

@(export)
designer_debug_first_object_bounds_y :: proc() -> f32 {
	return engine_debug_first_object_bounds_y()
}

@(export)
designer_debug_first_object_bounds_width :: proc() -> f32 {
	return engine_debug_first_object_bounds_width()
}

@(export)
designer_debug_first_object_bounds_height :: proc() -> f32 {
	return engine_debug_first_object_bounds_height()
}

@(export)
designer_gpu_has_surface :: proc() -> i32 {
	if engine_gpu_has_surface() {
		return 1
	}

	return 0
}

@(export)
designer_gpu_has_adapter :: proc() -> i32 {
	if engine_gpu_has_adapter() {
		return 1
	}

	return 0
}

@(export)
designer_gpu_has_device :: proc() -> i32 {
	if engine_gpu_has_device() {
		return 1
	}

	return 0
}

@(export)
designer_gpu_has_queue :: proc() -> i32 {
	if engine_gpu_has_queue() {
		return 1
	}

	return 0
}

@(export)
designer_gpu_configure_surface :: proc(width: i32, height: i32) -> i32 {
	if engine_gpu_configure_surface(width, height) {
		return 1
	}

	return 0
}

@(export)
designer_gpu_surface_configured :: proc() -> i32 {
	if engine_gpu_surface_configured() {
		return 1
	}

	return 0
}

@(export)
designer_debug_interaction_hit_kind :: proc() -> i32 {
	return engine_debug_interaction_hit_kind()
}

@(export)
designer_debug_interaction_hit_object_id :: proc() -> i32 {
	return engine_debug_interaction_hit_object_id()
}

@(export)
designer_debug_interaction_hit_resize_handle :: proc() -> i32 {
	return engine_debug_interaction_hit_resize_handle()
}

@(export)
designer_debug_interaction_hit_line_handle :: proc() -> i32 {
	return engine_debug_interaction_hit_line_handle()
}

@(export)
designer_render_document :: proc() -> i32 {
	if engine_render_document() {
		return 1
	}
	return 0
}

@(export)
designer_clear_objects :: proc() {
	engine_clear_objects()
}

@(export)
designer_add_line :: proc(x1, y1, x2, y2: f32, r, g, b, a: f32, width: f32) -> i32 {
	return engine_add_line(x1, y1, x2, y2, r, g, b, a, width)
}

@(export)
designer_add_rect :: proc(x, y, width, height: f32, r, g, b, a: f32) -> i32 {
	return engine_add_rect(x, y, width, height, RGBA{r = r, g = g, b = b, a = a})
}

@(export)
designer_add_full_rect :: proc(
	x, y, width, height: f32,
	fill_r, fill_g, fill_b, fill_a, stroke_r, stroke_g, stroke_b, stroke_a, stroke_width: f32,
) -> i32 {
	return engine_add_full_rect(
		x,
		y,
		width,
		height,
		RGBA{r = fill_r, g = fill_g, b = fill_b, a = fill_a},
		RGBA{r = stroke_r, g = stroke_g, b = stroke_b, a = stroke_a},
		stroke_width,
	)
}

main :: proc() {}
