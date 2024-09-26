import { parseSSML, debugParseSSML } from "../../implementations/parser";
import { SSMLDAG } from "../../implementations/ssml-dag";

describe("SSML Parser", () => {
  describe("parseSSML", () => {
    it("should parse a simple SSML string", () => {
      const input = "<speak>Hello, world!</speak>";
      const result = parseSSML(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const dag = result.value;
        expect(dag).toBeInstanceOf(SSMLDAG);
        expect(dag.nodes.size).toBe(4); // root, <speak>, text, </speak>

        const rootNode = Array.from(dag.nodes.values()).find(
          (node) => node.type === "root"
        );
        expect(rootNode).toBeDefined();
        expect(rootNode!.children.size).toBe(1);

        const speakNode = dag.nodes.get(Array.from(rootNode!.children)[0]);
        expect(speakNode).toBeDefined();
        expect(speakNode!.type).toBe("element");
        expect(speakNode!.value).toBe("<speak>");
        expect(speakNode!.children.size).toBe(2); // text and closing tag

        const textNode = Array.from(dag.nodes.values()).find(
          (node) => node.type === "text"
        );
        expect(textNode).toBeDefined();
        expect(textNode!.value).toBe("Hello, world!");

        const closeTagNode = Array.from(dag.nodes.values()).find(
          (node) => node.value === "</speak>"
        );
        expect(closeTagNode).toBeDefined();
        expect(closeTagNode!.type).toBe("element");
      }
    });
  });
});
