// src/interfaces/ssml-tags.ts

export interface Speech {
  say(text: string): string;
  pause(time: string): string;
  audio(src: string): string;
  emphasis(level: "strong" | "moderate" | "reduced", text: string): string;
  prosody(options: ProsodyOptions, text: string): string;
  sayAs(interpretAs: string, text: string): string;
  // 他のSSMLタグに対応するメソッドを追加
}

export interface ProsodyOptions {
  rate?: string;
  pitch?: string;
  volume?: string;
}
