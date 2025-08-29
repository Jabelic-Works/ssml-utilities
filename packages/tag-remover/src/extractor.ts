import {
  parseSSML,
  SSMLDAG,
  DAGNode,
  STANDARD_SSML_TAGS,
  isValidTagName,
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
} from "@ssml-utilities/core";
import {
  XML_COMMENT_PATTERN,
  CDATA_SECTION_PATTERN,
  PROCESSING_INSTRUCTION_PATTERN,
} from "./constants";
import { ExtractOptions, ExtractResult } from "./interface";

export const DEFAULT_EXTRACT_OPTIONS: ExtractOptions = {
  preserveNewlines: true,
  normalizeSpaces: true,
  trim: true,
  validationOptions: DEFAULT_VALIDATION_OPTIONS,
  customSSMLTags: [],
};

/**
 * SSMLテキスト抽出器
 * DAGベースの正確なパースと詳細な結果情報を提供
 */
export class SSMLTextExtractor {
  private ssmlTags: Set<string>;
  private options: ExtractOptions;

  constructor(options: Partial<ExtractOptions> = {}) {
    this.options = { ...DEFAULT_EXTRACT_OPTIONS, ...options };

    // SSMLタグセットを構築
    this.ssmlTags = new Set([
      ...STANDARD_SSML_TAGS,
      ...(this.options.customSSMLTags || []),
    ]);
  }

  /**
   * SSMLからテキストのみを抽出し、非SSMLタグは保持
   */
  extract(ssml: string, options: Partial<ExtractOptions> = {}): ExtractResult {
    const opts = { ...this.options, ...options };

    // 初期結果オブジェクト
    const result: ExtractResult = {
      text: "",
      preservedElements: [],
      removedTags: [],
      processedNodes: 0,
      parseSuccess: false,
    };

    if (!ssml || typeof ssml !== "string") {
      return result;
    }

    // XMLコメントと処理命令を事前処理
    let preprocessed = ssml
      .replace(XML_COMMENT_PATTERN, "")
      .replace(CDATA_SECTION_PATTERN, "$1")
      .replace(PROCESSING_INSTRUCTION_PATTERN, "");

    // SSMLをパース
    const parseResult = parseSSML(preprocessed);

    if (!parseResult.ok) {
      // パースに失敗した場合は従来の正規表現ベースにフォールバック
      return this.fallbackExtract(ssml, opts);
    }

    result.parseSuccess = true;
    const dag = parseResult.value;

    // DAGからテキストを抽出
    this.processDAG(dag, result, opts);

    // 後処理
    this.postProcess(result, opts);

    return result;
  }

  /**
   * DAGを処理してテキストを抽出
   */
  private processDAG(
    dag: SSMLDAG,
    result: ExtractResult,
    opts: ExtractOptions
  ): void {
    const visitedNodes = new Set<string>();
    const preservedElementStack: Array<{ tag: string; content: string }> = [];

    // ルートノードを見つける
    const rootNodes = Array.from(dag.nodes.values()).filter(
      (node) => node.type === "root" || node.parents.size === 0
    );

    if (rootNodes.length === 0) {
      // ルートノードが見つからない場合は全ノードを処理
      for (const [nodeId] of dag.nodes) {
        this.processNode(
          nodeId,
          dag,
          result,
          opts,
          visitedNodes,
          preservedElementStack
        );
      }
    } else {
      // ルートノードから開始
      for (const rootNode of rootNodes) {
        this.processNode(
          rootNode.id,
          dag,
          result,
          opts,
          visitedNodes,
          preservedElementStack
        );
      }
    }
  }

  /**
   * 個別のノードを処理
   */
  private processNode(
    nodeId: string,
    dag: SSMLDAG,
    result: ExtractResult,
    opts: ExtractOptions,
    visitedNodes: Set<string>,
    preservedElementStack: Array<{ tag: string; content: string }>
  ): void {
    if (visitedNodes.has(nodeId)) {
      return;
    }

    visitedNodes.add(nodeId);
    result.processedNodes++;

    const node = dag.nodes.get(nodeId);
    if (!node) {
      return;
    }

    switch (node.type) {
      case "text":
        // テキストノードを処理（HTMLタグっぽいテキストをチェック）
        if (node.value) {
          const textValue = node.value;

          if (textValue.startsWith("<") && textValue.endsWith(">")) {
            const tagName = this.extractTagName(textValue);
            if (tagName && this.isSSMLTag(tagName, opts.validationOptions)) {
              // remove ssml tag.
              if (!result.removedTags.includes(tagName)) {
                result.removedTags.push(tagName);
              }
              // ssml tag is not returned.
            } else {
              // non-ssml tag is returned.
              if (!result.preservedElements.includes(textValue)) {
                result.preservedElements.push(textValue);
              }
              result.text += textValue;
            }
          } else {
            // 通常のテキスト
            result.text += textValue;
          }
        }
        break;

      case "element":
        this.processElementNode(
          node,
          dag,
          result,
          opts,
          visitedNodes,
          preservedElementStack
        );
        break;

      case "root":
        // ルートノードの子ノードを処理
        this.processChildren(
          node,
          dag,
          result,
          opts,
          visitedNodes,
          preservedElementStack
        );
        break;

      case "attribute":
        // 属性ノードは通常単独では処理しない
        break;
    }
  }

  /**
   * 要素ノードを処理
   */
  private processElementNode(
    node: DAGNode,
    dag: SSMLDAG,
    result: ExtractResult,
    opts: ExtractOptions,
    visitedNodes: Set<string>,
    preservedElementStack: Array<{ tag: string; content: string }>
  ): void {
    const elementValue = node.value || "";
    const tagName = this.extractTagName(elementValue);

    if (!tagName) {
      // タグ名が抽出できない場合はそのまま出力
      result.text += elementValue;
      return;
    }

    const isValidSSML = this.isSSMLTag(tagName, opts.validationOptions);

    if (isValidSSML) {
      // 有効なSSMLタグの場合：タグは除去、内容のみ抽出
      if (!result.removedTags.includes(tagName)) {
        result.removedTags.push(tagName);
      }

      // 子ノードを処理（テキストのみ抽出）
      this.processChildren(
        node,
        dag,
        result,
        opts,
        visitedNodes,
        preservedElementStack
      );
    } else {
      // 非SSMLタグの場合：タグをそのまま保持
      if (elementValue && !result.preservedElements.includes(elementValue)) {
        result.preservedElements.push(elementValue);
      }
      result.text += elementValue;

      // 子ノードも処理（非SSMLタグの場合も内容を処理）
      this.processChildren(
        node,
        dag,
        result,
        opts,
        visitedNodes,
        preservedElementStack
      );
    }
  }

  private processChildren(
    node: DAGNode,
    dag: SSMLDAG,
    result: ExtractResult,
    opts: ExtractOptions,
    visitedNodes: Set<string>,
    preservedElementStack: Array<{ tag: string; content: string }>
  ): void {
    // 子ノードを順序通りに処理
    const childIds = Array.from(node.children);
    for (const childId of childIds) {
      this.processNode(
        childId,
        dag,
        result,
        opts,
        visitedNodes,
        preservedElementStack
      );
    }
  }

  /**
   * 非SSMLタグの完全な要素を再構築
   */
  private reconstructElement(
    node: DAGNode,
    dag: SSMLDAG,
    visitedNodes: Set<string>
  ): string {
    let content = node.value || "";

    // 子ノードの内容を収集
    const childContents: string[] = [];
    for (const childId of node.children) {
      if (!visitedNodes.has(childId)) {
        const childNode = dag.nodes.get(childId);
        if (childNode) {
          if (childNode.type === "text") {
            childContents.push(childNode.value || "");
          } else if (childNode.type === "element") {
            if (childNode.value?.startsWith("</")) {
              // 終了タグ
              content += childContents.join("") + childNode.value;
              return content;
            } else {
              // ネストした要素
              childContents.push(
                this.reconstructElement(childNode, dag, visitedNodes)
              );
            }
          }
        }
      }
    }

    return content + childContents.join("");
  }

  /**
   * タグ名を抽出
   */
  private extractTagName(elementValue: string): string {
    const match = elementValue.match(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)/);
    return match ? match[1].toLowerCase() : "";
  }

  /**
   * 指定したタグ名がSSMLタグかどうかを判定
   */
  private isSSMLTag(
    tagName: string,
    validationOptions?: ValidationOptions
  ): boolean {
    if (this.ssmlTags.has(tagName)) {
      return true;
    }

    if (validationOptions?.allowMode !== "STRICT") {
      return isValidTagName(tagName, validationOptions);
    }

    return false;
  }

  /**
   * 結果の後処理
   */
  private postProcess(result: ExtractResult, opts: ExtractOptions): void {
    // 改行の処理
    if (!opts.preserveNewlines) {
      result.text = result.text.replace(/\r?\n/g, " ");
    }

    // 複数の空白を正規化
    if (opts.normalizeSpaces) {
      if (opts.preserveNewlines) {
        // 改行文字を保護しながら他の空白を正規化
        result.text = result.text.replace(/[ \t\f\v]+/g, " ");
      } else {
        result.text = result.text.replace(/\s+/g, " ");
      }
    }

    // 先頭と末尾の空白を削除
    if (opts.trim) {
      result.text = result.text.trim();
    }
  }

  /**
   * DAGパースに失敗した場合の正規表現ベースフォールバック
   */
  private fallbackExtract(ssml: string, opts: ExtractOptions): ExtractResult {
    const result: ExtractResult = {
      text: "",
      preservedElements: [],
      removedTags: [],
      processedNodes: 0,
      parseSuccess: false,
    };

    // 従来の正規表現ベースの処理
    let text = ssml
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<\?[\s\S]*?\?>/g, "");

    // 有効なSSMLタグのみを削除
    text = text.replace(/<[^>]*>/g, (match) => {
      const tagName = this.extractTagName(match);
      if (tagName && this.isSSMLTag(tagName, opts.validationOptions)) {
        if (!result.removedTags.includes(tagName)) {
          result.removedTags.push(tagName);
        }
        return "";
      } else {
        result.preservedElements.push(match);
        return match;
      }
    });

    result.text = text;
    this.postProcess(result, opts);

    return result;
  }

  /**
   * カスタムSSMLタグの動的更新
   */
  updateSSMLTags(newTags: string[]): void {
    this.ssmlTags = new Set([
      ...STANDARD_SSML_TAGS,
      ...(this.options.customSSMLTags || []),
      ...newTags,
    ]);
  }

  /**
   * 現在のSSMLタグ一覧を取得
   */
  getSSMLTags(): string[] {
    return Array.from(this.ssmlTags);
  }

  /**
   * デバッグ情報を出力
   */
  debugParse(ssml: string): string {
    const parseResult = parseSSML(ssml);
    if (parseResult.ok) {
      return parseResult.value.debugPrint();
    } else {
      return `Parse Error: ${parseResult.error}`;
    }
  }
}

/**
 * ファクトリー関数
 */
export function createSSMLExtractor(
  customTags?: string[],
  options?: Partial<ExtractOptions>
): SSMLTextExtractor {
  return new SSMLTextExtractor({
    ...options,
    customSSMLTags: customTags,
  });
}

/**
 * 便利関数：高機能版でのSSMLタグ削除
 */
export function extractTextAdvanced(
  ssml: string,
  options: Partial<ExtractOptions> = {}
): ExtractResult {
  const extractor = new SSMLTextExtractor(options);
  return extractor.extract(ssml, options);
}
