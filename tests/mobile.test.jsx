import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { vi } from "vitest";
import App from "../src/App.jsx";

function setUrl(query) {
  window.history.replaceState(null, "", `/${query}`);
}

function editButton() {
  return screen.getByRole("button", { name: "Edit inputs" });
}

describe("scenario survives reloads and can be shared", () => {
  it("restores inputs and the active tab from the URL", () => {
    setUrl("?type=regular&mrp=50000&tenure=12&tab=preclosure");
    render(<App />);

    expect(
      screen.getByRole("tab", { name: "Pre-closure Simulator" })
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Regular EMI" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "12 months" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByLabelText("Product MRP (₹)")).toHaveValue("50,000");
  });

  it("ignores values in the URL that are out of range", () => {
    setUrl("?mrp=-5&tenure=999&rate=abc&tab=nope");
    render(<App />);

    expect(screen.getByLabelText("Product MRP (₹)")).toHaveValue("1,07,705");
    expect(screen.getByRole("button", { name: "6 months" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("tab", { name: "Amortization Schedule" })
    ).toHaveAttribute("aria-selected", "true");
  });

  it("writes changes into the URL and keeps defaults out of it", () => {
    render(<App />);
    expect(window.location.search).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "24 months" }));
    fireEvent.click(screen.getByRole("tab", { name: "Full Summary" }));

    const params = new URLSearchParams(window.location.search);
    expect(params.get("tenure")).toBe("24");
    expect(params.get("tab")).toBe("summary");
    expect(params.has("mrp")).toBe(false);
  });

  it("copies the link when the share sheet is not available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalShare = navigator.share;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Full Summary" }));
    fireEvent.click(screen.getByRole("button", { name: "Share link" }));

    await screen.findByText("Link copied");
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: originalShare,
    });
  });
});

describe("phone back button and the inputs drawer", () => {
  it("adds a history entry so back closes the drawer", async () => {
    render(<App />);

    fireEvent.click(editButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(window.history.state?.inputsDrawer).toBe(true);

    act(() => {
      window.history.back();
    });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("keeps the URL current after going back from the drawer", async () => {
    render(<App />);

    fireEvent.click(editButton());
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "12 months" }));

    act(() => {
      window.history.back();
    });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(new URLSearchParams(window.location.search).get("tenure")).toBe(
      "12"
    );
  });

  it("makes the whole bottom bar one button that describes the scenario", () => {
    render(<App />);
    const button = editButton();

    expect(button).toHaveAccessibleDescription(
      /No Cost EMI · 6 months.*₹1,07,705/
    );
    expect(within(button).getByText(/No Cost EMI · 6 months/)).toBeVisible();
  });
});

describe("long tenures on phones", () => {
  it("folds a 60-month schedule into year groups with the first open", () => {
    setUrl("?tenure=60");
    const { container } = render(<App />);

    const years = container.querySelectorAll('details[class*="group/year"]');
    expect(years).toHaveLength(5);
    expect(years[0]).toHaveAttribute("open");
    expect(years[1]).not.toHaveAttribute("open");
    expect(within(years[1]).getByText("Months 13 to 24")).toBeInTheDocument();
  });

  it("keeps a year or less as a plain list without a duplicate totals card", () => {
    const { container } = render(<App />);

    expect(
      container.querySelectorAll('details[class*="group/year"]')
    ).toHaveLength(0);
    expect(
      screen.queryByRole("heading", { level: 3, name: "Total" })
    ).not.toBeInTheDocument();
  });
});

describe("pre-closure on phones", () => {
  it("steps the month with 44px buttons and stops at the limits", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    const next = screen.getByRole("button", { name: "Next month" });
    const previous = screen.getByRole("button", { name: "Previous month" });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(
      screen.getByText(/Total cost if you close after month 5/i)
    ).toBeInTheDocument();
    expect(next).toBeDisabled();

    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(previous);
    }
    expect(previous).toBeDisabled();
    expect(
      screen.getByText(/Total cost if you close after month 1/i)
    ).toBeInTheDocument();
  });

  it("tucks the rarely changed charges behind a summary line", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    const charges = screen.getByText("Pre-closure charges").closest("details");
    expect(charges).not.toHaveAttribute("open");
    expect(
      within(charges).getByText("3% fee · 1 month of interest · no clawback")
    ).toBeInTheDocument();
  });

  it("scrolls the result into view when a month far down is picked", () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));
    const result = screen
      .getByText(/Total cost if you close after month 3/i)
      .closest("section");
    // Pretend the result has scrolled off the top of the screen.
    result.getBoundingClientRect = () => ({ top: -900, bottom: -600 });

    fireEvent.click(screen.getAllByText("After month 5")[0].closest("button"));

    expect(
      screen.getByText(/Total cost if you close after month 5/i)
    ).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalled();
    delete window.HTMLElement.prototype.scrollIntoView;
  });
});
