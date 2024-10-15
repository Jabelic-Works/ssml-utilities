// escapeHtml.test.ts
import { describe, it, expect } from "vitest";
import { escapeHtml } from "./utils";

describe("escapeHtml", () => {
  it("should escape ampersands", () => {
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml("This & That")).toBe("This &amp; That");
  });

  it("should escape less than signs", () => {
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  it("should escape greater than signs", () => {
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml('Say "Hello"')).toBe("Say &quot;Hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("'")).toBe("&#039;");
    expect(escapeHtml("It's a nice day")).toBe("It&#039;s a nice day");
  });

  it("should handle multiple special characters", () => {
    const input = '<div class="test">Hello & Goodbye</div>';
    const expected =
      "&lt;div class=&quot;test&quot;&gt;Hello &amp; Goodbye&lt;/div&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });

  it("should not modify text without special characters", () => {
    const input = "Hello, World!";
    expect(escapeHtml(input)).toBe(input);
  });

  it("should handle empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should handle string with only special characters", () => {
    expect(escapeHtml("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#039;");
  });

  it("should handle repeated special characters", () => {
    expect(escapeHtml("&&<<>>")).toBe("&amp;&amp;&lt;&lt;&gt;&gt;");
  });
});
