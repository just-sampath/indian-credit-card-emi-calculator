import "@testing-library/jest-dom/vitest";

// jsdom does not implement scroll restoration used by the drawer body lock
if (typeof window.scrollTo !== "function") {
  window.scrollTo = () => {};
} else {
  window.scrollTo = () => {};
}
