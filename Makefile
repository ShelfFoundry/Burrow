ENGINE_DIR   := engine
DESIGNER_DIR := designer

WASM         := $(DESIGNER_DIR)/public/designer.wasm
ENGINE_SRCS  := $(wildcard $(ENGINE_DIR)/*.odin $(ENGINE_DIR)/*.wgsl)
NODE_MODULES := $(DESIGNER_DIR)/node_modules/.package-lock.json

.PHONY: all dev wasm build clean

all: dev

# Build the engine (if stale) and start the Vite dev server.
dev: $(WASM) $(NODE_MODULES)
	npm --prefix $(DESIGNER_DIR) run dev

wasm: $(WASM)

# Production build: engine + type-check + Vite bundle into designer/dist.
build: $(WASM) $(NODE_MODULES)
	npm --prefix $(DESIGNER_DIR) run build

# Only rebuilds when an engine source or loaded shader changes.
$(WASM): $(ENGINE_SRCS)
	npm --prefix $(DESIGNER_DIR) run build:odin

$(NODE_MODULES): $(DESIGNER_DIR)/package.json $(DESIGNER_DIR)/package-lock.json
	npm --prefix $(DESIGNER_DIR) install
	@touch $@

clean:
	rm -f $(WASM)
	rm -rf $(DESIGNER_DIR)/dist
