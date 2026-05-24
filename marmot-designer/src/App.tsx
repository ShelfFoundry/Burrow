import { createSignal } from 'solid-js';
import { Toolbar } from './components/Toolbar';
import { Viewport } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';
import { createSampleDocument } from './editor/sample';
import type { EditorDocument } from './editor/document';
import type { SelectedObjectSnapshot } from './editor/selection';

export default function App() {
  const [document] = createSignal<EditorDocument>(createSampleDocument());

  const [selectedObject, setSelectedObject] = createSignal<SelectedObjectSnapshot>({ kind: "none" });

  const [status, setStatus] = createSignal("Ready");

  return (
    <div class="app-shell">
      <Toolbar
        onSave={() => setStatus("Save not implemented yet")}
        onPreview={() => setStatus("Preview not implemented yet.")}
      />

      <main class="main-layout">
        <Viewport
          document={document()}
          onStatusChange={setStatus}
          onSelectedObjectChange={setSelectedObject}
        />

        <Inspector
          document={document()}
          selectedObject={selectedObject()}
          onRectPropertyChange={(property, value) => {
            setStatus(`Inspector edit: ${property} = ${value}`);
          }}
        />
      </main>

      <StatusBar message={status()} />
    </div>
  );
}
