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
}

document_init_blank :: proc(document: ^Editor_Document, page_width, page_height: f32) {
	document.page.width = page_width
	document.page.height = page_height
	document.object_count = 0
	document.next_object_id = 1
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

document_add_line_auto_id :: proc(
	document: ^Editor_Document,
	name_id: i32,
	x1, y1, x2, y2: f32,
	stroke: Stroke_Style,
) -> Object_Id {
	id := Object_Id(document.next_object_id)

	ok := document_add_line(document, id, name_id, x1, y1, x2, y2, stroke)

	if !ok {
		return Object_Id(0)
	}

	document.next_object_id += 1
	return id
}

document_add_rect_full :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	name_id: i32,
	x, y, width, height: f32,
	fill_enabled: bool,
	fill: RGBA,
	stroke_enabled: bool,
	stroke: Stroke_Style,
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
			fill_enabled = fill_enabled,
			fill = fill,
			stroke_enabled = stroke_enabled,
			stroke = stroke,
		},
	}

	document.object_count += 1
	return true
}

document_add_rect :: proc(
	document: ^Editor_Document,
	id: Object_Id,
	name_id: i32,
	x, y, width, height: f32,
	fill: RGBA,
) -> bool {
	return document_add_rect_full(
		document,
		id,
		name_id,
		x,
		y,
		width,
		height,
		true,
		fill,
		false,
		Stroke_Style{},
	)
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

document_add_rect_auto_id :: proc(
	document: ^Editor_Document,
	name_id: i32,
	x, y, width, height: f32,
	fill: RGBA,
) -> Object_Id {
	id := Object_Id(document.next_object_id)

	ok := document_add_rect(document, id, name_id, x, y, width, height, fill)

	if !ok {
		return Object_Id(0)
	}

	document.next_object_id += 1
	return id
}

document_add_rect_full_auto_id :: proc(
	document: ^Editor_Document,
	name_id: i32,
	x, y, width, height: f32,
	fill_enabled: bool,
	fill: RGBA,
	stroke_enabled: bool,
	stroke: Stroke_Style,
) -> Object_Id {
	id := Object_Id(document.next_object_id)

	ok := document_add_rect_full(
		document,
		id,
		name_id,
		x,
		y,
		width,
		height,
		fill_enabled,
		fill,
		stroke_enabled,
		stroke,
	)

	if !ok {
		return Object_Id(0)
	}

	document.next_object_id += 1
	return id
}
