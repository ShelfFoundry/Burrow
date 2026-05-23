type ToolbarProps = {
  onSave: () => void;
  onPreview: () => void;
};

export function Toolbar(props: ToolbarProps) {
  return (
    <header class="toolbar">
      <div class="toolbar-title">
        <span class="app-name">Marmot Designer</span>
      </div>

      <div class="toolbar-actions">
        <button type="button" onClick={props.onSave}>
          Save
        </button>

        <button type="button" onClick={props.onPreview}>
          Preview
        </button>
      </div>
    </header>
  );
}
