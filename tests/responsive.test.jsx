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

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(document.body.style.overflow).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer on Escape and restores body scroll", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the drawer when the viewport crosses the lg breakpoint", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      media.dispatch(true);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the drawer via backdrop click", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    fireEvent.click(screen.getByRole("button", { name: "Close inputs panel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates live key metrics when MRP changes in the drawer", () => {
    render(<App />);

    const defaultCalc = calculateEmiScenario({
      mrp: 107705,
      annualRate: 17,
      tenure: 6,
      isNoCost: true,
      procFee: 199,
    });
    const nextCalc = calculateEmiScenario({
      mrp: 50000,
      annualRate: 17,
      tenure: 6,
      isNoCost: true,
      procFee: 199,
    });

    expect(
      screen.getAllByText(formatCurrency(defaultCalc.baseEMI)).length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    const dialog = screen.getByRole("dialog", { name: "Calculator inputs" });
    const mrpInput = within(dialog).getByLabelText("Product MRP (₹)");
    fireEvent.change(mrpInput, { target: { value: "50000" } });

    expect(
      screen.getAllByText(formatCurrency(nextCalc.baseEMI)).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(formatCurrency(nextCalc.extraCostAboveMRP)).length
    ).toBeGreaterThan(0);
  });

  it("keeps focus in the MRP field while typing in the open drawer", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    const dialog = screen.getByRole("dialog", { name: "Calculator inputs" });
    const mrpInput = within(dialog).getByLabelText("Product MRP (₹)");
    mrpInput.focus();
    expect(document.activeElement).toBe(mrpInput);

    fireEvent.change(mrpInput, { target: { value: "50000" } });

    expect(document.activeElement).toBe(mrpInput);
    expect(mrpInput).toHaveValue(50000);
  });

  it("mounts only one MRP number input when the drawer is open", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    const numberMrps = screen
      .getAllByLabelText("Product MRP (₹)")
      .filter((el) => el.getAttribute("type") === "number");
    expect(numberMrps).toHaveLength(1);
  });

  it("marks the app chrome as inert while the drawer is open", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));

    const inertRegion = container.querySelector("[inert]");
    expect(inertRegion).toBeTruthy();
    expect(inertRegion?.getAttribute("aria-hidden")).toBe("true");
    // Background chrome is under inert (tabs still in DOM; AT ignores inert subtree)
    expect(inertRegion?.textContent).toMatch(/Schedule|Amortization/);
    // Dialog stays outside inert so it remains interactive
    expect(
      screen.getByRole("dialog", { name: "Calculator inputs" })
    ).toBeInTheDocument();
    expect(inertRegion?.contains(screen.getByRole("dialog"))).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(container.querySelector("[inert]")).toBeNull();
  });

  it("labels pre-closure month controls for assistive tech", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Pre-closure Simulator" })
    );

    expect(
      screen.getByLabelText("Simulate Pre-closure at end of Month")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Pre-closure month slider")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fee rate (%)")).toBeInTheDocument();
  });

  it("selects a pre-closure month via keyboard-activatable control", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Pre-closure Simulator" })
    );

    const month5 = screen.getByRole("button", {
      name: /Select pre-closure at month 5/i,
    });
    fireEvent.click(month5);

    expect(
      screen.getByText(/TOTAL COST IF YOU PRE-CLOSE AT MONTH 5/i)
    ).toBeInTheDocument();
    expect(month5).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes full tab names to assistive tech while short labels exist in DOM", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "Amortization Schedule" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pre-closure Simulator" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Full Summary" })
    ).toBeInTheDocument();

    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Pre-close")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("renders schedule month cards and table markup together (breakpoint CSS selects)", () => {
    render(<App />);

    expect(screen.getAllByText(/Month 1/).length).toBeGreaterThan(0);
    expect(screen.getByText("Opening Balance")).toBeInTheDocument();
    expect(screen.getByText("Total Monthly")).toBeInTheDocument();
    expect(screen.getByText("PRINCIPAL AMORTIZED")).toBeInTheDocument();
  });

  it("renders pre-closure mobile cards and desktop table structure", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Pre-closure Simulator" })
    );

    expect(
      screen.getByText(/Simulate Pre-closure at end of Month/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Outstanding Principal")).toBeInTheDocument();
    expect(screen.getAllByText(/Month 3/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Full Tenure").length).toBeGreaterThan(0);
  });

  it("closes an open drawer when media flips to desktop", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
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

  it("AppShell uses a desktop rail and hides the rail below lg", () => {
    const { container } = render(<App />);
    const asides = container.querySelectorAll("aside");
    expect(asides.length).toBe(1);
    expect(asides[0].className).toMatch(/hidden/);
    expect(asides[0].className).toMatch(/lg:flex/);

    const root = container.firstChild;
    expect(root.className).toMatch(/h-dvh/);
    expect(root.className).toMatch(/overflow-hidden/);
  });

  it("key metrics bar is mobile-only (lg:hidden)", () => {
    render(<App />);
    const baseEmiLabels = screen.getAllByText("Base EMI");
    expect(baseEmiLabels.length).toBeGreaterThan(0);
    let node = baseEmiLabels[0];
    let found = false;
    while (node) {
      if (node.className && String(node.className).includes("lg:hidden")) {
        found = true;
        break;
      }
      node = node.parentElement;
    }
    expect(found).toBe(true);
  });
});
