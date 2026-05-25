package designer

MAX_OBJECTS :: 128

Object_Id :: distinct i32

Page :: struct {
    width: f32,
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
    x: f32,
    y: f32,
    width: f32,
    height: f32,

    fill_enabled: bool,
    fill: RGBA,

    stroke_enabled: bool,
    stroke: Stroke_Style,
}

Line_Object :: struct {
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,

    stroke: Stroke_Style,
}

Editor_Object :: struct {
    id: Object_Id,
    kind: Object_Kind,
    // NOTE: temp name placeholder
    name_id: i32,
    rect: Rect_Object,
    line: Line_Object,
}

Editor_Document :: struct {
    page: Page,
    object_count: int,
    objects: [MAX_OBJECTS]Editor_Object,
}

document_init_blank :: proc(document: ^Editor_Document, page_width, page_height: f32) {
    document.page.width = page_width
    document.page.height = page_height
    document.object_count = 0

	document_add_sample_rect(document)
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

document_add_sample_rect :: proc(document: ^Editor_Document) {
	if document.object_count >= MAX_OBJECTS {
		return
	}

	index := document.object_count

	document.objects[index] = Editor_Object {
		id = Object_Id(1),
		kind = .Rect,
		name_id = 1,
		rect = Rect_Object {
			x = 72.0,
			y = 72.0,
			width = 180.0,
			height = 120.0,
			fill_enabled = true,
			fill = RGBA {
				r = 0.90,
				g = 0.15,
				b = 0.15,
				a = 1.0
			},
			stroke_enabled = false,
		}
	}
	document.object_count += 1
}
