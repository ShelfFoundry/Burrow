import { For } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import {
  DITHERING_OPTIONS,
  LABEL_SIZE_OPTIONS,
  MOCK_PRODUCTS,
  PALETTE_OPTIONS,
  findPalette,
  type DeviceStatus,
  type TemplateSettings,
} from "../template/settings";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

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
    <div class="inspector-form">
      <section class="inspector-section">
        <h3 class="inspector-section-title">Template</h3>

        <TextField
          label="Name"
          value={props.settings.name}
          onValueChange={(name) => props.setSettings("name", name)}
        />
      </section>

      <section class="inspector-section">
        <h3 class="inspector-section-title">Device</h3>

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
      </section>

      <section class="inspector-section">
        <h3 class="inspector-section-title">Display</h3>

        <SelectField
          label="Device"
          value={props.settings.labelSize}
          options={LABEL_SIZE_OPTIONS}
          onValueChange={(labelSize) => props.setSettings("labelSize", labelSize)}
        />

        <div class="field">
          <span>Orientation</span>
          <div class="segmented">
            <button
              type="button"
              classList={{ active: props.settings.orientation === "landscape" }}
              onClick={() => props.setSettings("orientation", "landscape")}
            >
              Landscape
            </button>
            <button
              type="button"
              classList={{ active: props.settings.orientation === "portrait" }}
              onClick={() => props.setSettings("orientation", "portrait")}
            >
              Portrait
            </button>
          </div>
        </div>

        <SelectField
          label="Palette"
          value={props.settings.palette}
          options={PALETTE_OPTIONS}
          onValueChange={(palette) => props.setSettings("palette", palette)}
        />

        <div class="palette-swatches">
          <For each={findPalette(props.settings.palette).colors}>
            {(color) => <span class="palette-swatch" style={{ background: color }} title={color} />}
          </For>
        </div>

        <SelectField
          label="Dithering"
          value={props.settings.dithering}
          options={DITHERING_OPTIONS}
          onValueChange={(dithering) => props.setSettings("dithering", dithering)}
        />
      </section>

      <section class="inspector-section">
        <button
          type="button"
          class="primary"
          disabled={!canPush()}
          onClick={() => props.onStatusChange?.("Send to device not implemented yet")}
        >
          Send to device
        </button>
        {canPush() && (
          <p class="field-hint">
            Renders this template for the selected product and pushes it via AIMS.
          </p>
        )}
      </section>
    </div>
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
    <div class="device-status" data-status={props.status.kind}>
      <div class="device-status-header">
        <span class="status-dot" />
        <strong>{label()}</strong>
        {props.status.kind !== "no-device" && (
          <button type="button" class="small" disabled={!canCheck()} onClick={props.onCheck}>
            {props.status.kind === "unchecked" ? "Check" : "Refresh"}
          </button>
        )}
      </div>

      {props.status.kind === "no-device" && (
        <p class="field-hint">Enter a device ID to check availability.</p>
      )}

      {props.status.kind === "online" && (
        <div class="device-status-details">
          <span>Battery</span>
          <strong>{props.status.battery}%</strong>
          <span>Signal</span>
          <strong>{props.status.signalDbm} dBm ({signalQuality(props.status.signalDbm)})</strong>
          <span>Last seen</span>
          <strong>{props.status.lastSeen}</strong>
        </div>
      )}

      {props.status.kind === "offline" && (
        <p class="field-hint">Last seen {props.status.lastSeen}</p>
      )}
    </div>
  );
}

function signalQuality(dbm: number): string {
  if (dbm >= -65) return "good";
  if (dbm >= -80) return "fair";
  return "poor";
}
