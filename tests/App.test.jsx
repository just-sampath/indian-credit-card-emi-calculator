import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App.jsx";

describe("App", () => {
  it("renders the calculator heading, controls, and default tab", () => {
    render(<App />);

    expect(
      screen.getByText("Credit Card EMI Calculator")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Amortization Schedule" })
    ).toBeInTheDocument();
    expect(screen.getByText("Product MRP (₹)")).toBeInTheDocument();
    expect(screen.getByText("PRINCIPAL AMORTIZED")).toBeInTheDocument();
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
  });

  it("renders the summary sections and comparison table", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Full Summary" }));

    expect(screen.getByText("Loan Structure")).toBeInTheDocument();
    expect(screen.getByText("Total Cost Breakdown")).toBeInTheDocument();
    expect(screen.getByText(/No Cost EMI vs Regular EMI/i)).toBeInTheDocument();
  });
});
