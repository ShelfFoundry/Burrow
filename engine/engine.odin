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

engine_pointer_down :: proc(x, y: f32, button, buttons: i32) {
	pointer_down(&state.pointer, x, y, button, buttons, state.transform)
}

engine_pointer_move :: proc(x, y: f32, buttons: i32) {
	pointer_move(&state.pointer, x, y, buttons, state.transform)
}

engine_pointer_up :: proc(x, y: f32, button, buttons: i32) {
	pointer_up(&state.pointer, x, y, button, buttons, state.transform)
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

engine_add_rect :: proc(x, y, width, height: f32, r, g, b, a: f32) -> i32 {
	id := document_add_rect_auto_id(
		&state.document,
		state.document.next_object_id,
		x,
		y,
		width,
		height,
		RGBA{r = r, g = g, b = b, a = a},
	)

	return i32(id)
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
