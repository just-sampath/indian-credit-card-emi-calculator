import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => {
  // A stray NODE_ENV in the shell (anything but "production") makes Vite ship
  // React's development build and dev JSX with local file paths in it.
  if (command === "build") {
    process.env.NODE_ENV = "production";
  }

  return {
    base: "/indian-credit-card-emi-calculator/",
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./tests/setup.js",
    },
  };
});
