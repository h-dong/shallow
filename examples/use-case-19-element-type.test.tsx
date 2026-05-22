import { shallow } from "../src";
import { NativeSubmit, PrimaryButton, SubmitPanel } from "./use-case-19-element-type";

describe("NativeSubmit", () => {
  test("toBeElement matches the host tag when the root renders a native element", () => {
    const output = shallow(NativeSubmit).render({ label: "Save" });

    expect(output).toBeElement("button");
    expect(output).toHaveClass("native-submit");
    expect(output).toHaveText("Save");
  });
});

describe("PrimaryButton", () => {
  test("toBeElement matches the host tag when the root renders a native element", () => {
    const output = shallow(PrimaryButton).render({ label: "Continue" });

    expect(output).toBeElement("button");
    expect(output).toHaveClass("primary-button");
  });
});

describe("SubmitPanel", () => {
  test("toBeElement matches a native child component type", () => {
    const output = shallow(SubmitPanel).render({ label: "Save", usePrimary: false });

    expect(output).toBeElement(NativeSubmit);
    expect(output.find(NativeSubmit)).toHaveLabel("Save");
  });

  test("toBeElement matches a custom child component type", () => {
    const output = shallow(SubmitPanel).render({ label: "Continue", usePrimary: true });

    expect(output).toBeElement(PrimaryButton);
    expect(output.find(PrimaryButton)).toHaveLabel("Continue");
  });

  test("find and toBeElement use the same component matching", () => {
    const onClick = vi.fn();
    const output = shallow(SubmitPanel).render({
      label: "Continue",
      usePrimary: true,
      onClick,
    });

    expect(output).toBeElement(PrimaryButton);
    output.find(PrimaryButton).trigger("onClick");

    expect(onClick).toHaveBeenCalledOnce();
  });
});
