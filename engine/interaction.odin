package designer

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
