import { shallow } from "../src";
import { ThemeLabel, ThemeProvider, ThemeSummary } from "./use-case-10-theme-summary";

describe("ThemeSummary", () => {
  const { render } = shallow(ThemeSummary, {
    wrapper: ({ children }) => (
      <ThemeProvider value={{ name: "dark", contrast: "high" }}>{children}</ThemeProvider>
    ),
  });

  test("render theme label", () => {
    const output = render();

    expect(output).toRender(ThemeLabel, {
      name: "dark",
      contrast: "high",
    });
  });
});
