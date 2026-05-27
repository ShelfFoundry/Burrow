package designer

MOD_CTRL :: 1
MOD_SHIFT :: 2
MOD_ALT :: 4
MOD_META :: 8

Pointer_State :: struct {
	x:         f32,
	y:         f32,
	page_x:    f32,
	page_y:    f32,
	button:    i32,
	buttons:   i32,
	is_down:   bool,
	inside:    bool,
	modifiers: i32,
}

Input_Modifier :: enum i32 {
	Ctrl  = 1,
	Shift = 2,
	Alt   = 4,
	Meta  = 8,
}

pointer_set_position :: proc(pointer: ^Pointer_State, x, y: f32, transform: Viewport_Transform) {
	pointer.x = x
	pointer.y = y

	page_point := screen_to_page(Point{x = x, y = y}, transform)

	pointer.page_x = page_point.x
	pointer.page_y = page_point.y
}

pointer_down :: proc(
	pointer: ^Pointer_State,
	x, y: f32,
	button, buttons: i32,
	transform: Viewport_Transform,
	modifiers: i32,
) {
	pointer_set_position(pointer, x, y, transform)

	pointer.button = button
	pointer.buttons = buttons
	pointer.is_down = true
	pointer.inside = true
	pointer.modifiers = modifiers
}

pointer_move :: proc(
	pointer: ^Pointer_State,
	x, y: f32,
	buttons: i32,
	transform: Viewport_Transform,
	modifiers: i32,
) {
	pointer_set_position(pointer, x, y, transform)

	pointer.button = -1
	pointer.buttons = buttons
	pointer.is_down = buttons != 0
	pointer.inside = true
	pointer.modifiers = modifiers
}

pointer_up :: proc(
	pointer: ^Pointer_State,
	x, y: f32,
	button, buttons: i32,
	transform: Viewport_Transform,
	modifiers: i32,
) {
	pointer_set_position(pointer, x, y, transform)

	pointer.button = button
	pointer.buttons = buttons
	pointer.is_down = false
	pointer.inside = true
	pointer.modifiers = modifiers
}

pointer_cancel :: proc(pointer: ^Pointer_State) {
	pointer.button = -1
	pointer.buttons = 0
	pointer.is_down = false
	pointer.inside = false
}

pointer_leave :: proc(pointer: ^Pointer_State) {
	pointer.inside = false
	pointer.is_down = pointer.buttons != 0
}
