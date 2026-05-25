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

main :: proc() {}
