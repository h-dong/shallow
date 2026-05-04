import { shallow } from "../src";
import { EmptyState, ErrorBanner, Spinner, UserList, UsersPanel } from "./use-case-12-users-panel";

describe("UsersPanel", () => {
  const { render } = shallow(UsersPanel, {
    defaultProps: {
      status: "success",
      users: [],
    },
  });

  test("render loading state", () => {
    const output = render({
      status: "loading",
    });

    expect(output).toRender(Spinner, {
      label: "Loading users",
    });
    expect(output).not.toRender(UserList);
  });

  test("render error state", () => {
    const output = render({
      status: "error",
    });

    expect(output).toRender(ErrorBanner, {
      message: "Could not load users",
    });
    expect(output).not.toRender(UserList);
  });

  test("render empty state", () => {
    const output = render();

    expect(output).not.toRender(Spinner);
    expect(output).toRender(EmptyState, {
      title: "No users",
    });
  });

  test("render user list", () => {
    const users = [{ id: "1", name: "Ada" }];

    const output = render({
      users,
    });

    expect(output).toRender(UserList, {
      users,
    });
  });
});
