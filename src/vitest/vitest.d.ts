import "vitest";
import type { PropsRecord, ShallowRenderType } from "../types";

declare module "vitest" {
  interface Matchers<R, T> {
    toBeRendered: () => R;
    toRenderText: (expected: string | RegExp) => R;
    toHaveText: (expected: string | RegExp) => R;
    toHaveName: (expected: string) => R;
    toHaveTestId: (expected: string) => R;
    toHaveId: (expected: string) => R;
    toHaveLabel: (expected: string) => R;
    toHaveRole: (expected: string) => R;
    toHaveClass: (expected: string) => R;
    toBeElement: (expected: ShallowRenderType) => R;
    toBeEnabled: () => R;
    toBeDisabled: () => R;
    toBeChecked: () => R;
    toBeUnchecked: () => R;
    toHaveValue: (expected: string | number | readonly string[] | null) => R;
    toHaveProps: ((expectedProps: PropsRecord) => R) & ((propName: string, value: unknown) => R);
    toRender: (type: ShallowRenderType, expectedProps?: PropsRecord) => R;
    toRenderLabelText: (type: ShallowRenderType, expected: string) => R;
  }
}

export declare const registerMatchers: () => void;
