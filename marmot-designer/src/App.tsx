import { createSignal } from 'solid-js';
import { Toolbar } from './components/Toolbar';
import { Viewport } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';

export type SelectionSummary =
  | {
    kind: "none"
  }
  | {
    kind: "object";
    id: number;
    objectType: "rect" | "line" | "image" | "text";
    x: number;
    y: number;
    width: number;
    height: number;
  };

export default function App() {
  const [selection, setSelection] = createSignal<SelectionSummary>({
    kind: "none",
  });

  const [status, setStatus] = createSignal("Ready");

  return (
    <div class="app-shell">
      <Toolbar
        onSave={() => setStatus("Save not implemented yet")}
        onPreview={() => setStatus("Preview not implemented yet.")}
      />

      <main class="main-layout">
        <Viewport
          onStatusChange={setStatus}
          onSelectionChange={setSelection}
        />

        <Inspector selection={selection()} />
      </main>

      <StatusBar message={status()} />
    </div>
  );
}
