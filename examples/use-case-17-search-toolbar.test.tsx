import { shallow } from "../src";
import { SearchToolbar } from "./use-case-17-search-toolbar";

describe("SearchToolbar", () => {
  const { render } = shallow(SearchToolbar, {
    defaultProps: {
      query: "shallow",
      onSearch: vi.fn(),
      onClear: vi.fn(),
    },
  });

  test("renders search controls on the outer section", () => {
    const output = render();

    expect(output).toHaveText("Search");
    expect(output).toHaveLabel("Search toolbar");
    expect(output).toHaveClass("search-toolbar");
    expect(output.find("input", { role: "searchbox" }).props().value).toBe("shallow");
  });

  test("chains find calls to reach nested buttons", () => {
    const output = render();

    expect(output.find("section").find("button", { name: "search", text: "Search" })).toHaveClass(
      "search-button",
    );
    expect(output.find("section").find("button", { name: "clear", text: "Clear" })).toHaveClass(
      "clear-button",
    );
  });

  test("findAll returns both action buttons when query is set", () => {
    const output = render();

    expect(output.findAll("button")).toHaveLength(2);
    expect(output.findAll("button", { className: "search-button" })).toHaveLength(1);
  });

  test("optional find when clear button is not rendered", () => {
    const output = render({ query: "" });

    expect(output.find("button", { name: "search" })).toBeDefined();
    expect(output.find({ type: "button", name: "clear", optional: true })).not.toBeRendered();
  });

  test("triggers search from the nested button", () => {
    const onSearch = vi.fn();
    const output = render({ onSearch });

    output.find("section").find("button", { name: "search" }).click();

    expect(onSearch).toHaveBeenCalledWith("shallow");
  });
});
