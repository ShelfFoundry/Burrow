package designer

MAX_HISTORY :: 50

History :: struct {
	commands: [MAX_HISTORY]Edit_Command,
	start:    int,
	count:    int,
	cursor:   int,
}

history_clear :: proc(history: ^History) {
	history.start = 0
	history.count = 0
	history.cursor = 0
}

history_slot :: proc(history: ^History, i: int) -> ^Edit_Command {
	return &history.commands[(history.start + i) % MAX_HISTORY]
}

history_push :: proc(history: ^History, command: Edit_Command) {
	history.count = history.cursor

	if history.count == MAX_HISTORY {
		history.start = (history.start + 1) % MAX_HISTORY
		history.count -= 1
	}

	history_slot(history, history.count)^ = command
	history.count += 1
	history.cursor = history.count
}

edit_command_inverse :: proc(command: Edit_Command) -> Edit_Command {
	switch v in command.action {
	case Edit_Action_Set_Objects:
		return Edit_Command {
			action = Edit_Action_Set_Objects{count = v.count, before = v.after, after = v.before},
		}
	case Edit_Action_Add_Rect:
		return Edit_Command{action = Edit_Action_Remove_Object{id = v.id}}
	case Edit_Action_Add_Line:
		return Edit_Command{action = Edit_Action_Remove_Object{id = v.id}}
	case Edit_Action_Remove_Object:
	// TODO: has not inverse yet
	case nil:
	}

	return Edit_Command{}
}

@(private = "file")
document_apply :: proc(document: ^Editor_Document, command: Edit_Command) -> bool {
	ok := true
	switch v in command.action {
	case Edit_Action_Remove_Object:
		ok = document_remove_object(document, v.id)
	case Edit_Action_Set_Objects:
		for i in 0 ..< v.count {
			object := document_get_object_by_id(document, v.after[i].id)
			if object == nil {
				ok = false
				continue
			}
			object^ = v.after[i]
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

document_execute :: proc(document: ^Editor_Document, command: Edit_Command) -> bool {
	if !document_apply(document, command) {
		return false
	}

	history_push(&document.history, command)
	return true
}

document_undo :: proc(document: ^Editor_Document) -> bool {
	history := &document.history
	if history.cursor == 0 {
		return false
	}
	command := history_slot(history, history.cursor - 1)
	if !document_apply(document, edit_command_inverse(command^)) {
		return false
	}
	history.cursor -= 1
	return true
}

document_redo :: proc(document: ^Editor_Document) -> bool {
	history := &document.history
	if history.cursor == history.count {
		return false
	}
	command := history_slot(history, history.cursor)
	if !document_apply(document, command^) {
		return false
	}
	history.cursor += 1
	return true
}
