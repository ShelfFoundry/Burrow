package designer

viewport_width: i32
viewport_height: i32
frame_count: i32

@(export)
designer_version :: proc() -> i32 {
    return 1
}

@(export)
add_i32 :: proc(a: i32, b: i32) -> i32 {
    return a + b
}

@(export)
viewport_area :: proc(width: i32, height: i32) -> i32 {
    return width * height
}

@(export)
designer_init :: proc(width: i32, height: i32) -> i32 {
    viewport_width = width
    viewport_height = height
    frame_count = 0

    return 1
}

@(export)
designer_resize :: proc(width: i32, height: i32) {
    viewport_width = width
    viewport_height = height
}

@(export)
designer_frame :: proc() -> i32 {
    frame_count += 1
    return frame_count
}

@(export)
designer_viewport_width :: proc() -> i32 {
    return viewport_width
}

@(export)
designer_viewport_height :: proc() -> i32 {
    return viewport_height
}

main :: proc(){}
