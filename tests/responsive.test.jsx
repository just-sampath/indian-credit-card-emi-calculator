import { act, fireEvent, render, screen, within } from "@testing-library/react";
import App from "../src/App.jsx";
import { formatCurrency } from "../src/lib/format.js";
import { calculateEmiScenario } from "../src/lib/emi.js";

function mockMatchMedia(matches) {
  const listeners = new Set();
  const media = {
    matches,
    media: "(min-width: 1024px)",
    addEventListener: (event, handler) => {
      if (event === "change") {
        listeners.add(handler);
      }
    },
    removeEventListener: (event, handler) => {
      if (event === "change") {
        listeners.delete(handler);
      }
    },
    addListener: (handler) => listeners.add(handler),
    removeListener: (handler) => listeners.delete(handler),
    dispatch: (nextMatches) => {
      media.matches = nextMatches;
      listeners.forEach((handler) => handler({ matches: nextMatches }));
    },
  };
  window.matchMedia = () => media;
  return media;
}

const openDrawer = () =>
  fireEvent.click(screen.getByRole("button", { name: "Edit inputs" }));

describe("responsive shell & drawer", () => {
  let media;

  beforeEach(() => {
    media = mockMatchMedia(false);
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks body scroll while the drawer is open and restores on Done", () => {
    render(<App />);

    openDrawer();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(document.body.style.overflow).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer on Escape and restores body scroll", () => {
    render(<App />);

    openDrawer();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the drawer when the viewport crosses the lg breakpoint", () => {
    render(<App />);

    openDrawer();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      media.dispatch(true);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the drawer via backdrop click", () => {
    render(<App />);

    openDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Close inputs panel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows live results inside the drawer that follow MRP changes", () => {
    render(<App />);

    const nextCalc = calculateEmiScenario({
      mrp: 50000,
      annualRate: 17,
      tenure: 6,
      isNoCost: true,
      procFee: 199,
    });

    openDrawer();
    const dialog = screen.getByRole("dialog", { name: "Calculator inputs" });
    const mrpInput = within(dialog).getByLabelText("Product MRP (₹)");
    fireEvent.change(mrpInput, { target: { value: "50000" } });

    expect(
      within(dialog).getByText(formatCurrency(nextCalc.schedule[0].totalPaid))
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(formatCurrency(nextCalc.extraCostAboveMRP))
    ).toBeInTheDocument();
  });

  it("keeps focus in the MRP field while typing in the open drawer", () => {
    render(<App />);

    openDrawer();
    const dialog = screen.getByRole("dialog", { name: "Calculator inputs" });
    const mrpInput = within(dialog).getByLabelText("Product MRP (₹)");
    mrpInput.focus();
    expect(document.activeElement).toBe(mrpInput);

    fireEvent.change(mrpInput, { target: { value: "50000" } });

    expect(document.activeElement).toBe(mrpInput);
    expect(mrpInput).toHaveValue("50000");
  });

  it("mounts only one MRP field when the drawer is open", () => {
    render(<App />);

    openDrawer();
    expect(screen.getAllByLabelText("Product MRP (₹)")).toHaveLength(1);
  });

  it("marks the app chrome as inert while the drawer is open", () => {
    const { container } = render(<App />);

    openDrawer();

    const inertRegion = container.querySelector("[inert]");
    expect(inertRegion).toBeTruthy();
    expect(inertRegion?.getAttribute("aria-hidden")).toBe("true");
    expect(inertRegion?.textContent).toMatch(/Schedule|Amortization/);
    expect(
      screen.getByRole("dialog", { name: "Calculator inputs" })
    ).toBeInTheDocument();
    expect(inertRegion?.contains(screen.getByRole("dialog"))).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(container.querySelector("[inert]")).toBeNull();
  });

  it("summarises the current scenario in the mobile bottom bar", () => {
    render(<App />);

    expect(screen.getByText("No Cost EMI · 6 months")).toBeInTheDocument();
    expect(screen.getByText(/₹1,07,705 · 17% p\.a\./)).toBeInTheDocument();
  });

  it("labels pre-closure controls for assistive tech", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    expect(
      screen.getByLabelText("Close the loan after month")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Pre-closure month slider")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Pre-closure fee (%)")).toBeInTheDocument();
    expect(screen.getByLabelText("Merchant clawback (₹)")).toBeInTheDocument();
  });

  it("selects a pre-closure month via keyboard-activatable control", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    const month5 = screen.getByRole("button", {
      name: /Select pre-closure at month 5/i,
    });
    fireEvent.click(month5);

    expect(
      screen.getByText(/Total cost if you close after month 5/i)
    ).toBeInTheDocument();
    expect(month5).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes full tab names to assistive tech while short labels exist in DOM", () => {
    render(<App />);

    expect(
      screen.getByRole("tablist", { name: "Result views" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Amortization Schedule" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Pre-closure Simulator" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Full Summary" })
    ).toBeInTheDocument();

    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Pre-close")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("renders schedule month cards and table markup together (breakpoint CSS selects)", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Month 1" })
    ).toBeInTheDocument();
    expect(screen.getByText("Opening balance")).toBeInTheDocument();
    expect(screen.getByText("Statement debit")).toBeInTheDocument();
    expect(screen.getByText("Closing balance")).toBeInTheDocument();
  });

  it("renders pre-closure cards and table without the redundant final month", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    expect(
      screen.getByRole("columnheader", { name: "Outstanding principal" })
    ).toBeInTheDocument();
    expect(screen.getByText("After month 5")).toBeInTheDocument();
    expect(screen.queryByText("After month 6")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Select pre-closure at month 6/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Full tenure (no pre-closure)")
    ).toBeInTheDocument();
  });

  it("closes an open drawer when media flips to desktop", () => {
    render(<App />);

    openDrawer();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      media.dispatch(false);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      media.dispatch(true);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("responsive class contracts", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("uses an inputs rail in the shell layout and hides it on phones", () => {
    const { container } = render(<App />);
    const asides = container.querySelectorAll("aside");
    expect(asides.length).toBe(1);
    expect(asides[0].className).toMatch(/hidden/);
    expect(asides[0].className).toMatch(/shell:block/);

    // Outside the shell layout the page is a normal scrolling document.
    const root = container.firstChild;
    expect(root.className).toMatch(/shell:h-dvh/);
    expect(root.className).toMatch(/shell:overflow-hidden/);
  });

  it("keeps the inputs summary bar outside the shell layout only", () => {
    render(<App />);
    const editButton = screen.getByRole("button", { name: "Edit inputs" });
    expect(editButton.closest(".fixed")?.className).toMatch(/shell:hidden/);
  });

  it("shows the results row at every breakpoint", () => {
    render(<App />);
    const results = screen.getByRole("region", { name: "Results" });
    let node = results;
    while (node) {
      expect(String(node.className ?? "")).not.toMatch(/(^|\s)shell:hidden/);
      node = node.parentElement;
    }
  });
});
