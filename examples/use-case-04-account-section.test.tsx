import { vi } from "vitest";
import { shallow } from "../src";
import { useAccountSectionState } from "./use-case-04-account-section-state";
import { AccountSection, DisclosurePanel, Icon } from "./use-case-04-account-section";

vi.mock("./use-case-04-account-section-state");

describe("AccountSection", () => {
  beforeEach(() => {
    mock(useAccountSectionState).returnFull({
      isExpanded: false,
      toggle: vi.fn(),
    });
  });

  const { render, mock } = shallow(AccountSection, {
    defaultProps: {
      title: "Billing",
    },
  });

  test("render title", () => {
    const output = render();

    expect(output).toRender(DisclosurePanel, {
      label: "Billing",
    });
  });

  test("render expanded state", () => {
    mock(useAccountSectionState).return({
      isExpanded: true,
    });

    const output = render();

    expect(output).toRender(Icon, { name: "chevron-up" });
    expect(output).toRender(DisclosurePanel, {
      open: true,
    });
  });

  test("render collapsed state", () => {
    mock(useAccountSectionState).return({
      isExpanded: false,
    });

    const output = render();

    expect(output).toRender(Icon, { name: "chevron-down" });
    expect(output).toRender(DisclosurePanel, {
      open: false,
    });
  });

  test("click on button triggers toggle", () => {
    const toggle = vi.fn();

    mock(useAccountSectionState).return({
      toggle,
    });

    const output = render();

    output.find("button").trigger("onClick");

    expect(toggle).toHaveBeenCalledOnce();
  });

  test("updates child props from the mocked state hook", () => {
    mock(useAccountSectionState).return({
      isExpanded: false,
    });

    const output = render();

    expect(output).toRender(Icon, { name: "chevron-down" });
    expect(output).toRender(DisclosurePanel, {
      open: false,
    });

    mock(useAccountSectionState).return({
      isExpanded: true,
    });

    output.rerender();

    expect(output).toRender(Icon, { name: "chevron-up" });
    expect(output).toRender(DisclosurePanel, {
      open: true,
    });
  });
});
