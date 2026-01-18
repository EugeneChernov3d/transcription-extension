import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["contextMenus"],
    // host_permissions: [
    //   'https://transcription-api-omega.vercel.app/*',
    //   'http://localhost:3000/*',
    // ],
  },
});
