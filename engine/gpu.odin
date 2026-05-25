package designer

import "base:runtime"
import wgpu "vendor:wgpu"

Gpu_State :: struct {
	initialized:             bool,
	has_surface:             bool,
	adapter_ready:           bool,
	device_ready:            bool,
	queue_ready:             bool,
	adapter_request_started: bool,
	device_request_started:  bool,
	instance:                wgpu.Instance,
	adapter:                 wgpu.Adapter,
	device:                  wgpu.Device,
	queue:                   wgpu.Queue,
	surface:                 wgpu.Surface,
	format:                  wgpu.TextureFormat,
	clear_r:                 f64,
	clear_g:                 f64,
	clear_b:                 f64,
	clear_a:                 f64,
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

	gpu.clear_r = 0.16
	gpu.clear_g = 0.17
	gpu.clear_b = 0.18
	gpu.clear_a = 1.0

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

gpu_clear_frame :: proc(gpu: ^Gpu_State) -> bool {
	if !gpu.initialized {
		return false
	}
	return true
}
