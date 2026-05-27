package designer

MIN_RECT_SIZE :: 4.0
MAX_RESIZE_SNAPSHOT_OBJECTS :: 128

Interaction_Mode :: enum {
	Idle,
	Moving_Selection,
	Resize_Handle,
	Line_Handle,
}

Interaction_State :: struct {
	mode:                 Interaction_Mode,
	start_pointer_page:   Point,
	last_pointer_page:    Point,
	start_pointer_screen: Point,
	last_pointer_screen:  Point,
	active_object_id:     Object_Id,
	resize_handle:        Resize_Handle,
	line_handle:          Line_Handle,
	group_resize:         Group_Resize_State,
	start_rect:           Rect_Object,
	has_start_rect:       bool,
}

Interaction_Result_Kind :: enum {
	None,
	Selection_Changed,
	Resize_Handle,
	Line_Handle,
	Move_Selection,
}

Interaction_Result :: struct {
	kind:          Interaction_Result_Kind,
	object_id:     Object_Id,
	resize_handle: Resize_Handle,
	line_handle:   Line_Handle,
}

Resize_Object_Snapshot :: struct {
	id:   Object_Id,
	kind: Object_Kind,
	rect: Rect_Object,
	line: Line_Object,
}

Group_Resize_State :: struct {
	active:         bool,
	start_bounds:   Rect,
	current_bounds: Rect,
	count:          int,
	objects:        [MAX_RESIZE_SNAPSHOT_OBJECTS]Resize_Object_Snapshot,
}
