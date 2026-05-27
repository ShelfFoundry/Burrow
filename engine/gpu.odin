package designer

import "base:runtime"
import wgpu "vendor:wgpu"

PAGE_SHADER_BYTES :: #load("page.wgsl")
PAGE_SHADER :: string(PAGE_SHADER_BYTES)

MAX_RENDER_PRIMITIVES :: 1024
VERTICES_PER_PRIMITIVE :: 6
MAX_RENDER_VERTICES :: MAX_RENDER_PRIMITIVES * VERTICES_PER_PRIMITIVE

SELECTION_STROKE_WIDTH_SCREEN :: 2.0
SELECTION_COLOR :: [4]f32{0.1, 0.45, 1.0, 1.0}
SELECTION_LINE_EXTRA_WIDTH_SCREEN :: 2.0

HANDLE_SIZE_SCREEN :: 8.0
HANDLE_STROKE_WIDTH_SCREEN :: 1.0
HANDLE_FILL_COLOR :: [4]f32{1.0, 1.0, 1.0, 1.0}
HANDLE_STROKE_COLOR :: [4]f32{0.1, 0.45, 1.0, 1.0}

Gpu_State :: struct {
	initialized:             bool,
	has_surface:             bool,
	adapter_ready:           bool,
	device_ready:            bool,
	queue_ready:             bool,
	surface_configured:      bool,
	adapter_request_started: bool,
	device_request_started:  bool,
	instance:                wgpu.Instance,
	adapter:                 wgpu.Adapter,
	device:                  wgpu.Device,
	queue:                   wgpu.Queue,
	surface:                 wgpu.Surface,
	format:                  wgpu.TextureFormat,
	clear_color:             RGBA,
	page_pipeline_ready:     bool,
	page_pipeline:           wgpu.RenderPipeline,
	page_vertex_buffer:      wgpu.Buffer,
}

Vertex :: struct {
	position: [2]f32,
	color:    [4]f32,
}

gpu_create_rect_vertex_buffer :: proc(gpu: ^Gpu_State) -> bool {
	if gpu == nil || gpu.device == nil {
		return false
	}

	buffer_size := u64(size_of(Vertex) * MAX_RENDER_VERTICES)

	descriptor := wgpu.BufferDescriptor {
		label            = "page vertex buffer",
		usage            = {.Vertex, .CopyDst},
		size             = buffer_size,
		mappedAtCreation = false,
	}

	gpu.page_vertex_buffer = wgpu.DeviceCreateBuffer(gpu.device, &descriptor)

	return gpu.page_vertex_buffer != nil
}

gpu_create_page_pipeline :: proc(gpu: ^Gpu_State) -> bool {
	if gpu == nil || gpu.device == nil || gpu.format == .Undefined {
		return false
	}

	shader := gpu_create_shader_module(gpu)

	if shader == nil {
		return false
	}

	attributes := [?]wgpu.VertexAttribute {
		wgpu.VertexAttribute{format = .Float32x2, offset = 0, shaderLocation = 0},
		wgpu.VertexAttribute{format = .Float32x4, offset = 8, shaderLocation = 1},
	}

	vertex_buffer_layout := wgpu.VertexBufferLayout {
		arrayStride    = size_of(Vertex),
		stepMode       = .Vertex,
		attributeCount = len(attributes),
		attributes     = &attributes[0],
	}

	color_target := wgpu.ColorTargetState {
		format    = gpu.format,
		writeMask = {.Red, .Green, .Blue, .Alpha},
	}

	fragment_state := wgpu.FragmentState {
		module      = shader,
		entryPoint  = "fs_main",
		targetCount = 1,
		targets     = &color_target,
	}

	vertex_state := wgpu.VertexState {
		module      = shader,
		entryPoint  = "vs_main",
		bufferCount = 1,
		buffers     = &vertex_buffer_layout,
	}

	primitive := wgpu.PrimitiveState {
		topology  = .TriangleList,
		frontFace = .CCW,
		cullMode  = .None,
	}

	multisample := wgpu.MultisampleState {
		count                  = 1,
		mask                   = 0xFFFFFFFF,
		alphaToCoverageEnabled = false,
	}

	descriptor := wgpu.RenderPipelineDescriptor {
		label        = "page pipeline",
		vertex       = vertex_state,
		primitive    = primitive,
		depthStencil = nil,
		multisample  = multisample,
		fragment     = &fragment_state,
	}

	gpu.page_pipeline = wgpu.DeviceCreateRenderPipeline(gpu.device, &descriptor)

	wgpu.ShaderModuleRelease(shader)

	gpu.page_pipeline_ready = gpu.page_pipeline != nil
	return gpu.page_pipeline_ready
}

gpu_create_shader_module :: proc(gpu: ^Gpu_State) -> wgpu.ShaderModule {
	source := wgpu.ShaderSourceWGSL {
		next  = nil,
		sType = .ShaderSourceWGSL,
		code  = PAGE_SHADER,
	}

	descriptor := wgpu.ShaderModuleDescriptor {
		nextInChain = &source.chain,
		label       = "page shader",
	}

	return wgpu.DeviceCreateShaderModule(gpu.device, &descriptor)
}

screen_to_clip :: proc(x, y: f32, viewport_width, viewport_height: f32) -> [2]f32 {
	clip_x := (x / viewport_width) * 2.0 - 1.0
	clip_y := 1.0 - (y / viewport_height) * 2.0

	return [2]f32{clip_x, clip_y}
}

gpu_build_page_vertices :: proc(
	vertices: ^[6]Vertex,
	page_rect: Rect,
	viewport_width, viewport_height: f32,
) {
	white := [4]f32{1.0, 1.0, 1.0, 1.0}

	gpu_build_rect_vertices(vertices, page_rect, white, viewport_width, viewport_height)
}

gpu_request_adapter_callback :: proc "c" (
	status: wgpu.RequestAdapterStatus,
	adapter: wgpu.Adapter,
	message: wgpu.StringView,
	userdata1: rawptr,
	userdata2: rawptr,
) {
	context = runtime.default_context()
	gpu := cast(^Gpu_State)userdata1

	if gpu == nil {
		return
	}

	if status == .Success && adapter != nil {
		gpu.adapter = adapter
		gpu.adapter_ready = true

		gpu_start_device_request(gpu)
		return
	}

	gpu.adapter_ready = false
}

gpu_request_device_callback :: proc "c" (
	status: wgpu.RequestDeviceStatus,
	device: wgpu.Device,
	message: wgpu.StringView,
	userdata1: rawptr,
	userdata2: rawptr,
) {
	context = runtime.default_context()
	gpu := cast(^Gpu_State)userdata1

	if gpu == nil {
		return
	}

	if status == .Success && device != nil {
		gpu.device = device
		gpu.device_ready = true

		gpu.queue = wgpu.DeviceGetQueue(device)
		gpu.queue_ready = gpu.queue != nil

		return
	}

	gpu.device_ready = false
	gpu.queue_ready = false
}

gpu_start_adapter_request :: proc(gpu: ^Gpu_State) -> bool {
	if gpu == nil || gpu.instance == nil {
		return false
	}

	if gpu.adapter_request_started {
		return true
	}

	options := wgpu.RequestAdapterOptions {
		compatibleSurface    = gpu.surface,
		powerPreference      = .HighPerformance,
		forceFallbackAdapter = false,
	}

	callback_info := wgpu.RequestAdapterCallbackInfo {
		mode      = .AllowSpontaneos,
		callback  = gpu_request_adapter_callback,
		userdata1 = gpu,
		userdata2 = nil,
	}

	wgpu.InstanceRequestAdapter(gpu.instance, &options, callback_info)

	gpu.adapter_request_started = true
	return true
}

gpu_start_device_request :: proc(gpu: ^Gpu_State) -> bool {
	if gpu == nil || gpu.adapter == nil {
		return false
	}

	if gpu.device_request_started {
		return true
	}

	descriptor := wgpu.DeviceDescriptor{}

	callback_info := wgpu.RequestDeviceCallbackInfo {
		mode      = .AllowSpontaneos,
		callback  = gpu_request_device_callback,
		userdata1 = gpu,
		userdata2 = nil,
	}

	wgpu.AdapterRequestDevice(gpu.adapter, &descriptor, callback_info)

	gpu.device_request_started = true
	return true
}

gpu_create_surface_from_selector :: proc(
	instance: wgpu.Instance,
	selector: string,
) -> wgpu.Surface {
	source := wgpu.SurfaceSourceCanvasHTMLSelector {
		chain = wgpu.ChainedStruct{next = nil, sType = .SurfaceSourceCanvasHTMLSelector},
		selector = selector,
	}

	descriptor := wgpu.SurfaceDescriptor {
		nextInChain = &source.chain,
		label       = "designer canvas suface",
	}

	return wgpu.InstanceCreateSurface(instance, &descriptor)
}

gpu_init :: proc(gpu: ^Gpu_State) -> bool {
	gpu.initialized = false

	gpu.clear_color = RGBA {
		r = 0.16,
		g = 0.17,
		b = 0.18,
		a = 1.0,
	}

	gpu.instance = wgpu.CreateInstance(nil)

	if gpu.instance == nil {
		return false
	}

	gpu.surface = gpu_create_surface_from_selector(gpu.instance, "#designer-canvas")

	if gpu.surface == nil {
		return false
	}

	gpu.has_surface = true

	started := gpu_start_adapter_request(gpu)

	gpu.initialized = started
	return started
}

gpu_configure_surface :: proc(gpu: ^Gpu_State, width, height: i32) -> bool {
	if gpu == nil {
		return false
	}

	if gpu.surface == nil || gpu.device == nil || gpu.adapter == nil {
		return false
	}

	capabilities, status := wgpu.SurfaceGetCapabilities(gpu.surface, gpu.adapter)

	if status != .Success {
		return false
	}

	if capabilities.formatCount == 0 {
		return false
	}

	gpu.format = .RGBA8Unorm
	//gpu.format = capabilities.formats[0]

	config := wgpu.SurfaceConfiguration {
		device      = gpu.device,
		format      = gpu.format,
		usage       = {.RenderAttachment},
		width       = u32(width),
		height      = u32(height),
		presentMode = .Fifo,
		alphaMode   = .Opaque,
	}

	wgpu.SurfaceConfigure(gpu.surface, &config)

	wgpu.SurfaceCapabilitiesFreeMembers(capabilities)

	gpu.surface_configured = true

	if !gpu.page_pipeline_ready {
		if !gpu_create_page_pipeline(gpu) {
			return false
		}
	}

	if gpu.page_vertex_buffer == nil {
		if !gpu_create_rect_vertex_buffer(gpu) {
			return false
		}
	}

	return true
}

gpu_is_initialized :: proc(gpu: ^Gpu_State) -> bool {
	return gpu.initialized
}

gpu_has_surface :: proc(gpu: ^Gpu_State) -> bool {
	return gpu != nil && gpu.has_surface && gpu.surface != nil
}

gpu_has_adapter :: proc(gpu: ^Gpu_State) -> bool {
	return gpu != nil && gpu.adapter_ready && gpu.adapter != nil
}

gpu_has_device :: proc(gpu: ^Gpu_State) -> bool {
	return gpu != nil && gpu.device_ready && gpu.device != nil
}

gpu_has_queue :: proc(gpu: ^Gpu_State) -> bool {
	return gpu != nil && gpu.queue_ready && gpu.queue != nil
}

gpu_is_ready_to_render :: proc(gpu: ^Gpu_State) -> bool {
	return(
		gpu != nil &&
		gpu.has_surface &&
		gpu.adapter_ready &&
		gpu.device_ready &&
		gpu.queue_ready &&
		gpu.surface_configured \
	)
}

gpu_render_document :: proc(
	gpu: ^Gpu_State,
	document: ^Editor_Document,
	selection: ^Selection_State,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	if !gpu_is_ready_to_render(gpu) {
		return false
	}

	if !gpu.page_pipeline_ready || gpu.page_vertex_buffer == nil {
		return false
	}

	vertices: [MAX_RENDER_VERTICES]Vertex
	vertex_count := 0

	page_rect_page := Rect {
		x      = 0.0,
		y      = 0.0,
		width  = document.page.width,
		height = document.page.height,
	}

	page_rect_screen := page_rect_to_screen(page_rect_page, transform)

	ok := gpu_push_rect_vertices(
		raw_data(vertices[:]),
		&vertex_count,
		page_rect_screen,
		[4]f32{1.0, 1.0, 1.0, 1.0},
		viewport_width,
		viewport_height,
	)

	if !ok {
		return false
	}

	for i in 0 ..< document.object_count {
		object := document.objects[i]

		if object.kind == .Rect {
			ok = gpu_push_rect_object_vertices(
				raw_data(vertices[:]),
				&vertex_count,
				object,
				transform,
				viewport_width,
				viewport_height,
			)
		} else if object.kind == .Line {
			ok = gpu_push_line_object_vertices(
				raw_data(vertices[:]),
				&vertex_count,
				object,
				transform,
				viewport_width,
				viewport_height,
			)
		} else {
			ok = true
		}

		if !ok {
			return false
		}
	}

	ok = gpu_push_selection_vertices(
		raw_data(vertices[:]),
		&vertex_count,
		document,
		selection,
		transform,
		viewport_width,
		viewport_height,
	)
	if !ok {
		return false
	}

	data_size := uint(size_of(Vertex) * vertex_count)

	wgpu.QueueWriteBuffer(gpu.queue, gpu.page_vertex_buffer, 0, raw_data(vertices[:]), data_size)

	return gpu_draw_vertices(gpu, u32(vertex_count))
}

gpu_draw_vertices :: proc(gpu: ^Gpu_State, vertex_count: u32) -> bool {
	surface_texture := wgpu.SurfaceGetCurrentTexture(gpu.surface)
	if surface_texture.texture == nil {
		return false
	}

	texture_view := wgpu.TextureCreateView(surface_texture.texture, nil)
	if texture_view == nil {
		return false
	}

	color_attachment := wgpu.RenderPassColorAttachment {
		view          = texture_view,
		depthSlice    = wgpu.DEPTH_SLICE_UNDEFINED,
		resolveTarget = nil,
		loadOp        = .Clear,
		storeOp       = .Store,
		clearValue    = rgba_to_vertex_color_f64(gpu.clear_color),
	}

	render_pass_descriptor := wgpu.RenderPassDescriptor {
		colorAttachmentCount = 1,
		colorAttachments     = &color_attachment,
	}

	encoder := wgpu.DeviceCreateCommandEncoder(gpu.device, nil)
	if encoder == nil {
		wgpu.TextureViewRelease(texture_view)
		return false
	}

	pass := wgpu.CommandEncoderBeginRenderPass(encoder, &render_pass_descriptor)
	if pass == nil {
		wgpu.CommandEncoderRelease(encoder)
		wgpu.TextureViewRelease(texture_view)
	}

	wgpu.RenderPassEncoderSetPipeline(pass, gpu.page_pipeline)

	wgpu.RenderPassEncoderSetVertexBuffer(
		pass,
		0,
		gpu.page_vertex_buffer,
		0,
		u64(size_of(Vertex) * int(vertex_count)),
	)

	wgpu.RenderPassEncoderDraw(pass, vertex_count, 1, 0, 0)

	wgpu.RenderPassEncoderEnd(pass)

	command_buffer := wgpu.CommandEncoderFinish(encoder, nil)
	if command_buffer == nil {
		wgpu.RenderPassEncoderRelease(pass)
		wgpu.CommandEncoderRelease(encoder)
		wgpu.TextureViewRelease(texture_view)
		return false
	}

	commands := [?]wgpu.CommandBuffer{command_buffer}
	wgpu.QueueSubmit(gpu.queue, commands[:])

	wgpu.SurfacePresent(gpu.surface)

	wgpu.CommandBufferRelease(command_buffer)
	wgpu.RenderPassEncoderRelease(pass)
	wgpu.CommandEncoderRelease(encoder)
	wgpu.TextureViewRelease(texture_view)

	return true
}

gpu_clear_frame :: proc(gpu: ^Gpu_State) -> bool {
	if !gpu_is_ready_to_render(gpu) {
		return false
	}

	surface_texture := wgpu.SurfaceGetCurrentTexture(gpu.surface)

	if surface_texture.texture == nil {
		return false
	}

	texture_view := wgpu.TextureCreateView(surface_texture.texture, nil)

	if texture_view == nil {
		return false
	}

	color_attachment := wgpu.RenderPassColorAttachment {
		view          = texture_view,
		depthSlice    = wgpu.DEPTH_SLICE_UNDEFINED,
		resolveTarget = nil,
		loadOp        = .Clear,
		storeOp       = .Store,
		clearValue    = rgba_to_vertex_color_f64(gpu.clear_color),
	}

	render_pass_descriptor := wgpu.RenderPassDescriptor {
		colorAttachmentCount = 1,
		colorAttachments     = &color_attachment,
	}

	encoder := wgpu.DeviceCreateCommandEncoder(gpu.device, nil)

	if encoder == nil {
		wgpu.TextureViewRelease(texture_view)
		return false
	}

	pass := wgpu.CommandEncoderBeginRenderPass(encoder, &render_pass_descriptor)

	if pass == nil {
		wgpu.CommandEncoderRelease(encoder)
		wgpu.TextureViewRelease(texture_view)
		return false
	}

	wgpu.RenderPassEncoderEnd(pass)

	command_buffer := wgpu.CommandEncoderFinish(encoder, nil)

	if command_buffer == nil {
		wgpu.RenderPassEncoderRelease(pass)
		wgpu.CommandEncoderRelease(encoder)
		wgpu.TextureViewRelease(texture_view)
		return false
	}

	commands := [?]wgpu.CommandBuffer{command_buffer}
	wgpu.QueueSubmit(gpu.queue, commands[:])

	wgpu.SurfacePresent(gpu.surface)

	wgpu.CommandBufferRelease(command_buffer)
	wgpu.RenderPassEncoderRelease(pass)
	wgpu.CommandEncoderRelease(encoder)
	wgpu.TextureViewRelease(texture_view)

	return true
}

gpu_build_rect_vertices :: proc(
	vertices: ^[6]Vertex,
	rect: Rect,
	color: [4]f32,
	viewport_width, viewport_height: f32,
) {
	x0 := rect.x
	y0 := rect.y
	x1 := rect.x + rect.width
	y1 := rect.y + rect.height

	top_left := screen_to_clip(x0, y0, viewport_width, viewport_height)
	top_right := screen_to_clip(x1, y0, viewport_width, viewport_height)
	bottom_left := screen_to_clip(x0, y1, viewport_width, viewport_height)
	bottom_right := screen_to_clip(x1, y1, viewport_width, viewport_height)

	vertices[0] = Vertex {
		position = top_left,
		color    = color,
	}
	vertices[1] = Vertex {
		position = bottom_left,
		color    = color,
	}
	vertices[2] = Vertex {
		position = top_right,
		color    = color,
	}

	vertices[3] = Vertex {
		position = top_right,
		color    = color,
	}
	vertices[4] = Vertex {
		position = bottom_left,
		color    = color,
	}
	vertices[5] = Vertex {
		position = bottom_right,
		color    = color,
	}
}

gpu_push_rect_object_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	object: Editor_Object,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	if object.kind != .Rect {
		return true
	}

	rect_page := Rect {
		x      = object.rect.x,
		y      = object.rect.y,
		width  = object.rect.width,
		height = object.rect.height,
	}

	rect_screen := page_rect_to_screen(rect_page, transform)

	if object.rect.fill_enabled {
		if !gpu_push_rect_vertices(
			vertices,
			vertex_count,
			rect_screen,
			rgba_to_vertex_color(object.rect.fill),
			viewport_width,
			viewport_height,
		) {
			return false
		}
	}

	if object.rect.stroke_enabled {
		stroke_width_screen := object.rect.stroke.width * transform.zoom

		if !gpu_push_rect_stroke_vertices(
			vertices,
			vertex_count,
			rect_screen,
			stroke_width_screen,
			rgba_to_vertex_color(object.rect.stroke.color),
			viewport_width,
			viewport_height,
		) {
			return false
		}
	}

	return true
}

gpu_push_rect_stroke_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	rect: Rect,
	stroke_width: f32,
	color: [4]f32,
	viewport_width, viewport_height: f32,
) -> bool {
	if stroke_width <= 0.0 {
		return true
	}

	x := rect.x
	y := rect.y
	w := rect.width
	h := rect.height
	s := stroke_width

	// Clamp stroke so very small rects do not invert.
	max_stroke := min_f32(w, h) / 2.0
	if s > max_stroke {
		s = max_stroke
	}

	top := Rect {
		x      = x,
		y      = y,
		width  = w,
		height = s,
	}

	bottom := Rect {
		x      = x,
		y      = y + h - s,
		width  = w,
		height = s,
	}

	left := Rect {
		x      = x,
		y      = y + s,
		width  = s,
		height = h - s * 2.0,
	}

	right := Rect {
		x      = x + w - s,
		y      = y + s,
		width  = s,
		height = h - s * 2.0,
	}

	if !gpu_push_rect_vertices(
		vertices,
		vertex_count,
		top,
		color,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	if !gpu_push_rect_vertices(
		vertices,
		vertex_count,
		bottom,
		color,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	if left.height > 0.0 {
		if !gpu_push_rect_vertices(
			vertices,
			vertex_count,
			left,
			color,
			viewport_width,
			viewport_height,
		) {
			return false
		}
	}

	if right.height > 0.0 {
		if !gpu_push_rect_vertices(
			vertices,
			vertex_count,
			right,
			color,
			viewport_width,
			viewport_height,
		) {
			return false
		}
	}

	return true
}

gpu_push_rect_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	rect: Rect,
	color: [4]f32,
	viewport_width, viewport_height: f32,
) -> bool {
	if vertex_count^ + 6 > MAX_RENDER_VERTICES {
		return false
	}

	local_vertices: [6]Vertex

	gpu_build_rect_vertices(&local_vertices, rect, color, viewport_width, viewport_height)

	base := vertex_count^

	for i in 0 ..< 6 {
		vertices[base + i] = local_vertices[i]
	}

	vertex_count^ += 6

	return true
}

gpu_build_line_vertices :: proc(
	vertices: ^[6]Vertex,
	x1, y1, x2, y2: f32,
	width: f32,
	color: [4]f32,
	viewport_width, viewport_height: f32,
) -> bool {
	dx := x2 - x1
	dy := y2 - y1

	length := length_f32(dx, dy)

	if length <= 0.0001 {
		return false
	}

	half_width := width / 2.0

	// Unit direction along the line.
	ux := dx / length
	uy := dy / length

	// Perpendicular vector.
	//
	// For screen coordinates where y grows downward, this still produces
	// the correct quad. It just chooses one side as "left" and the other
	// as "right".
	px := -uy
	py := ux

	ox := px * half_width
	oy := py * half_width

	a := screen_to_clip(x1 + ox, y1 + oy, viewport_width, viewport_height)
	b := screen_to_clip(x2 + ox, y2 + oy, viewport_width, viewport_height)
	c := screen_to_clip(x2 - ox, y2 - oy, viewport_width, viewport_height)
	d := screen_to_clip(x1 - ox, y1 - oy, viewport_width, viewport_height)

	vertices[0] = Vertex {
		position = a,
		color    = color,
	}
	vertices[1] = Vertex {
		position = d,
		color    = color,
	}
	vertices[2] = Vertex {
		position = b,
		color    = color,
	}

	vertices[3] = Vertex {
		position = b,
		color    = color,
	}
	vertices[4] = Vertex {
		position = d,
		color    = color,
	}
	vertices[5] = Vertex {
		position = c,
		color    = color,
	}

	return true
}

gpu_push_line_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	x1, y1, x2, y2: f32,
	width: f32,
	color: [4]f32,
	viewport_width, viewport_height: f32,
) -> bool {
	if vertex_count^ + 6 > MAX_RENDER_VERTICES {
		return false
	}

	local_vertices: [6]Vertex

	ok := gpu_build_line_vertices(
		&local_vertices,
		x1,
		y1,
		x2,
		y2,
		width,
		color,
		viewport_width,
		viewport_height,
	)

	if !ok {
		return true
	}

	base := vertex_count^

	for i in 0 ..< 6 {
		vertices[base + i] = local_vertices[i]
	}

	vertex_count^ += 6

	return true
}

gpu_push_line_object_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	object: Editor_Object,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	if object.kind != .Line {
		return true
	}

	p1_page := Point {
		x = object.line.x1,
		y = object.line.y1,
	}
	p2_page := Point {
		x = object.line.x2,
		y = object.line.y2,
	}

	p1_screen := page_to_screen(p1_page, transform)
	p2_screen := page_to_screen(p2_page, transform)

	stroke_width_screen := object.line.stroke.width * transform.zoom

	return gpu_push_line_vertices(
		vertices,
		vertex_count,
		p1_screen.x,
		p1_screen.y,
		p2_screen.x,
		p2_screen.y,
		stroke_width_screen,
		rgba_to_vertex_color(object.line.stroke.color),
		viewport_width,
		viewport_height,
	)
}

gpu_push_selection_outline_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	bounds_page: Rect,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	bounds_screen := page_rect_to_screen(bounds_page, transform)

	return gpu_push_rect_stroke_vertices(
		vertices,
		vertex_count,
		bounds_screen,
		SELECTION_STROKE_WIDTH_SCREEN,
		SELECTION_COLOR,
		viewport_width,
		viewport_height,
	)
}

gpu_push_selection_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	document: ^Editor_Document,
	selection: ^Selection_State,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	if selection == nil || selection.count == 0 {
		return true
	}

	// Single selection: use object-specific selection rendering.
	if selection.count == 1 {
		object := document_get_object_by_id(document, selection.ids[0])

		if object == nil {
			return true
		}

		if object.kind == .Line {
			if !gpu_push_line_selection_vertices(
				vertices,
				vertex_count,
				object^,
				transform,
				viewport_width,
				viewport_height,
			) {
				return false
			}

			if !gpu_push_line_endpoint_handles_vertices(
				vertices,
				vertex_count,
				object^,
				transform,
				viewport_width,
				viewport_height,
			) {
				return false
			}

			return true
		}

		bounds := object_bounds(object^)

		if !gpu_push_selection_outline_vertices(
			vertices,
			vertex_count,
			bounds,
			transform,
			viewport_width,
			viewport_height,
		) {
			return false
		}

		if object.kind == .Rect {
			if !gpu_push_selection_handles_vertices(
				vertices,
				vertex_count,
				bounds,
				transform,
				viewport_width,
				viewport_height,
			) {
				return false
			}
		}

		return true
	}

	// Multi-selection: draw one combined selection box.
	bounds, ok := selection_bounds(document, selection)

	if !ok {
		return true
	}

	if !gpu_push_selection_outline_vertices(
		vertices,
		vertex_count,
		bounds,
		transform,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	if !gpu_push_selection_handles_vertices(
		vertices,
		vertex_count,
		bounds,
		transform,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	return true
}

gpu_push_line_selection_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	object: Editor_Object,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	p1_page := Point {
		x = object.line.x1,
		y = object.line.y1,
	}
	p2_page := Point {
		x = object.line.x2,
		y = object.line.y2,
	}

	p1_screen := page_to_screen(p1_page, transform)
	p2_screen := page_to_screen(p2_page, transform)

	// The line's own width is in page units, so scale it.
	// The extra selection width is UI chrome, so keep it in screen pixels.
	line_width_screen := object.line.stroke.width * transform.zoom
	selection_width_screen := line_width_screen + SELECTION_LINE_EXTRA_WIDTH_SCREEN

	return gpu_push_line_vertices(
		vertices,
		vertex_count,
		p1_screen.x,
		p1_screen.y,
		p2_screen.x,
		p2_screen.y,
		selection_width_screen,
		SELECTION_COLOR,
		viewport_width,
		viewport_height,
	)
}

gpu_push_selection_handle_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	handle_rect: Rect,
	viewport_width, viewport_height: f32,
) -> bool {
	// Fill
	if !gpu_push_rect_vertices(
		vertices,
		vertex_count,
		handle_rect,
		HANDLE_FILL_COLOR,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	// Stroke
	if !gpu_push_rect_stroke_vertices(
		vertices,
		vertex_count,
		handle_rect,
		HANDLE_STROKE_WIDTH_SCREEN,
		HANDLE_STROKE_COLOR,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	return true
}

gpu_push_selection_handles_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	bounds_page: Rect,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	bounds_screen := page_rect_to_screen(bounds_page, transform)

	handles := [?]Resize_Handle{.NW, .N, .NE, .E, .SE, .S, .SW, .W}

	for handle in handles {
		center := selection_handle_center(bounds_screen, handle)
		rect := selection_handle_rect(center)

		if !gpu_push_selection_handle_vertices(
			vertices,
			vertex_count,
			rect,
			viewport_width,
			viewport_height,
		) {
			return false
		}
	}

	return true
}

gpu_push_line_endpoint_handles_vertices :: proc(
	vertices: [^]Vertex,
	vertex_count: ^int,
	object: Editor_Object,
	transform: Viewport_Transform,
	viewport_width, viewport_height: f32,
) -> bool {
	p1_page := Point {
		x = object.line.x1,
		y = object.line.y1,
	}
	p2_page := Point {
		x = object.line.x2,
		y = object.line.y2,
	}

	p1_screen := page_to_screen(p1_page, transform)
	p2_screen := page_to_screen(p2_page, transform)

	p1_handle := selection_handle_rect(p1_screen)
	p2_handle := selection_handle_rect(p2_screen)

	if !gpu_push_selection_handle_vertices(
		vertices,
		vertex_count,
		p1_handle,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	if !gpu_push_selection_handle_vertices(
		vertices,
		vertex_count,
		p2_handle,
		viewport_width,
		viewport_height,
	) {
		return false
	}

	return true
}

rgba_to_vertex_color :: proc(color: RGBA) -> [4]f32 {
	return [4]f32{color.r, color.g, color.b, color.a}
}

rgba_to_vertex_color_f64 :: proc(color: RGBA) -> [4]f64 {
	return [4]f64{f64(color.r), f64(color.g), f64(color.b), f64(color.a)}
}
