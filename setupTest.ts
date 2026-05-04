import React from "react";
import { registerMatchers } from "./src/vitest";

const testGlobal = globalThis as typeof globalThis & { React: typeof React };

testGlobal.React = React;

registerMatchers();
