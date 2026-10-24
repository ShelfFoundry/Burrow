type ToolbarProps = {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

export function Toolbar(props: ToolbarProps) {
  return (
    <header class="toolbar">
      <div class="toolbar-title">
        <span class="app-name">Burrow Designer</span>
      </div>

      <div class="toolbar-actions">
        <button type="button" onClick={props.onUndo}>
          Undo
        </button>

        <button type="button" onClick={props.onRedo}>
          Redo
        </button>
        <button type="button" onClick={props.onSave}>
          Save
        </button>
      </div>
    </header>
  );
}
