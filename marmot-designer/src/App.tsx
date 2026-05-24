import { createSignal } from 'solid-js';
import { Toolbar } from './components/Toolbar';
import { Viewport } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';
import { createSampleDocument } from './editor/sample';
import type { EditorDocument } from './editor/document';
import type { SelectedObjectSnapshot } from './editor/selection';
import type { ViewportController } from './components/Viewport';

export default function App() {
  const [document] = createSignal<EditorDocument>(createSampleDocument());
  const [selectedObject, setSelectedObject] = createSignal<SelectedObjectSnapshot>({ kind: "none" });
  const [status, setStatus] = createSignal("Ready");
  const [viewportController, setViewportController] = createSignal<ViewportController | undefined>();

  return (
    <div class="app-shell">
      <Toolbar
        onSave={() => setStatus("Save not implemented yet")}
        onPreview={() => setStatus("Preview not implemented yet.")}
        onUndo={()=>{
          const ok = viewportController()?.undo() ?? false;
          setStatus(ok ? "Undo" : "Nothing to undo");
        }}
        onRedo={()=>{
          const ok = viewportController()?.redo() ?? false;
          setStatus(ok ? "Redo" : "Nothing to redo");
        }}
      />

      <main class="main-layout">
        <Viewport
          document={document()}
          onStatusChange={setStatus}
          onSelectedObjectChange={setSelectedObject}
          onControllerReady={setViewportController}
        />

        <Inspector
          document={document()}
          selectedObject={selectedObject()}
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
