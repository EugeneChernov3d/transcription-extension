import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html

export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["contextMenus"],
    commands: {
      'proofread-selection': {
        description: 'Proofread selected text',
        suggested_key: {
          default: 'Alt+P',
          mac: 'Alt+P',
        },
      },
    },
    // host_permissions: [
    //   'https://transcription-api-omega.vercel.app/*',
    //   'http://localhost:3000/*',
    // ],
  },
});
