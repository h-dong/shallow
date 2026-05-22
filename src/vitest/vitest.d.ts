import "vitest";
import type { PropsRecord, ShallowRenderType } from "../types";

declare module "vitest" {
  interface Assertion<T = any> {
    toBeRendered(): void;
    toRenderText(expected: string | RegExp): void;
    toHaveText(expected: string | RegExp): void;
    toHaveName(expected: string): void;
    toHaveTestId(expected: string): void;
    toHaveId(expected: string): void;
    toHaveLabel(expected: string): void;
    toHaveRole(expected: string): void;
    toHaveClass(expected: string): void;
    toBeElement(expected: ShallowRenderType): void;
    toBeEnabled(): void;
    toBeDisabled(): void;
    toBeChecked(): void;
    toBeUnchecked(): void;
    toHaveValue(expected: string | number | readonly string[] | null): void;
    toHaveProps(expectedProps: PropsRecord): void;
    toHaveProps(propName: string, value: unknown): void;
    toRender(type: ShallowRenderType, expectedProps?: PropsRecord): void;
    toRenderLabelText(type: ShallowRenderType, expected: string): void;
  }

  interface AsymmetricMatchersContaining {
    toBeRendered(): void;
    toRenderText(expected: string | RegExp): void;
    toHaveText(expected: string | RegExp): void;
    toHaveName(expected: string): void;
    toHaveTestId(expected: string): void;
    toHaveId(expected: string): void;
    toHaveLabel(expected: string): void;
    toHaveRole(expected: string): void;
    toHaveClass(expected: string): void;
    toBeElement(expected: ShallowRenderType): void;
    toBeEnabled(): void;
    toBeDisabled(): void;
    toBeChecked(): void;
    toBeUnchecked(): void;
    toHaveValue(expected: string | number | readonly string[] | null): void;
    toHaveProps(expectedProps: PropsRecord): void;
    toHaveProps(propName: string, value: unknown): void;
    toRender(type: ShallowRenderType, expectedProps?: PropsRecord): void;
    toRenderLabelText(type: ShallowRenderType, expected: string): void;
  }
}

export declare const registerMatchers: () => void;
