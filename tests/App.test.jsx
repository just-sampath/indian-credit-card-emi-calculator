import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App.jsx";

describe("App", () => {
  it("renders the calculator heading, controls, and default tab", () => {
    render(<App />);

    expect(screen.getByText("Credit Card EMI Calculator")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Amortization Schedule" })
    ).toBeInTheDocument();
    expect(screen.getByText("Product MRP (₹)")).toBeInTheDocument();
    expect(screen.getByText("PRINCIPAL AMORTIZED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inputs" })).toBeInTheDocument();
  });

  it("opens the mobile inputs drawer from the header", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));

    expect(
      screen.getByRole("dialog", { name: "Calculator inputs" })
    ).toBeInTheDocument();
    // Single control tree: MRP lives only in the drawer while it is open
    expect(screen.getByLabelText("Product MRP (₹)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.queryByRole("dialog", { name: "Calculator inputs" })
    ).not.toBeInTheDocument();
  });

  it("switches from the schedule tab to the pre-closure tab", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Pre-closure Simulator" })
    );

    expect(
      screen.getByText(/Simulate Pre-closure at end of Month/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/TOTAL COST IF YOU PRE-CLOSE AT MONTH/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Accrued\/advance interest/i).length
    ).toBeGreaterThan(0);
  });

  it("renders the summary sections and comparison table", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Full Summary" }));

    expect(screen.getByText("Loan Structure")).toBeInTheDocument();
    expect(screen.getByText("Total Cost Breakdown")).toBeInTheDocument();
    expect(screen.getByText(/No Cost EMI vs Regular EMI/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/GST on processing fee/i).length
    ).toBeGreaterThan(0);
  });
});
