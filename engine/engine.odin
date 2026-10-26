package designer

Engine_State :: struct {
	initialized:      bool,
	viewport_width:   i32,
	viewport_height:  i32,
	frame_count:      i32,
	document:         Editor_Document,
	transform:        Viewport_Transform,
	pointer:          Pointer_State,
	gpu:              Gpu_State,
	selection:        Selection_State,
	interaction:      Interaction_State,
	last_interaction: Interaction_Result,
	active_tool:      Tool,
}

state: Engine_State

Tool :: enum {
	Select,
	Rect,
	Line,
	Pan,
}

engine_init :: proc(width: i32, height: i32) {
	state.initialized = true
	state.viewport_width = width
	state.viewport_height = height
	state.frame_count = 0

	document_init_blank(&state.document, 672.0, 960.0)
	engine_recompute_viewport_transform()
	gpu_init(&state.gpu)
	engine_clear_interaction()
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

engine_is_initialized :: proc() -> bool {
	return state.initialized
}

engine_document_revision :: proc() -> i32 {
	return state.document.revision
}

engine_object_id_at :: proc(index: i32) -> Object_Id {
	obj := document_get_object_by_index(&state.document, int(index))
	if obj == nil {
		return 0
	}
	return obj.id
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

engine_pointer_down_interaction :: proc() -> Interaction_Result {
	// NOTE: never start a gesture on top of another live one
	// it would leave its uncommitted preview in the document
	engine_cancel_interaction()

	result: Interaction_Result

	switch state.active_tool {
	case .Select:
		result = select_tool_pointer_down()
	case .Rect:
		result = rect_tool_pointer_down()
	case .Line:
		result = line_tool_pointer_down()
	case .Pan:
		// TODO: add pan later
		result = Interaction_Result {
			kind = .None,
		}
	}

	state.last_interaction = result
	return result
}

engine_begin_interaction :: proc(mode: Interaction_Mode) {
	state.interaction = Interaction_State{}
	state.interaction.mode = mode
	engine_set_interaction_pointer_start()
}

engine_start_move_interaction :: proc(active_object_id: Object_Id) {
	engine_begin_interaction(.Moving_Selection)
	state.interaction.active_object_id = active_object_id
	drag_snapshot_capture(&state.interaction.snapshot, &state.document, &state.selection)
}

engine_pointer_move_interaction :: proc() -> Interaction_Result {
	switch state.interaction.mode {
	case .Creating_Rect:
		engine_set_interaction_pointer_last()
		state.last_interaction = Interaction_Result {
			kind = .Creating_Rect,
		}
	case .Creating_Line:
		engine_set_interaction_pointer_last()
		state.last_interaction = Interaction_Result {
			kind = .Creating_Line,
		}
	case .Moving_Selection:
		current := engine_current_page_pointer()
		dx := current.x - state.interaction.start_pointer_page.x
		dy := current.y - state.interaction.start_pointer_page.y

		drag_snapshot_apply_translate(&state.interaction.snapshot, &state.document, dx, dy)

		engine_set_interaction_pointer_last()

		state.last_interaction = Interaction_Result {
			kind      = .Move_Selection,
			object_id = state.interaction.active_object_id,
		}
	case .Resize_Handle:
		ok := engine_drag_resize_handle_by_current_pointer()

		state.last_interaction = Interaction_Result {
			kind          = .Resize_Handle,
			object_id     = state.interaction.active_object_id,
			resize_handle = state.interaction.resize_handle,
		}

		if !ok {
			state.last_interaction.kind = .None
		}
	case .Line_Handle:
		ok := engine_drag_line_handle_to_current_pointer()

		state.last_interaction = Interaction_Result {
			kind        = .Line_Handle,
			object_id   = state.interaction.active_object_id,
			line_handle = state.interaction.line_handle,
		}

		if !ok {
			state.last_interaction.kind = .None
		}
	case .Idle:
		state.last_interaction = Interaction_Result {
			kind = .None,
		}
	}
	return state.last_interaction
}

engine_pointer_up_interaction :: proc() -> Interaction_Result {
	interaction := &state.interaction
	result := Interaction_Result {
		kind = .None,
	}

	switch interaction.mode {
	case .Moving_Selection:
		engine_commit_drag()
		result = Interaction_Result {
			kind      = .Move_Selection,
			object_id = interaction.active_object_id,
		}
	case .Resize_Handle:
		engine_commit_drag()
		result = Interaction_Result {
			kind          = .Resize_Handle,
			object_id     = interaction.active_object_id,
			resize_handle = interaction.resize_handle,
		}
	case .Line_Handle:
		engine_commit_drag()
		result = Interaction_Result {
			kind        = .Line_Handle,
			object_id   = interaction.active_object_id,
			line_handle = interaction.line_handle,
		}
	case .Creating_Rect:
		result = rect_tool_commit(interaction)
	case .Creating_Line:
		result = line_tool_commit(interaction)
	case .Idle:
	}

	engine_clear_interaction()
	state.last_interaction = result
	return result
}

engine_pointer_down :: proc(x, y: f32, button, buttons: i32, modifiers: i32) {
	pointer_down(
		&state.pointer,
		x,
		y,
		button,
		buttons,
		state.transform,
		input_modifiers_from_i32(modifiers),
	)
}

engine_pointer_move :: proc(x, y: f32, buttons: i32, modifiers: i32) {
	pointer_move(
		&state.pointer,
		x,
		y,
		buttons,
		state.transform,
		input_modifiers_from_i32(modifiers),
	)
}

engine_pointer_up :: proc(x, y: f32, button, buttons: i32, modifiers: i32) {
	pointer_up(
		&state.pointer,
		x,
		y,
		button,
		buttons,
		state.transform,
		input_modifiers_from_i32(modifiers),
	)
}

engine_pointer_cancel :: proc() {
	pointer_cancel(&state.pointer)
	engine_cancel_interaction()
}

engine_cancel_interaction :: proc() -> bool {
	if state.interaction.mode == .Idle {
		return false
	}
	drag_snapshot_restore(&state.interaction.snapshot, &state.document)
	engine_clear_interaction()

	state.last_interaction = Interaction_Result {
		kind = .None,
	}
	return true
}

engine_commit_drag :: proc() -> bool {
	snapshot := &state.interaction.snapshot
	if snapshot.count == 0 {
		return false
	}

	action := Edit_Action_Set_Objects {
		count = snapshot.count,
	}
	changed := false

	for i in 0 ..< snapshot.count {
		before := snapshot.objects[i]
		object := document_get_object_by_id(&state.document, before.id)
		if object == nil {
			return false
		}

		action.before[i] = before
		action.after[i] = object^
		if object^ != before {
			changed = true
		}
	}

	if !changed {
		return false
	}
	return document_execute(&state.document, Edit_Command{action = action})
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

engine_drag_line_handle_to_current_pointer :: proc() -> bool {
	if state.interaction.mode != .Line_Handle {
		return false
	}

	if state.interaction.active_object_id == Object_Id(0) {
		return false
	}

	if state.interaction.line_handle == .None {
		return false
	}

	object := document_get_object_by_id(&state.document, state.interaction.active_object_id)

	if object == nil || object.kind != .Line {
		return false
	}

	target := engine_current_page_pointer()

	if engine_shift_down() {
		anchor := Point{}

		if state.interaction.line_handle == .Start {
			anchor = Point {
				x = object.line.x2,
				y = object.line.y2,
			}
		} else if state.interaction.line_handle == .End {
			anchor = Point {
				x = object.line.x1,
				y = object.line.y1,
			}
		}

		target = snap_point_to_45_from_anchor(anchor, target)
	}

	return document_move_line_handle_by_id(
		&state.document,
		state.interaction.active_object_id,
		state.interaction.line_handle,
		target.x,
		target.y,
	)
}

engine_hit_test_interaction_at_current_pointer :: proc() -> Hit_Result {
	screen_point := engine_current_screen_pointer()

	handle_hit := hit_test_selection_handles(
		&state.document,
		&state.selection,
		state.transform,
		screen_point,
	)

	if handle_hit.kind != .None {
		return handle_hit
	}

	return engine_hit_test_current_pointer()
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
	preview_obj: Maybe(Editor_Object)
	#partial switch state.interaction.mode {
	case .Creating_Rect:
		preview_obj = rect_tool_object(&state.interaction)
	case .Creating_Line:
		preview_obj = line_tool_object(&state.interaction)
	}

	return gpu_render_document(
		&state.gpu,
		&state.document,
		&state.selection,
		state.transform,
		f32(state.viewport_width),
		f32(state.viewport_height),
		preview_obj,
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

engine_pointer_inside_selection_group_bounds :: proc() -> bool {
	if state.selection.count <= 1 {
		return false
	}

	bounds, ok := selection_bounds(&state.document, &state.selection)

	if !ok {
		return false
	}

	point := engine_current_page_pointer()
	return point_in_rect(point, bounds)
}

engine_select_object_by_id :: proc(id: Object_Id, mode: Selection_Mode) -> bool {
	obj := document_get_object_by_id(&state.document, id)
	if obj == nil {
		return false
	}
	switch mode {
	case .Replace:
		selection_replace(&state.selection, obj.id)
	case .Toggle:
		selection_toggle(&state.selection, obj.id)
	}
	return true
}

engine_clear_interaction :: proc() {
	state.interaction = Interaction_State{}
}

engine_clear_selection :: proc() {
	selection_clear(&state.selection)
}

engine_has_selection :: proc() -> bool {
	return state.selection.count > 0
}

engine_get_object :: proc(id: i32) -> ^Editor_Object {
	return document_get_object_by_id(&state.document, Object_Id(id))
}

engine_set_rect_geometry :: proc(id: i32, x, y, width, height: f32) -> bool {
	if state.interaction.mode != .Idle {
		return false
	}
	return document_set_rect_geometry_by_id(&state.document, Object_Id(id), x, y, width, height)
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

engine_debug_interaction_hit_kind :: proc() -> i32 {
	hit := engine_hit_test_interaction_at_current_pointer()
	return i32(hit.kind)
}

engine_debug_interaction_hit_object_id :: proc() -> i32 {
	hit := engine_hit_test_interaction_at_current_pointer()
	return i32(hit.object_id)
}

engine_debug_interaction_hit_resize_handle :: proc() -> i32 {
	hit := engine_hit_test_interaction_at_current_pointer()
	return i32(hit.resize_handle)
}

engine_debug_interaction_hit_line_handle :: proc() -> i32 {
	hit := engine_hit_test_interaction_at_current_pointer()
	return i32(hit.line_handle)
}

engine_multi_select_modifier_down :: proc() -> bool {
	return .Shift in state.pointer.modifiers
}

engine_shift_down :: proc() -> bool {
	return .Shift in state.pointer.modifiers
}

engine_set_tool :: proc(tool: Tool) {
	state.active_tool = tool
}

engine_tool :: proc() -> Tool {
	return state.active_tool
}

engine_last_interaction_object_id :: proc() -> Object_Id {
	return state.last_interaction.object_id
}

engine_undo :: proc() -> bool {
	if state.interaction.mode != .Idle {
		return false
	}

	if !document_undo(&state.document) {
		return false
	}

	selection_prune(&state.selection, &state.document)
	return true
}

engine_redo :: proc() -> bool {
	if state.interaction.mode != .Idle {
		return false
	}

	if !document_redo(&state.document) {
		return false
	}

	selection_prune(&state.selection, &state.document)
	return true
}
