import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  window.requestAnimationFrame =
    window.requestAnimationFrame ??
    ((callback: FrameRequestCallback): number => {
      callback(0);
      return 0;
    });

  window.cancelAnimationFrame =
    window.cancelAnimationFrame ??
    ((_handle: number): void => {
      // noop
    });
}
