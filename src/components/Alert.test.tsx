import { render, screen } from "@testing-library/react";
import Alert from "./Alert";

describe("Alert", () => {
  it("renders the message and alert type class", () => {
    render(<Alert type="alert-success" message="Saved successfully" />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("alert");
    expect(alert).toHaveClass("alert-success");
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();
  });
});
