package designer

Engine_State :: struct {
	initialized:     bool,
	viewport_width:  i32,
	viewport_height: i32,
	frame_count:     i32,
	document:        Editor_Document,
	transform:       Viewport_Transform,
	pointer:         Pointer_State,
	gpu:             Gpu_State,
	selection:       Selection_State,
}

state: Engine_State

engine_init :: proc(width: i32, height: i32) {
	state.initialized = true
	state.viewport_width = width
	state.viewport_height = height
	state.frame_count = 0

	document_init_blank(&state.document, 612.0, 792.0)
	engine_recompute_viewport_transform()
	gpu_init(&state.gpu)
}

engine_resize :: proc(width: i32, height: i32) {
	state.viewport_width = width
	state.viewport_height = height
}

engine_fit_page_to_viewport :: proc() {
	engine_recompute_viewport_transform()
}

engine_frame :: proc() -> i32 {
	state.frame_count += 1
	return state.frame_count
}

engine_viewport_width :: proc() -> i32 {
	return state.viewport_width
}

engine_viewport_height :: proc() -> i32 {
	return state.viewport_height
}

engine_is_initialzied :: proc() -> bool {
	return state.initialized
}

engine_page_width :: proc() -> f32 {
	return document_page_width(&state.document)
}

engine_page_height :: proc() -> f32 {
	return document_page_height(&state.document)
}

engine_object_count :: proc() -> i32 {
	return document_object_count(&state.document)
}

engine_zoom :: proc() -> f32 {
	return state.transform.zoom
}

engine_pan_x :: proc() -> f32 {
	return state.transform.pan_x
}

engine_pan_y :: proc() -> f32 {
	return state.transform.pan_y
}

engine_recompute_viewport_transform :: proc() {
	canvas_size := Size {
		width  = f32(state.viewport_width),
		height = f32(state.viewport_height),
	}

	page_size := Size {
		width  = state.document.page.width,
		height = state.document.page.height,
	}

	state.transform = compute_initial_viewport(canvas_size, page_size, 48.0)
}

engine_pointer_down :: proc(x, y: f32, button, buttons: i32, modifiers: i32) {
	pointer_down(&state.pointer, x, y, button, buttons, state.transform, modifiers)
}

engine_pointer_move :: proc(x, y: f32, buttons: i32, modifiers: i32) {
	pointer_move(&state.pointer, x, y, buttons, state.transform, modifiers)
}

engine_pointer_up :: proc(x, y: f32, button, buttons: i32, modifiers: i32) {
	pointer_up(&state.pointer, x, y, button, buttons, state.transform, modifiers)
}

engine_pointer_cancel :: proc() {
	pointer_cancel(&state.pointer)
}

engine_pointer_leave :: proc() {
	pointer_leave(&state.pointer)
}

engine_pointer_x :: proc() -> f32 {
	return state.pointer.x
}

engine_pointer_y :: proc() -> f32 {
	return state.pointer.y
}

engine_pointer_page_x :: proc() -> f32 {
	return state.pointer.page_x
}

engine_pointer_page_y :: proc() -> f32 {
	return state.pointer.page_y
}

engine_pointer_buttons :: proc() -> i32 {
	return state.pointer.buttons
}

engine_pointer_is_down :: proc() -> i32 {
	if state.pointer.is_down {
		return 1
	}

	return 0
}

engine_pointer_inside :: proc() -> i32 {
	if state.pointer.inside {
		return 1
	}

	return 0
}

engine_hit_test_point :: proc(page_x, page_y: f32) -> Hit_Result {
	point := Point {
		x = page_x,
		y = page_y,
	}

	tolerance := 6.0 / state.transform.zoom

	return hit_test_document(&state.document, point, tolerance)
}

engine_hit_test_current_pointer :: proc() -> Hit_Result {
	return engine_hit_test_point(state.pointer.page_x, state.pointer.page_y)
}

engine_gpu_is_initialized :: proc() -> bool {
	return gpu_is_initialized(&state.gpu)
}

engine_render_document :: proc() -> bool {
	return gpu_render_document(
		&state.gpu,
		&state.document,
		state.transform,
		f32(state.viewport_width),
		f32(state.viewport_height),
	)
}

engine_clear_objects :: proc() {
	document_clear_objects(&state.document)
}

engine_add_line :: proc(x1, y1, x2, y2: f32, r, g, b, a: f32, width: f32) -> i32 {
	id := document_add_line_auto_id(
		&state.document,
		state.document.next_object_id,
		x1,
		y1,
		x2,
		y2,
		Stroke_Style{color = RGBA{r = r, g = g, b = b, a = a}, width = width},
	)
	return i32(id)
}

engine_add_rect :: proc(x, y, width, height: f32, fill: RGBA) -> i32 {
	id := document_add_rect_auto_id(
		&state.document,
		state.document.next_object_id,
		x,
		y,
		width,
		height,
		fill,
	)

	return i32(id)
}

engine_add_full_rect :: proc(
	x, y, width, height: f32,
	fill: RGBA,
	stroke: RGBA,
	stroke_width: f32,
) -> i32 {
	id := document_add_rect_full_auto_id(
		&state.document,
		state.document.next_object_id,
		x,
		y,
		width,
		height,
		fill_enabled = true,
		fill = fill,
		stroke_enabled = true,
		stroke = Stroke_Style{color = stroke, width = stroke_width},
	)

	return i32(id)
}

engine_update_selection_from_current_pointer :: proc() -> i32 {
	hit := engine_hit_test_current_pointer()

	ctrl_down := (state.pointer.modifiers & MOD_CTRL) != 0

	if ctrl_down {
		if hit.kind == .Object {
			selection_toggle(&state.selection, hit.object_id)
			return i32(hit.object_id)
		}

		// Ctrl-click empty space preserves selection.
		return 0
	}

	if hit.kind == .Object {
		selection_replace(&state.selection, hit.object_id)
		return i32(hit.object_id)
	}

	selection_clear(&state.selection)
	return 0
}

engine_clear_selection :: proc() {
	selection_clear(&state.selection)
}

engine_has_selection :: proc() -> bool {
	return state.selection.count > 0
}

engine_gpu_clear_frame :: proc() -> bool {
	return gpu_clear_frame(&state.gpu)
}

engine_gpu_has_surface :: proc() -> bool {
	return state.gpu.surface != nil
}

engine_gpu_has_adapter :: proc() -> bool {
	return gpu_has_adapter(&state.gpu)
}

engine_gpu_has_device :: proc() -> bool {
	return gpu_has_device(&state.gpu)
}

engine_gpu_has_queue :: proc() -> bool {
	return gpu_has_queue(&state.gpu)
}

engine_gpu_configure_surface :: proc(width, height: i32) -> bool {
	return gpu_configure_surface(&state.gpu, width, height)
}

engine_gpu_surface_configured :: proc() -> bool {
	return state.gpu.surface_configured
}

engine_debug_first_object_bounds_x :: proc() -> f32 {
	object := document_get_object_by_index(&state.document, 0)

	if object == nil {
		return 0.0
	}

	bounds := object_bounds(object^)
	return bounds.x
}

engine_debug_first_object_bounds_y :: proc() -> f32 {
	object := document_get_object_by_index(&state.document, 0)

	if object == nil {
		return 0.0
	}

	bounds := object_bounds(object^)
	return bounds.y
}

engine_debug_first_object_bounds_width :: proc() -> f32 {
	object := document_get_object_by_index(&state.document, 0)

	if object == nil {
		return 0.0
	}

	bounds := object_bounds(object^)
	return bounds.width
}

engine_debug_first_object_bounds_height :: proc() -> f32 {
	object := document_get_object_by_index(&state.document, 0)

	if object == nil {
		return 0.0
	}

	bounds := object_bounds(object^)
	return bounds.height
}

engine_debug_hit_test_current_pointer_kind :: proc() -> i32 {
	hit := engine_hit_test_current_pointer()
	return i32(hit.kind)
}

engine_debug_hit_test_current_pointer_object_id :: proc() -> i32 {
	hit := engine_hit_test_current_pointer()

	if hit.kind != .Object {
		return 0
	}

	return i32(hit.object_id)
}

engine_debug_hit_test_point_object_id :: proc(page_x, page_y: f32) -> i32 {
	hit := engine_hit_test_point(page_x, page_y)

	if hit.kind != .Object {
		return 0
	}

	return i32(hit.object_id)
}
