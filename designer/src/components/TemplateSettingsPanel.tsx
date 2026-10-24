import { For } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import {
  DITHERING_OPTIONS,
  LABEL_SIZE_OPTIONS,
  MOCK_PRODUCTS,
  PALETTE_OPTIONS,
  findPalette,
  type DeviceStatus,
  type Orientation,
  type SelectOption,
  type TemplateSettings,
} from "../template/settings";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";
import { FieldLabel, PanelSection, Segmented, Swatch } from "./ui";

const ORIENTATION_OPTIONS: SelectOption<Orientation>[] = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
];

type TemplateSettingsPanelProps = {
  settings: TemplateSettings;
  setSettings: SetStoreFunction<TemplateSettings>;
  onStatusChange?: (message: string) => void;
};

export function TemplateSettingsPanel(props: TemplateSettingsPanelProps) {
  const canPush = () =>
    props.settings.deviceStatus.kind === "online" && props.settings.productId !== "";

  function setDeviceId(deviceId: string) {
    props.setSettings({
      deviceId,
      deviceStatus: deviceId.trim() === "" ? { kind: "no-device" } : { kind: "unchecked" },
    });
  }

  // MOCK: pretend to ask AIMS for the label's status.
  function checkDevice() {
    const deviceId = props.settings.deviceId;
    props.setSettings("deviceStatus", { kind: "checking" });

    setTimeout(() => {
      if (props.settings.deviceId !== deviceId) return;
      props.setSettings("deviceStatus", {
        kind: "online",
        battery: 87,
        signalDbm: -61,
        lastSeen: "Just now",
      });
    }, 700);
  }

  return (
    <>
      <PanelSection title="Device">
        <TextField
          label="Device ID"
          placeholder="Label code, e.g. 0A1B2C3D4E5F"
          monospace
          value={props.settings.deviceId}
          onValueChange={setDeviceId}
        />

        <DeviceStatusCard
          status={props.settings.deviceStatus}
          onCheck={checkDevice}
        />

        <SelectField
          label="Product"
          placeholder="None"
          value={props.settings.productId}
          options={MOCK_PRODUCTS}
          onValueChange={(productId) => props.setSettings("productId", productId)}
        />
      </PanelSection>

      <PanelSection title="Display">
        <SelectField
          label="Device"
          value={props.settings.labelSize}
          options={LABEL_SIZE_OPTIONS}
          onValueChange={(labelSize) => props.setSettings("labelSize", labelSize)}
        />

        <div class="flex flex-col gap-1">
          <FieldLabel>Orientation</FieldLabel>
          <Segmented
            value={props.settings.orientation}
            options={ORIENTATION_OPTIONS}
            onValueChange={(orientation) => props.setSettings("orientation", orientation)}
          />
        </div>

        <SelectField
          label="Palette"
          value={props.settings.palette}
          options={PALETTE_OPTIONS}
          onValueChange={(palette) => props.setSettings("palette", palette)}
        />

        <div class="flex gap-1.5">
          <For each={findPalette(props.settings.palette).colors}>
            {(color) => <Swatch color={color} title={color} class="size-4" />}
          </For>
        </div>

        <SelectField
          label="Dithering"
          value={props.settings.dithering}
          options={DITHERING_OPTIONS}
          onValueChange={(dithering) => props.setSettings("dithering", dithering)}
        />
      </PanelSection>

      <PanelSection>
        <button
          type="button"
          class="h-8 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary-alt disabled:opacity-40"
          disabled={!canPush()}
          onClick={() => props.onStatusChange?.("Send to device not implemented yet")}
        >
          Send to device
        </button>
        {canPush() && (
          <p class="text-[11px] text-fg-muted">
            Renders this template for the selected product and pushes it via AIMS.
          </p>
        )}
      </PanelSection>
    </>
  );
}

type DeviceStatusCardProps = {
  status: DeviceStatus;
  onCheck: () => void;
};

function DeviceStatusCard(props: DeviceStatusCardProps) {
  const label = () => {
    switch (props.status.kind) {
      case "no-device": return "No device";
      case "unchecked": return "Not checked";
      case "checking": return "Checking…";
      case "online": return "Online";
      case "offline": return "Offline";
    }
  };

  const canCheck = () => props.status.kind !== "checking";

  return (
    <div class="flex flex-col gap-2 rounded-md border border-border p-2.5">
      <div class="flex h-5 items-center gap-2">
        <span class={`size-2 rounded-full ${STATUS_DOT[props.status.kind]}`} />
        <strong class="flex-1 text-xs font-medium text-fg-strong">{label()}</strong>
        {props.status.kind !== "no-device" && (
          <button
            type="button"
            class="h-5 rounded bg-field px-2 text-[11px] text-fg transition-colors hover:bg-selected disabled:opacity-40"
            disabled={!canCheck()}
            onClick={props.onCheck}
          >
            {props.status.kind === "unchecked" ? "Check" : "Refresh"}
          </button>
        )}
      </div>

      {props.status.kind === "no-device" && (
        <p class="text-[11px] text-fg-muted">Enter a device ID to check availability.</p>
      )}

      {props.status.kind === "online" && (
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          <dt class="text-fg-muted">Battery</dt>
          <dd class="text-right text-fg-strong">{props.status.battery}%</dd>
          <dt class="text-fg-muted">Signal</dt>
          <dd class="text-right text-fg-strong">
            {props.status.signalDbm} dBm ({signalQuality(props.status.signalDbm)})
          </dd>
          <dt class="text-fg-muted">Last seen</dt>
          <dd class="text-right text-fg-strong">{props.status.lastSeen}</dd>
        </dl>
      )}

      {props.status.kind === "offline" && (
        <p class="text-[11px] text-fg-muted">Last seen {props.status.lastSeen}</p>
      )}
    </div>
  );
}

const STATUS_DOT: Record<DeviceStatus["kind"], string> = {
  "no-device": "bg-fg-muted",
  unchecked: "bg-yellow",
  checking: "bg-blue animate-pulse",
  online: "bg-green ring-3 ring-green/25",
  offline: "bg-red",
};

function signalQuality(dbm: number): string {
  if (dbm >= -65) return "good";
  if (dbm >= -80) return "fair";
  return "poor";
}
