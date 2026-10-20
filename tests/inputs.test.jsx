import { act, fireEvent, render, screen, within } from "@testing-library/react";
import App from "../src/App.jsx";

function scheduleRows(container) {
  return container.querySelectorAll(".data-table tbody tr");
}

function tenureField() {
  return screen.getByLabelText("Or enter tenure in months");
}

describe("number fields keep the user's draft", () => {
  it("lets tenure be cleared and retyped without snapping to 1", () => {
    const { container } = render(<App />);
    const field = tenureField();

    fireEvent.change(field, { target: { value: "" } });
    expect(field).toHaveValue("");
    // Results keep the last valid tenure while the field is empty.
    expect(scheduleRows(container)).toHaveLength(6);

    fireEvent.change(field, { target: { value: "2" } });
    fireEvent.change(field, { target: { value: "24" } });
    expect(field).toHaveValue("24");
    expect(scheduleRows(container)).toHaveLength(24);
    expect(screen.getByRole("button", { name: "24 months" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("flags tenure above the maximum and clamps it on blur", () => {
    const { container } = render(<App />);
    const field = tenureField();

    fireEvent.change(field, { target: { value: "124" } });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Maximum is 60 months")).toBeInTheDocument();
    expect(scheduleRows(container)).toHaveLength(6);

    fireEvent.blur(field);
    expect(field).toHaveValue("60");
    expect(field).not.toHaveAttribute("aria-invalid");
    expect(scheduleRows(container)).toHaveLength(60);
  });

  it("flags a zero tenure that more typing cannot fix", () => {
    render(<App />);
    const field = tenureField();

    fireEvent.change(field, { target: { value: "0" } });
    expect(screen.getByText("Minimum is 1 month")).toBeInTheDocument();
  });

  it("restores the last valid MRP when the field is left empty", () => {
    render(<App />);
    const field = screen.getByLabelText("Product MRP (₹)");

    field.focus();
    fireEvent.change(field, { target: { value: "" } });
    expect(field).toHaveValue("");
    fireEvent.blur(field);
    expect(field).toHaveValue("1,07,705");
  });

  it("never accepts a negative or below-minimum MRP", () => {
    render(<App />);
    const field = screen.getByLabelText("Product MRP (₹)");

    field.focus();
    fireEvent.change(field, { target: { value: "-20000" } });
    expect(field).toHaveValue("20000");

    fireEvent.change(field, { target: { value: "500" } });
    fireEvent.blur(field);
    expect(field).toHaveValue("1,000");
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("does not leave a leading zero after clearing and typing", () => {
    render(<App />);
    const field = screen.getByLabelText("Product MRP (₹)");

    field.focus();
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.change(field, { target: { value: "50000" } });
    expect(field).toHaveValue("50000");
  });

  it("shows Indian digit grouping while idle and raw digits while editing", () => {
    render(<App />);
    const field = screen.getByLabelText("Product MRP (₹)");

    expect(field).toHaveValue("1,07,705");
    act(() => field.focus());
    expect(field).toHaveValue("107705");
    fireEvent.blur(field);
    expect(field).toHaveValue("1,07,705");
  });

  it("explains a below-minimum value while typing instead of ignoring it", () => {
    render(<App />);
    const field = screen.getByLabelText("Product MRP (₹)");

    field.focus();
    fireEvent.change(field, { target: { value: "500" } });
    expect(
      screen.getByText(
        "Minimum is ₹1,000. Keep typing, or it will be set to ₹1,000."
      )
    ).toBeInTheDocument();
    expect(field).not.toHaveAttribute("aria-invalid");

    fireEvent.change(field, { target: { value: "5000" } });
    expect(screen.queryByText(/Minimum is ₹1,000/)).not.toBeInTheDocument();
  });

  it("commits and closes the keyboard on Enter", () => {
    render(<App />);
    const field = tenureField();

    field.focus();
    fireEvent.change(field, { target: { value: "99" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(document.activeElement).not.toBe(field);
    expect(field).toHaveValue("60");
    expect(field).toHaveAttribute("enterkeyhint", "done");
  });

  it("keeps sliders on the same range as their number fields", () => {
    render(<App />);

    // MRP uses a log scale; its ends map exactly to the field's limits.
    const mrpSlider = screen.getByLabelText("Product MRP slider");
    expect(mrpSlider).toHaveAttribute("min", "0");
    expect(mrpSlider).toHaveAttribute("max", "1000");
    expect(mrpSlider).toHaveAttribute("aria-valuetext", "₹1,07,705");
    expect(
      screen.getByLabelText("Annual interest rate slider")
    ).toHaveAttribute("max", "50");
    expect(
      screen.getByLabelText("Days to first EMI due date slider")
    ).toHaveAttribute("max", "60");
  });

  it("moves MRP along a log scale from the slider", () => {
    render(<App />);
    const mrpSlider = screen.getByLabelText("Product MRP slider");

    fireEvent.change(mrpSlider, { target: { value: "0" } });
    expect(screen.getByLabelText("Product MRP (₹)")).toHaveValue("1,000");
    fireEvent.change(mrpSlider, { target: { value: "1000" } });
    expect(screen.getByLabelText("Product MRP (₹)")).toHaveValue("10,00,000");
    fireEvent.change(mrpSlider, { target: { value: "500" } });
    // Midpoint of a log scale is the geometric mean (≈ ₹31,623).
    expect(screen.getByLabelText("Product MRP (₹)")).toHaveValue("31,500");
  });

  it("steps a field with the arrow keys", () => {
    render(<App />);
    const field = screen.getByLabelText("Interest rate (% per year)");

    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(field).toHaveValue("17.5");
    fireEvent.keyDown(field, { key: "ArrowDown" });
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(field).toHaveValue("16.5");
  });
});

describe("pre-closure stays consistent with tenure", () => {
  it("clamps the selected month when the tenure shrinks", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Select pre-closure at month 5/i })
    );

    fireEvent.click(screen.getByRole("button", { name: "3 months" }));

    expect(screen.getByLabelText("Close the loan after month")).toHaveValue(
      "2"
    );
    expect(screen.getByText("of 3")).toBeInTheDocument();
    expect(
      screen.getByText(/Total cost if you close after month 2/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Select pre-closure at month 2/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/Save ₹0\.00/)).not.toBeInTheDocument();
  });

  it("explains instead of simulating when tenure is a single month", () => {
    render(<App />);
    fireEvent.change(tenureField(), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    expect(screen.getByText(/nothing\s+to pre-close/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Pre-closure month slider")
    ).not.toBeInTheDocument();
  });

  it("hides the clawback field for Regular EMI", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Regular EMI" }));
    fireEvent.click(screen.getByRole("tab", { name: "Pre-closure Simulator" }));

    expect(
      screen.queryByLabelText("Merchant clawback (₹)")
    ).not.toBeInTheDocument();
  });
});

describe("summary comparison", () => {
  it("treats a bigger discount as good for the buyer", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Full Summary" }));

    const table = container.querySelector(".data-table");
    const discountRow = within(table)
      .getByRole("rowheader", { name: "Merchant discount" })
      .closest("tr");
    const verdict = discountRow.lastElementChild;

    expect(verdict).toHaveTextContent("₹5,144.88 higher");
    expect(verdict.className).toMatch(/text-green/);
  });

  it("drops rows that never differ or repeat another row", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Full Summary" }));

    const table = container.querySelector(".data-table");
    expect(
      within(table).queryByRole("rowheader", { name: /GST on processing fee/i })
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("rowheader", { name: /Total outflow/i })
    ).not.toBeInTheDocument();
    expect(
      within(table).getByRole("rowheader", { name: "Effective annual cost" })
    ).toBeInTheDocument();
  });
});
