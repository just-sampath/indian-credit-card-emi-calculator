import "@testing-library/jest-dom/vitest";

// jsdom does not implement scroll restoration used by the drawer body lock
window.scrollTo = () => {};

// Inputs live in the URL, so every test starts from a clean address.
afterEach(() => {
  window.history.replaceState(null, "", "/");
});
