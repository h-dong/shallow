import { shallow, shallowHook } from "./index";

describe("package exports", () => {
  test("exports shallow and shallowHook", () => {
    expect(shallow).toBeTypeOf("function");
    expect(shallowHook).toBeTypeOf("function");
  });
});
