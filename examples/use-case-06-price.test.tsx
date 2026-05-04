import { shallow } from "../src";
import { formatCurrency, Price } from "./use-case-06-price";

describe("Price", () => {
  const { render, mock } = shallow(Price, {
    defaultProps: {
      amount: 12,
      currency: "USD",
    },
  });

  test("render formatted price", () => {
    mock(formatCurrency).returnFull("$12.00");

    const output = render();

    expect(output).toRenderText("$12.00");
  });
});
