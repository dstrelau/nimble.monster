import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
