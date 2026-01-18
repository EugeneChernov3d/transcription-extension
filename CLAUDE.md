# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WXT (Web Extension Tools) browser extension project using React and TypeScript. WXT is a modern framework for building browser extensions with a developer experience similar to Vite/Nuxt.

## Development Commands

```bash
# Development
pnpm dev              # Start development server for Chrome
pnpm dev:firefox      # Start development server for Firefox

# Building
pnpm build            # Build extension for Chrome
pnpm build:firefox    # Build extension for Firefox

# Distribution
pnpm zip              # Create extension ZIP file for Chrome
pnpm zip:firefox      # Create Firefox-compatible ZIP

# Type checking
pnpm compile          # Run TypeScript type checking (no emit)
```

**Note:** Always run `pnpm install` after cloning to trigger the `postinstall` hook that prepares the WXT environment.

## Architecture

### Entry Points System

WXT uses a file-based routing system for extension entry points located in `entrypoints/`:

- **`background.ts`** - Service worker (background script) that runs persistently in the browser
- **`content.ts`** - Content script that runs in the context of web pages
- **`popup/`** - Extension popup UI built with React

Each entry point is automatically discovered by WXT and included in the generated manifest.json.

### Manifest Configuration

The extension uses Chrome Manifest V3. Key configuration is in `wxt.config.ts`:
- Uses `@wxt-dev/module-react` for React support
- Permissions and host permissions are defined per entry point via export configuration
- Icons in `public/icon/` at standard sizes (16, 32, 48, 96, 128px)

### TypeScript Configuration

- Base config: `tsconfig.json`
- Extended WXT config: `.wxt/tsconfig.json`
- Path aliases available: `@/`, `~/`, `@@/`, `~~/` (point to project root)
- Strict mode enabled

### Build Output

- Development: `.output/<browser>-mv3/` (rebuilt on file changes with HMR)
- Production: `.output/<browser>-mv3/` (optimized build)

## Key Patterns

### Content Script Targeting

Content scripts specify which pages they run on via the `default` export:
```typescript
export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main: () => { /* script content */ }
});
```

### React Popup

The popup uses standard React patterns with Vite-style HMR. Entry point is `popup/main.tsx` importing `App.tsx`.

### Extension Context

Use WXT's browser APIs (`browser.*` or `chrome.*`) which are auto-imported and typed. WXT provides type-safe access to WebExtension APIs.

## Package Manager

This project uses **pnpm** (evidenced by `pnpm-lock.yaml`). Always use `pnpm` commands instead of `npm` or `yarn`.
