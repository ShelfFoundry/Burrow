import { createSignal } from 'solid-js';
import { Toolbar } from './components/Toolbar';
import { Viewport, type ViewportController } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';
import { selectedObjectSnapshotsEqual, type SelectedObjectSnapshot } from './wasm/engine';
import { createTemplateSettingsStore } from './template/settings';

export default function App() {
  const [selectedObject, setSelectedObject] = createSignal<SelectedObjectSnapshot>(
    { kind: "none" },
    { equals: selectedObjectSnapshotsEqual },
  );
  const [templateSettings, setTemplateSettings] = createTemplateSettingsStore();
  const [status, setStatus] = createSignal("Ready");
  const [viewportController, setViewportController] = createSignal<ViewportController | undefined>();
  const [_documentRevision, setDocumentRevision] = createSignal(0);

  return (
    <div class="app-shell">
      <Toolbar
        onSave={() => setStatus("Save not implemented yet")}
        onUndo={()=>{
          //const ok = viewportController()?.undo() ?? false;
          //setStatus(ok ? "Undo" : "Nothing to undo");
        }}
        onRedo={()=>{
          //const ok = viewportController()?.redo() ?? false;
          //setStatus(ok ? "Redo" : "Nothing to redo");
        }}
      />

      <main class="main-layout">
        <Viewport
          onStatusChange={setStatus}
          onSelectedObjectChange={setSelectedObject}
          onControllerReady={setViewportController}
          onDocumentRevisionChange={setDocumentRevision}
        />

        <Inspector
          selectedObject={selectedObject()}
          templateSettings={templateSettings}
          setTemplateSettings={setTemplateSettings}
          onStatusChange={setStatus}
          onRectPropertyChange={(property, value) => {
            const ok = viewportController()?.setSelectionRectProperty(property, value);
            setStatus(ok ? `Updated ${property} = ${value}` : `Could not update ${property}`);
          }}
        />
      </main>

      <StatusBar message={status()} />
    </div>
  );
}
