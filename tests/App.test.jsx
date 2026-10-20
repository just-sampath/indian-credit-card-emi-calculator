import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App.jsx";

describe("App", () => {
  it("renders the heading, inputs, results and default tab", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Credit Card EMI Calculator",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Amortization Schedule" })
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Product MRP (₹)")).toBeInTheDocument();
    expect(screen.getByText("You pay per month")).toBeInTheDocument();
    expect(screen.getByText("Extra over MRP")).toBeInTheDocument();
    expect(screen.getByText("Effective annual cost")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit inputs" })
    ).toBeInTheDocument();
  });

  it("does not show the removed trust badge or live-summary duplicates", () => {
    render(<App />);

    expect(screen.queryByText("RBI Compliant")).not.toBeInTheDocument();
    expect(screen.queryByText("Live Summary")).not.toBeInTheDocument();
    expect(screen.queryByText("PRINCIPAL AMORTIZED")).not.toBeInTheDocument();
  });

  it("opens the inputs drawer without focusing a text field", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Edit inputs" }));

    const dialog = screen.getByRole("dialog", { name: "Calculator inputs" });
    expect(screen.getByLabelText("Product MRP (₹)")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(dialog);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.queryByRole("dialog", { name: "Calculator inputs" })
    ).not.toBeInTheDocument();
  });

  it("switches from the schedule tab to the pre-closure tab", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    expect(
      screen.getByRole("tab", { name: "Pre-closure Simulator" })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", { name: "Pre-closure Simulator" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Total cost if you close after month 3/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Extra interest (months)")
    ).toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys", () => {
    render(<App />);

    const schedule = screen.getByRole("tab", { name: "Amortization Schedule" });
    schedule.focus();
    fireEvent.keyDown(schedule, { key: "ArrowRight" });

    const preclosure = screen.getByRole("tab", {
      name: "Pre-closure Simulator",
    });
    expect(preclosure).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(preclosure);

    fireEvent.keyDown(preclosure, { key: "End" });
    expect(screen.getByRole("tab", { name: "Full Summary" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: "Full Summary" }), {
      key: "ArrowRight",
    });
    expect(schedule).toHaveAttribute("aria-selected", "true");
  });

  it("renders the summary sections and comparison", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Full Summary" }));

    expect(screen.getByText("Cost breakdown")).toBeInTheDocument();
    expect(screen.getByText("Loan details")).toBeInTheDocument();
    expect(screen.getByText("No Cost EMI vs Regular EMI")).toBeInTheDocument();
    expect(screen.getByText("How this is calculated")).toBeInTheDocument();
  });
});
