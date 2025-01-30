import { parseSSML } from "../../parser";
import { SSMLDAG } from "../../dag";

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

    it("should parse a SSML string with a break tag", () => {
      const input =
        "<speak>Hello, world!<break time='500ms'/>How are you?</speak>";
      const result = parseSSML(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const dag = result.value;
        expect(dag).toBeInstanceOf(SSMLDAG);
        expect(dag.nodes.size).toBe(7); // root, <speak>, text, <break>, break attribute 'time', text, </speak>

        const rootNode = Array.from(dag.nodes.values()).find(
          (node) => node.type === "root"
        );
        expect(rootNode).toBeDefined();
        expect(rootNode!.children.size).toBe(1);

        const speakNode = dag.nodes.get(Array.from(rootNode!.children)[0]);
        expect(speakNode).toBeDefined();
        expect(speakNode!.type).toBe("element");
        expect(speakNode!.value).toBe("<speak>");
        expect(speakNode!.children.size).toBe(4); // text, <break>, text, </speak>

        const textNode = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "text"
        )[0];
        expect(textNode).toBeDefined();
        expect(textNode!.value).toBe("Hello, world!");

        const breakNode = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "element"
        )[1];
        expect(breakNode).toBeDefined();
        expect(breakNode!.type).toBe("element");
        expect(breakNode!.value).toBe("<break time='500ms'/>");

        const textNode2 = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "text"
        )[1];
        expect(textNode2).toBeDefined();
        expect(textNode2!.value).toBe("How are you?");

        const closeTagNode = Array.from(dag.nodes.values()).find(
          (node) => node.value === "</speak>"
        );
        expect(closeTagNode).toBeDefined();
        expect(closeTagNode!.type).toBe("element");
        expect(closeTagNode!.value).toBe("</speak>");
      }
    });

    it("should parse a SSML string with a prosody tag", () => {
      const input =
        "<speak>Hello, world!<prosody pitch='high'>How are you?</prosody></speak>";
      const result = parseSSML(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const dag = result.value;
        expect(dag).toBeInstanceOf(SSMLDAG);
        expect(dag.nodes.size).toBe(8); // root, <speak>, text, <prosody>, prosody attribute 'pitch',  text, </prosody>, </speak>

        const rootNode = Array.from(dag.nodes.values()).find(
          (node) => node.type === "root"
        );
        expect(rootNode).toBeDefined();
        expect(rootNode!.children.size).toBe(1);

        const speakNode = dag.nodes.get(Array.from(rootNode!.children)[0]);
        expect(speakNode).toBeDefined();
        expect(speakNode!.type).toBe("element");
        expect(speakNode!.value).toBe("<speak>");
        expect(speakNode!.children.size).toBe(3); // text, <prosody pitch='high'>, </speak>

        const textNode = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "text"
        )[0];
        expect(textNode).toBeDefined();
        expect(textNode!.value).toBe("Hello, world!");

        const prosodyNode = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "element"
        )[1];
        expect(prosodyNode).toBeDefined();
        expect(prosodyNode!.type).toBe("element");
        expect(prosodyNode!.value).toBe("<prosody pitch='high'>");
        expect(prosodyNode!.children.size).toBe(3); // pitch='high', text, </prosody>

        const textNode2 = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "text"
        )[1];
        expect(textNode2).toBeDefined();
        expect(textNode2!.value).toBe("How are you?");

        const closeTagNode = Array.from(dag.nodes.values()).filter(
          (node) => node.value === "</prosody>"
        )[0];
        expect(closeTagNode).toBeDefined();
        expect(closeTagNode!.type).toBe("element");
        expect(closeTagNode!.value).toBe("</prosody>");
      }
    });
    it("should parse a SSML string with a break tag and a prosody tag", () => {
      const input = "<say-as>Hello, world!</say-as>";
      const result = parseSSML(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const dag = result.value;
        expect(dag).toBeInstanceOf(SSMLDAG);
        expect(dag.nodes.size).toBe(4); // root, <say-as>, text, </say-as>

        const rootNode = Array.from(dag.nodes.values()).find(
          (node) => node.type === "root"
        );
        expect(rootNode).toBeDefined();
        expect(rootNode!.children.size).toBe(1);

        const sayAsNode = dag.nodes.get(Array.from(rootNode!.children)[0]);
        expect(sayAsNode).toBeDefined();
        expect(sayAsNode!.type).toBe("element");
        expect(sayAsNode!.value).toBe("<say-as>");
        expect(sayAsNode!.children.size).toBe(2); // text, </say-as>

        const textNode = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "text"
        )[0];
        expect(textNode).toBeDefined();
        expect(textNode!.value).toBe("Hello, world!");

        const closeTagNode = Array.from(dag.nodes.values()).find(
          (node) => node.value === "</say-as>"
        );
        expect(closeTagNode).toBeDefined();
        expect(closeTagNode!.type).toBe("element");
        expect(closeTagNode!.value).toBe("</say-as>");
      }
    });

    it("should parse a SSML string with say-as tag", () => {
      const input = "<say-as>Hello, world!</say-as>";
      const result = parseSSML(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const dag = result.value;
        expect(dag).toBeInstanceOf(SSMLDAG);
        expect(dag.nodes.size).toBe(4); // root, <say-as>, text, </say-as>

        const rootNode = Array.from(dag.nodes.values()).find(
          (node) => node.type === "root"
        );
        expect(rootNode).toBeDefined();
        expect(rootNode!.children.size).toBe(1);

        const sayAsNode = dag.nodes.get(Array.from(rootNode!.children)[0]);
        expect(sayAsNode).toBeDefined();
        expect(sayAsNode!.type).toBe("element");
        expect(sayAsNode!.value).toBe("<say-as>");
        expect(sayAsNode!.children.size).toBe(2); // text, </say-as>

        const textNode = Array.from(dag.nodes.values()).filter(
          (node) => node.type === "text"
        )[0];
        expect(textNode).toBeDefined();
        expect(textNode!.value).toBe("Hello, world!");

        const closeTagNode = Array.from(dag.nodes.values()).find(
          (node) => node.value === "</say-as>"
        );
        expect(closeTagNode).toBeDefined();
        expect(closeTagNode!.type).toBe("element");
        expect(closeTagNode!.value).toBe("</say-as>");
      }
    });
  });
});
