import { createSignal } from 'solid-js';
import { Toolbar } from './components/Toolbar';
import { Viewport } from './components/Viewport';
import { StatusBar } from './components/StatusBar';

export default function App() {
  const [status, setStatus] = createSignal("Ready");
  const [_documentRevision, setDocumentRevision] = createSignal(0);

  return (
    <div class="app-shell">
      <Toolbar
        onSave={() => setStatus("Save not implemented yet")}
        onPreview={() => setStatus("Preview not implemented yet.")}
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
          onDocumentRevisionChange={setDocumentRevision}
        />
      </main>

      <StatusBar message={status()} />
    </div>
  );
}
