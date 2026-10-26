package designer

MAX_OBJECTS :: 128

Object_Id :: distinct i32

Page :: struct {
	width:  f32,
	height: f32,
}

RGBA :: struct {
	r: f32,
	g: f32,
	b: f32,
	a: f32,
}

Stroke_Style :: struct {
	color: RGBA,
	width: f32,
}

Object_Kind :: enum {
	Rect,
	Line,
}

Rect_Object :: struct {
	x:              f32,
	y:              f32,
	width:          f32,
	height:         f32,
	fill_enabled:   bool,
	fill:           RGBA,
	stroke_enabled: bool,
	stroke:         Stroke_Style,
}

Line_Object :: struct {
	x1:     f32,
	y1:     f32,
	x2:     f32,
	y2:     f32,
	stroke: Stroke_Style,
}

Editor_Object :: struct {
	id:      Object_Id,
	kind:    Object_Kind,
	// NOTE: temp name placeholder
	name_id: i32,
	rect:    Rect_Object,
	line:    Line_Object,
}

Editor_Document :: struct {
	page:           Page,
	object_count:   int,
	objects:        [MAX_OBJECTS]Editor_Object,
	next_object_id: i32,
	revision:       i32,
}

Edit_Command :: struct {
	action:  Edit_Action,
	targets: [MAX_SELECTED_OBJECTS]Object_Id,
	count:   int,
}

Edit_Action :: union {
	Edit_Action_Translate,
	Edit_Action_Add_Rect,
	Edit_Action_Add_Line,
}

Edit_Action_Translate :: struct {
	dx, dy: f32,
}

Edit_Action_Add_Rect :: struct {
	id:                  Object_Id,
	name_id:             i32,
	x, y, width, height: f32,
	fill:                RGBA,
}

Edit_Action_Add_Line :: struct {
	id:             Object_Id,
	name_id:        i32,
	x1, y1, x2, y2: f32,
	stroke:         Stroke_Style,
}

document_init_blank :: proc(document: ^Editor_Document, page_width, page_height: f32) {
	document.page.width = page_width
	document.page.height = page_height
	document.object_count = 0
	document.next_object_id = 1
	document.revision = 0
}

document_apply :: proc(document: ^Editor_Document, command: Edit_Command) -> bool {
	ok := true
	switch v in command.action {
	case Edit_Action_Translate:
		for i in 0 ..< command.count {
			document_translate_object_by_id(document, command.targets[i], v.dx, v.dy)
		}
	case Edit_Action_Add_Rect:
		ok = document_add_rect(document, v.id, v.name_id, v.x, v.y, v.width, v.height, v.fill)
	case Edit_Action_Add_Line:
		ok = document_add_line(document, v.id, v.name_id, v.x1, v.y1, v.x2, v.y2, v.stroke)
	case nil:
		ok = false
	}
	if ok {
		document.revision += 1
	}
	return ok
}

document_add_line_auto_id :: proc(
	document: ^Editor_Document,
	name_id: i32,
	x1, y1, x2, y2: f32,
	stroke: Stroke_Style,
) -> Object_Id {
	id := Object_Id(document.next_object_id)

	cmd := Edit_Command {
		action = Edit_Action_Add_Line {
			id = id,
			name_id = name_id,
			x1 = x1,
			y1 = y1,
			x2 = x2,
			y2 = y2,
			stroke = stroke,
		},
	}

	ok := document_apply(document, cmd)

	if !ok {
		return Object_Id(0)
	}

	document.next_object_id += 1
	return id
}

document_add_line :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	name_id: i32,
	x1, y1, x2, y2: f32,
	stroke: Stroke_Style,
) -> bool {
	if document.object_count >= MAX_OBJECTS {
		return false
	}

	index := document.object_count

	document.objects[index] = Editor_Object {
		id = id,
		kind = .Line,
		name_id = name_id,
		line = Line_Object{x1 = x1, y1 = y1, x2 = x2, y2 = y2, stroke = stroke},
	}

	document.object_count += 1
	return true
}

document_add_rect_auto_id :: proc(
	document: ^Editor_Document,
	name_id: i32,
	x, y, width, height: f32,
	fill: RGBA,
) -> Object_Id {
	id := Object_Id(document.next_object_id)

	cmd := Edit_Command {
		action = Edit_Action_Add_Rect {
			id = id,
			name_id = name_id,
			x = x,
			y = y,
			width = width,
			height = height,
			fill = fill,
		},
	}

	ok := document_apply(document, cmd)

	if !ok {
		return Object_Id(0)
	}

	document.next_object_id += 1
	return id
}

document_add_rect :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	name_id: i32,
	x, y, width, height: f32,
	fill: RGBA,
) -> bool {
	if document.object_count >= MAX_OBJECTS {
		return false
	}

	index := document.object_count

	document.objects[index] = Editor_Object {
		id = id,
		kind = .Rect,
		name_id = name_id,
		rect = Rect_Object {
			x = x,
			y = y,
			width = width,
			height = height,
			fill_enabled = true,
			fill = fill,
			stroke_enabled = false,
		},
	}

	document.object_count += 1
	return true
}

document_object_count :: proc(document: ^Editor_Document) -> i32 {
	return i32(document.object_count)
}

document_page_width :: proc(document: ^Editor_Document) -> f32 {
	return document.page.width
}

document_page_height :: proc(document: ^Editor_Document) -> f32 {
	return document.page.height
}

document_clear_objects :: proc(document: ^Editor_Document) {
	document.object_count = 0
	document.next_object_id = 1
}

document_get_object_by_index :: proc(document: ^Editor_Document, index: int) -> ^Editor_Object {
	if index < 0 || index >= document.object_count {
		return nil
	}
	return &document.objects[index]
}

document_get_object_by_id :: proc(document: ^Editor_Document, id: Object_Id) -> ^Editor_Object {
	for i in 0 ..< document.object_count {
		if document.objects[i].id == id {
			return &document.objects[i]
		}
	}
	return nil
}

object_translate :: proc(object: ^Editor_Object, dx, dy: f32) {
	if object == nil {
		return
	}

	switch object.kind {
	case .Rect:
		object.rect.x += dx
		object.rect.y += dy
	case .Line:
		object.line.x1 += dx
		object.line.y1 += dy
		object.line.x2 += dx
		object.line.y2 += dy
	}
}

document_translate_object_by_id :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	dx, dy: f32,
) -> bool {
	object := document_get_object_by_id(document, id)

	if object == nil {
		return false
	}

	object_translate(object, dx, dy)
	return true
}

document_translate_selection :: proc(
	document: ^Editor_Document,
	selection: ^Selection_State,
	dx, dy: f32,
) {
	if document == nil || selection == nil || selection.count == 0 {
		return
	}

	cmd := Edit_Command {
		action = Edit_Action_Translate{dx = dx, dy = dy},
	}

	for i in 0 ..< selection.count {
		cmd.targets[i] = selection.ids[i]
		cmd.count += 1
	}

	document_apply(document, cmd)
}
