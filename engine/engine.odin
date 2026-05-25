package designer

Engine_State :: struct {
	initialized:     bool,
	viewport_width:  i32,
	viewport_height: i32,
	frame_count:     i32,

	document: Editor_Document,
	transform: Viewport_Transform,
}

state: Engine_State

engine_init :: proc(width: i32, height: i32) {
	state.initialized = true
	state.viewport_width = width
	state.viewport_height = height
	state.frame_count = 0

	document_init_blank(&state.document, 612.0, 792.0)
	engine_recompute_viewport_transform()
}

engine_resize :: proc(width: i32, height: i32) {
	state.viewport_width = width
	state.viewport_height = height

	if state.initialized {
		engine_recompute_viewport_transform()
	}
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
	canvas_size := Size{
		width = f32(state.viewport_width),
		height = f32(state.viewport_height),
	}

	page_size := Size{
		width = state.document.page.width,
		height = state.document.page.height,
	}

	state.transform = compute_initial_viewport(canvas_size, page_size, 48.0)
}
