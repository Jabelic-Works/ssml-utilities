import { ValidationOptions } from "@ssml-utilities/core";

export interface ExtractOptions {
  /** 改行を保持するかどうか（デフォルト: true） */
  preserveNewlines?: boolean;
  /** 複数の空白を単一スペースに変換するかどうか（デフォルト: true） */
  normalizeSpaces?: boolean;
  /** 先頭と末尾の空白を削除するかどうか（デフォルト: true） */
  trim?: boolean;
  /** SSMLタグ検証オプション（デフォルト: STRICT） */
  validationOptions?: ValidationOptions;
  /** カスタムSSMLタグの配列 */
  customSSMLTags?: string[];
}

export interface ExtractResult {
  /** 抽出されたプレーンテキスト */
  text: string;
  /** 保持された非SSMLタグの配列 */
  preservedElements: string[];
  /** 削除されたSSMLタグの配列 */
  removedTags: string[];
  /** 処理されたノード数 */
  processedNodes: number;
  /** パース結果が成功したかどうか */
  parseSuccess: boolean;
}
