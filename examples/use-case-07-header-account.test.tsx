import { shallow } from "../src";
import { vi } from "vitest";
import { useCurrentUser } from "./use-case-07-current-user";
import { HeaderAccount, Spinner, UserMenu } from "./use-case-07-header-account";

vi.mock("./use-case-07-current-user");

describe("HeaderAccount", () => {
  const { render, mock } = shallow(HeaderAccount);

  test("render loading state", () => {
    mock(useCurrentUser).returnFull(null);

    const output = render();

    expect(output).toRender(Spinner, {
      label: "Loading account",
    });
    expect(output).not.toRender(UserMenu);
  });

  test("render user menu", () => {
    mock(useCurrentUser).returnFull({
      name: "Ada",
      role: "admin",
    });

    const output = render();

    expect(output).not.toRender(Spinner);
    expect(output).toRender(UserMenu, {
      name: "Ada",
      role: "admin",
    });
  });
});
