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
designer_pointer_down :: proc(x, y: f32, button, buttons: i32) {
	engine_pointer_down(x, y, button, buttons)
}

@(export)
designer_pointer_move :: proc(x, y: f32, buttons: i32) {
	engine_pointer_move(x, y, buttons)
}

@(export)
designer_pointer_up :: proc(x, y: f32, button, buttons: i32) {
	engine_pointer_up(x, y, button, buttons)
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
designer_gpu_is_initialized :: proc() -> i32 {
	if engine_gpu_is_initialized() {
		return 1
	}
	return 0
}

@(export)
designer_gpu_clear_r :: proc() -> f64 {
	return engine_gpu_clear_r()
}

@(export)
designer_gpu_clear_g :: proc() -> f64 {
	return engine_gpu_clear_g()
}

@(export)
designer_gpu_clear_b :: proc() -> f64 {
	return engine_gpu_clear_b()
}

@(export)
designer_gpu_clear_a :: proc() -> f64 {
	return engine_gpu_clear_a()
}

@(export)
designer_gpu_clear_frame :: proc() -> i32 {
	if engine_gpu_clear_frame() {
		return 1
	}

	return 0
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

main :: proc() {}
