import { createSignal, onCleanup, onMount } from 'solid-js';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Viewport, type ViewportController } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { ToolDock, type Tool } from './components/ToolDock';
import { selectedObjectSnapshotsEqual, type SelectedObjectSnapshot } from './wasm/engine';
import { createTemplateSettingsStore } from './template/settings';
import { findLayer, MOCK_LAYERS, type LayerCommands, type LayerId } from './layers/layers';

export default function App() {
  const [selectedObject, setSelectedObject] = createSignal<SelectedObjectSnapshot>(
    { kind: "none" },
    { equals: selectedObjectSnapshotsEqual },
  );
  const [templateSettings, setTemplateSettings] = createTemplateSettingsStore();
  const [status, setStatus] = createSignal("Ready");
  const [viewportController, setViewportController] = createSignal<ViewportController | undefined>();
  const [_documentRevision, setDocumentRevision] = createSignal(0);
  const [zoom, setZoom] = createSignal(1);
  // MOCK: the engine has no tool modes yet, so this is UI state only.
  const [activeTool, setActiveTool] = createSignal<Tool>("select");
  const [previewVisible, setPreviewVisible] = createSignal(true);

  const layerName = (id: LayerId | null) =>
    id === null ? "top level" : `"${findLayer(MOCK_LAYERS, id)?.name ?? `#${id}`}"`;

  // Layer intents. Nothing applies them until the engine exposes layer exports.
  const layerCommands: LayerCommands = {
    select: (id, mode) =>
      setStatus(`Select ${layerName(id)} (${mode}) needs engine support`),
    move: (id, { parentId, index }) =>
      setStatus(`Move ${layerName(id)} into ${layerName(parentId)} at ${index} needs engine support`),
    group: (ids) =>
      setStatus(`Group ${ids.length} ${ids.length === 1 ? "layer" : "layers"} needs engine support`),
  };

  // Ctrl/Cmd+G groups the selection, like Figma.
  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isGroup =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === "g";
      if (!isGroup || isEditingText(event.target)) return;

      event.preventDefault();
      const ids = viewportController()?.getSelectionIds() ?? [];
      if (ids.length > 0) layerCommands.group(ids);
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  return (
    <div class="grid h-full grid-rows-[3rem_minmax(0,1fr)]">
      <Header status={status()} />

      <main class="grid min-h-0 grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar
          templateSettings={templateSettings}
          setTemplateSettings={setTemplateSettings}
          previewVisible={previewVisible()}
          layerCommands={layerCommands}
          onStatusChange={setStatus}
        />

        <div class="relative min-h-0 min-w-0">
          <Viewport
            onStatusChange={setStatus}
            onSelectedObjectChange={setSelectedObject}
            onControllerReady={setViewportController}
            onDocumentRevisionChange={setDocumentRevision}
            onZoomChange={setZoom}
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

          <ToolDock
            activeTool={activeTool()}
            onToolChange={setActiveTool}
            zoom={zoom()}
            onZoomIn={() => setStatus("Zoom in needs engine support")}
            onZoomOut={() => setStatus("Zoom out needs engine support")}
            previewVisible={previewVisible()}
            onPreviewToggle={() => setPreviewVisible(!previewVisible())}
          />
        </div>
      </main>
    </div>
  );
}

function isEditingText(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, [role=combobox]"))
  );
}
