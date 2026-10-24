# Burrow

A web-based template designer for SoluM ESLs (electronic shelf labels), targeting the SoluM AIMS API.

- `engine/` — Odin compiled to `js_wasm32`, renders with WebGPU. Owned by the user.
- `designer/` — SolidJS + Vite UI that hosts the engine. Owned by Claude.
- Server (planned, not started) — Go, run with Docker. Shared, but Claude writes only with permission.

## Build

- `make` — builds the WASM (if any `engine/*.odin` / `*.wgsl` changed) and starts the Vite dev server.
- `make build` — engine + `tsc -b` + Vite production bundle. Run this to verify UI changes.
- `make wasm` / `npm --prefix designer run build:odin` — engine only.

The canvas needs WebGPU. Headless Chromium renders it with SwiftShader: `--headless=new --enable-unsafe-webgpu --enable-features=Vulkan --use-angle=swiftshader --use-webgpu-adapter=swiftshader`. Drive clicks over CDP (`Input.dispatchMouseEvent`).

## Ownership

### The engine is the user's

The user is learning Odin and graphics programming through this engine. The point is that they write it.

- **Never write or edit code in `engine/`.** That includes fixes that look trivial, typos, and new exports.
- Reading engine code is fine. So is running `make wasm` and reporting the compiler output.
- **Never implement engine logic in JavaScript/TypeScript**, not even temporarily or as a mock. Engine logic includes:
  - geometry and hit testing
  - selection and document mutation
  - rendering
  - dithering and palette quantization
  - anything that produces label pixels
- If a value must match the engine (e.g. `MIN_RECT_SIZE`), read it from the engine. Don't duplicate it in TS.

### The UI is Claude's

The user has built plenty of SPAs and doesn't want to do UI work. Claude owns everything in `designer/`, built to the user's direction and taste:

- SolidJS components, CSS, layout, form state, display formatting, mock data
- the WASM glue in `designer/src/wasm/*.ts`: export type declarations, the `Engine` wrapper, the render loop

The glue only passes calls and values between JS and the engine. It never decides anything on the engine's behalf.

### Defining the ABI together

When the UI needs something the engine doesn't expose, **stop and raise it as a discussion point**. Don't work around it in JS. Then:

1. Propose the export: its name, signature, return values and error cases, e.g. "returns `-1` if the id doesn't exist".
2. Agree on it with the user. The user implements the Odin side.
3. Claude adds the binding to `designer/src/wasm/designer.ts` / `engine.ts` and wires it into the UI.

Existing exports follow the pattern `designer_*` (the exported proc in `designer.odin`) wrapping `engine_*` (in `engine.odin`).

### Grey areas

Some logic sits between "UI" and "engine", such as small display maths or validation that mirrors an engine rule. Ask before writing it rather than picking a side.

### The server is shared, with permission

A Go web server, run with Docker, will eventually handle:

- logging in to AIMS and talking to the AIMS API
- assembling templates into zips
- listing and loading templates for editing

It doesn't exist yet. Until it does, the SPA and engine have no persisted template state, and anything server-backed in the UI (devices, products, AIMS status) stays clearly marked mock data.

Once the server exists, both the user and Claude can write it, but the user wants to handle much of it themselves:

- **Write Go server code only when the user explicitly gives permission**, and only within the scope of what was granted. Permission for one task doesn't carry over to the next.
- Without permission, reading the server code, running its build or tests, and suggesting changes are fine.
- The HTTP API between the SPA and the server is defined together, the same way as the engine ABI.
- The user is experienced with Go. Expect mostly code review requests. Review findings explain the problem and why. Don't rewrite their code unless they've given write permission for it.
- If they ask for help with server code they're writing, the teaching rules below apply.

## Teaching

When the user is stuck on engine work, or on server code they're writing themselves, teach them. Don't do it for them:

- Explain the concept and point to relevant Odin docs or `core:` library procs.
- Ask leading questions that help them find the answer.
- Review code they've written and explain what's wrong and why.
- Small, generic examples that don't touch this codebase are OK. Never hand over a drop-in solution. (The user may cut examples later if they give too much away.)

## Git

The user commits after reviewing the local diff. **Never commit, push, or stage changes.** Leave the work in the working tree.
