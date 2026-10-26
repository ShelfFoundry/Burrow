import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Viewport, type ViewportController } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { ToolDock, type Tool } from './components/ToolDock';
import { selectedObjectSnapshotsEqual, type SelectedObjectSnapshot } from './wasm/engine';
import { createTemplateSettingsStore } from './template/settings';
import {
  findLayer,
  layersFromObjects,
  layerTreesEqual,
  type LayerCommands,
  type LayerId,
} from './layers/layers';

export default function App() {
  const [selectedObject, setSelectedObject] = createSignal<SelectedObjectSnapshot>(
    { kind: "none" },
    { equals: selectedObjectSnapshotsEqual },
  );
  const [templateSettings, setTemplateSettings] = createTemplateSettingsStore();
  const [status, setStatus] = createSignal("Ready");
  const [viewportController, setViewportController] = createSignal<ViewportController | undefined>();
  const [documentRevision, setDocumentRevision] = createSignal(0);
  const [selectedIds, setSelectedIds] = createSignal<number[]>([], { equals: sameIds });
  const [zoom, setZoom] = createSignal(1);
  // The engine has no tool modes yet. Square and Line create objects through the
  // add exports (see Viewport); the other tools are UI state only.
  const [activeTool, setActiveTool] = createSignal<Tool>("select");
  const [previewVisible, setPreviewVisible] = createSignal(true);

  // Re-read whenever the engine reports a new document revision.
  const layers = createMemo(
    () => {
      documentRevision();
      return layersFromObjects(viewportController()?.getObjects() ?? []);
    },
    [],
    { equals: layerTreesEqual },
  );

  const layerName = (id: LayerId | null) =>
    id === null ? "top level" : `"${findLayer(layers(), id)?.name ?? `#${id}`}"`;

  // Layer intents. Moving and grouping wait on engine exports.
  const layerCommands: LayerCommands = {
    select: (id, mode) => {
      if (!viewportController()?.selectObject(id, mode)) {
        setStatus(`Could not select ${layerName(id)}`);
      }
    },
    move: (id, { parentId, index }) =>
      setStatus(`Move ${layerName(id)} into ${layerName(parentId)} at ${index} needs engine support`),
    group: (ids) =>
      setStatus(`Group ${ids.length} ${ids.length === 1 ? "layer" : "layers"} needs engine support`),
  };

  // Ctrl/Cmd+G groups the selection, like Figma. Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or
  // Ctrl+Y redoes. Escape cancels a drag in progress, or otherwise leaves a creation tool.
  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isEditingText(event.target)) {
        if (viewportController()?.cancelInteraction()) {
          event.preventDefault();
          return;
        }
        if (activeTool() !== "select") {
          setActiveTool("select");
          return;
        }
      }

      // Text fields keep the browser's own undo.
      const mod = (event.ctrlKey || event.metaKey) && !event.altKey;
      const key = event.key.toLowerCase();
      const isUndo = mod && !event.shiftKey && key === "z";
      const isRedo = mod && ((event.shiftKey && key === "z") || (!event.shiftKey && key === "y"));
      if ((isUndo || isRedo) && !isEditingText(event.target)) {
        event.preventDefault();
        if (isUndo) viewportController()?.undo();
        else viewportController()?.redo();
        return;
      }

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
          layers={layers()}
          selectedLayerIds={selectedIds()}
          layerCommands={layerCommands}
          onStatusChange={setStatus}
        />

        <div class="relative min-h-0 min-w-0">
          <Viewport
            onStatusChange={setStatus}
            onSelectedObjectChange={setSelectedObject}
            onSelectionChange={setSelectedIds}
            onControllerReady={setViewportController}
            onDocumentRevisionChange={setDocumentRevision}
            onZoomChange={setZoom}
            activeTool={activeTool()}
            onObjectCreated={() => setActiveTool("select")}
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

function sameIds(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function isEditingText(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, [role=combobox]"))
  );
}
