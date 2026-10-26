package designer

MIN_RECT_SIZE :: 4.0
MIN_LINE_LENGTH :: 4.0

Interaction_Mode :: enum {
	Idle,
	Moving_Selection,
	Resize_Handle,
	Line_Handle,
	Creating_Rect,
	Creating_Line,
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
	snapshot:             Drag_Snapshot,
}

Interaction_Result_Kind :: enum {
	None,
	Selection_Changed,
	Resize_Handle,
	Line_Handle,
	Move_Selection,
	Creating_Rect,
	Creating_Line,
	Object_Created,
	Document_Full,
}

Interaction_Result :: struct {
	kind:          Interaction_Result_Kind,
	object_id:     Object_Id,
	resize_handle: Resize_Handle,
	line_handle:   Line_Handle,
}

