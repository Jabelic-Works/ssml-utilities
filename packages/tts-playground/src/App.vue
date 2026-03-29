<script setup lang="ts">
import {
  emitAzureSSML,
  type AccentIR,
  type AccentIREmitWarning,
} from "@ssml-utilities/accent-ir";
import { ref } from "vue";

const DEFAULT_VOICE = "ja-JP-NanamiNeural";
const DEFAULT_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

const SESSION_KEYS = {
  subscriptionKey: "azure-subscription-key",
  region: "azure-region",
  voice: "azure-voice",
  outputFormat: "azure-output-format",
} as const;

type SynthesisStatus = "idle" | "submitting" | "success" | "error";
type PlaygroundMode = "sample" | "free-text";

interface UniDicRawTokenDebug {
  surface: string;
  reading?: string;
  pronunciation?: string;
  partOfSpeech?: Record<string, string>;
  accent?: Record<string, string>;
}

interface AnalyzeSuccessResponse {
  text: string;
  locale: string;
  accentIR: AccentIR;
  azureSSML: string;
  warnings: AccentIREmitWarning[];
  debug?: {
    rawTokens?: UniDicRawTokenDebug[];
  };
}

interface AccentIRSample {
  id: string;
  label: string;
  accentIR: AccentIR;
}

const SAMPLE_CASES: readonly AccentIRSample[] = [
  {
    id: "hashi-chopsticks",
    label: "箸 (1型)",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "箸",
          reading: "はし",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シ",
            },
          },
        },
      ],
    },
  },
  {
    id: "hashi-bridge",
    label: "橋 (2型)",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "橋",
          reading: "はし",
          accent: { downstep: 2 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ'",
            },
          },
        },
      ],
    },
  },
  {
    id: "hashi-edge",
    label: "端 (平板)",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "端",
          reading: "はし",
          accent: { downstep: null },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ+",
            },
          },
        },
      ],
    },
  },
  {
    id: "hashi-wo-motsu",
    label: "箸を持つ",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "箸を",
          reading: "はしを",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シオ",
            },
          },
        },
        {
          type: "text",
          text: "持つ",
          reading: "もつ",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "モ'ツ",
            },
          },
        },
      ],
    },
  },
] as const;

const readSessionValue = (key: string, fallback = ""): string => {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.sessionStorage.getItem(key) ?? fallback;
};

const writeSessionValue = (key: string, value: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.sessionStorage.setItem(key, value);
    return;
  }

  window.sessionStorage.removeItem(key);
};

const buildSampleSSML = (
  sampleId: string,
  voice: string
): { ssml: string; warnings: AccentIREmitWarning[] } => {
  const sample =
    SAMPLE_CASES.find((candidate) => candidate.id === sampleId) ?? SAMPLE_CASES[0];

  const result = emitAzureSSML(sample.accentIR, {
    voice: voice || DEFAULT_VOICE,
  });

  return {
    ssml: result.ssml,
    warnings: result.warnings,
  };
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: string; details?: string };
    return payload.details
      ? `${payload.error}: ${payload.details}`
      : payload.error ?? response.statusText;
  }

  const text = await response.text();
  return text || response.statusText;
};

const subscriptionKey = ref(readSessionValue(SESSION_KEYS.subscriptionKey));
const region = ref(readSessionValue(SESSION_KEYS.region));
const voice = ref(readSessionValue(SESSION_KEYS.voice, DEFAULT_VOICE));
const outputFormat = ref(
  readSessionValue(SESSION_KEYS.outputFormat, DEFAULT_OUTPUT_FORMAT)
);
const selectedSampleId = ref(SAMPLE_CASES[0].id);
const initialSample = buildSampleSSML(
  SAMPLE_CASES[0].id,
  voice.value || DEFAULT_VOICE
);
const ssml = ref(initialSample.ssml);
const generationWarnings = ref<AccentIREmitWarning[]>(initialSample.warnings);
const status = ref<SynthesisStatus>("idle");
const statusText = ref("");
const audioUrl = ref<string | null>(null);
const mode = ref<PlaygroundMode>("sample");
const freeText = ref("");
const latestAccentIR = ref<AccentIR | null>(null);
const latestRawTokens = ref<UniDicRawTokenDebug[] | null>(null);

const replaceAudioUrl = (nextAudioUrl: string | null) => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }

  audioUrl.value = nextAudioUrl;
};

const resetAnalyzeOutputs = () => {
  latestAccentIR.value = null;
  latestRawTokens.value = null;
};

const handleSubscriptionKeyInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  subscriptionKey.value = value;
  writeSessionValue(SESSION_KEYS.subscriptionKey, value);
};

const handleRegionInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  region.value = value;
  writeSessionValue(SESSION_KEYS.region, value);
};

const handleVoiceInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  voice.value = value;
  writeSessionValue(SESSION_KEYS.voice, value);
};

const handleOutputFormatChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  outputFormat.value = value;
  writeSessionValue(SESSION_KEYS.outputFormat, value);
};

const handleLoadSample = () => {
  const result = buildSampleSSML(selectedSampleId.value, voice.value || DEFAULT_VOICE);

  ssml.value = result.ssml;
  generationWarnings.value = result.warnings;
  status.value = "idle";
  statusText.value = "";
  replaceAudioUrl(null);
  resetAnalyzeOutputs();
};

const handleClearCredentials = () => {
  subscriptionKey.value = "";
  region.value = "";
  voice.value = DEFAULT_VOICE;
  outputFormat.value = DEFAULT_OUTPUT_FORMAT;

  writeSessionValue(SESSION_KEYS.subscriptionKey, "");
  writeSessionValue(SESSION_KEYS.region, "");
  writeSessionValue(SESSION_KEYS.voice, DEFAULT_VOICE);
  writeSessionValue(SESSION_KEYS.outputFormat, DEFAULT_OUTPUT_FORMAT);
};

const handleSynthesize = async () => {
  if (!subscriptionKey.value || !region.value) {
    status.value = "error";
    statusText.value = "Azure の subscription key と region を入力してください。";
    return;
  }

  status.value = "submitting";
  statusText.value = "Azure TTS に送信しています...";

  try {
    const response = await fetch("/api/azure/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriptionKey: subscriptionKey.value,
        region: region.value,
        ssml: ssml.value,
        outputFormat: outputFormat.value,
      }),
    });

    if (!response.ok) {
      status.value = "error";
      statusText.value = await readErrorMessage(response);
      replaceAudioUrl(null);
      return;
    }

    const audioBlob = await response.blob();
    const nextAudioUrl = URL.createObjectURL(audioBlob);

    replaceAudioUrl(nextAudioUrl);
    status.value = "success";
    statusText.value = `音声生成に成功しました。(${audioBlob.type || "audio"})`;
  } catch (error) {
    status.value = "error";
    statusText.value =
      error instanceof Error ? error.message : "音声生成に失敗しました。";
    replaceAudioUrl(null);
  }
};

const handleAnalyzeText = async () => {
  if (!freeText.value.trim()) {
    status.value = "error";
    statusText.value = "解析する日本語テキストを入力してください。";
    return;
  }

  status.value = "submitting";
  statusText.value = "Analyze API に送信しています...";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: freeText.value,
        locale: "ja-JP",
        voice: voice.value || DEFAULT_VOICE,
        includeDebug: true,
      }),
    });

    if (!response.ok) {
      status.value = "error";
      statusText.value = await readErrorMessage(response);
      return;
    }

    const payload = (await response.json()) as AnalyzeSuccessResponse;

    ssml.value = payload.azureSSML;
    generationWarnings.value = payload.warnings;
    latestAccentIR.value = payload.accentIR;
    latestRawTokens.value = payload.debug?.rawTokens ?? null;
    replaceAudioUrl(null);
    status.value = "success";
    statusText.value = "Analyze API から SSML を取得しました。";
  } catch (error) {
    status.value = "error";
    statusText.value =
      error instanceof Error ? error.message : "解析に失敗しました。";
  }
};
</script>

<template>
  <div class="page-shell">
    <div class="page-body">
      <h1>Azure TTS Verification Surface</h1>
      <p class="lead">
        `AccentIR -&gt; Azure SSML` の最小動作確認用 UI です。credential は
        `sessionStorage` のみを使って保持し、Worker 経由で Azure に転送します。
      </p>

      <section class="panel mode-panel">
        <label class="mode-option">
          <input v-model="mode" type="radio" value="sample" />
          <span>Sample mode</span>
        </label>
        <label class="mode-option">
          <input v-model="mode" type="radio" value="free-text" />
          <span>Free-text mode</span>
        </label>
      </section>

      <section class="panel grid-panel">
        <label class="field">
          <span>Subscription Key</span>
          <input
            :value="subscriptionKey"
            type="password"
            placeholder="Azure Speech key"
            @input="handleSubscriptionKeyInput"
          />
        </label>
        <label class="field">
          <span>Region</span>
          <input
            :value="region"
            placeholder="japaneast"
            @input="handleRegionInput"
          />
        </label>
        <label class="field">
          <span>Voice</span>
          <input
            :value="voice"
            :placeholder="DEFAULT_VOICE"
            @input="handleVoiceInput"
          />
        </label>
        <label class="field">
          <span>Output Format</span>
          <select
            :value="outputFormat"
            @change="handleOutputFormatChange"
          >
            <option value="audio-24khz-48kbitrate-mono-mp3">
              audio-24khz-48kbitrate-mono-mp3
            </option>
            <option value="audio-24khz-96kbitrate-mono-mp3">
              audio-24khz-96kbitrate-mono-mp3
            </option>
            <option value="audio-48khz-96kbitrate-mono-mp3">
              audio-48khz-96kbitrate-mono-mp3
            </option>
          </select>
        </label>
        <div class="actions">
          <button @click="handleClearCredentials">Clear sessionStorage</button>
        </div>
      </section>

      <section v-if="mode === 'sample'" class="panel sample-panel">
        <label class="field sample-field">
          <span>AccentIR sample</span>
          <select v-model="selectedSampleId">
            <option v-for="sample in SAMPLE_CASES" :key="sample.id" :value="sample.id">
              {{ sample.label }}
            </option>
          </select>
        </label>
        <button @click="handleLoadSample">Load sample into textarea</button>
      </section>

      <p class="helper">
        Voice は sample / free-text の両モードで生成時に反映されます。手動編集した
        SSML はそのまま送信されます。
      </p>

      <section v-if="mode === 'free-text'" class="panel">
        <label class="field">
          <span>Analyze input text</span>
          <textarea
            v-model="freeText"
            class="free-text-input"
            placeholder="ここに自由入力テキストを入れて Analyze します"
          />
        </label>
        <div class="free-text-actions">
          <button :disabled="status === 'submitting'" @click="handleAnalyzeText">
            {{ status === "submitting" ? "Analyzing..." : "Analyze text" }}
          </button>
          <button :disabled="status === 'submitting'" @click="handleSynthesize">
            {{ status === "submitting" ? "Generating..." : "Send current SSML to Azure" }}
          </button>
        </div>
      </section>

      <section v-if="mode === 'sample'" class="panel action-panel">
        <button :disabled="status === 'submitting'" @click="handleSynthesize">
          {{ status === "submitting" ? "Generating..." : "Send current SSML to Azure" }}
        </button>
      </section>

      <section v-if="generationWarnings.length > 0" class="warning-panel">
        <strong>Generation warnings</strong>
        <ul>
          <li v-for="warning in generationWarnings" :key="`${warning.code}-${warning.segmentIndex}`">
            {{ warning.code }}: {{ warning.message }}
          </li>
        </ul>
      </section>

      <section v-if="latestAccentIR" class="panel">
        <h2>AccentIR</h2>
        <pre class="ssml-preview">{{ JSON.stringify(latestAccentIR, null, 2) }}</pre>
      </section>

      <section v-if="latestRawTokens" class="panel">
        <h2>Raw tokens (debug)</h2>
        <pre class="ssml-preview">{{ JSON.stringify(latestRawTokens, null, 2) }}</pre>
      </section>

      <section class="panel">
        <label class="field">
          <span>SSML</span>
          <textarea v-model="ssml" class="ssml-input" />
        </label>
      </section>

      <section class="panel">
        <h2>Result</h2>
        <p :class="status === 'error' ? 'status error' : 'status'">
          {{ statusText || "まだ送信していません。" }}
        </p>
        <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player">
          Your browser does not support the audio element.
        </audio>
        <pre class="ssml-preview">{{ ssml }}</pre>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  width: 100vw;
  padding: 32px;
  background: #f0f0f0;
  box-sizing: border-box;
}

.page-body {
  max-width: 960px;
  margin: 0 auto;
}

h1,
h2 {
  margin-top: 0;
}

.lead,
.helper,
.status {
  line-height: 1.6;
  color: #555;
}

.status.error {
  color: #b42318;
}

.panel {
  background: #fff;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 12px;
  margin-bottom: 20px;
}

.grid-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.mode-panel {
  display: flex;
  gap: 20px;
}

.mode-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sample-panel {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sample-field {
  min-width: 0;
}

.actions {
  display: flex;
  align-items: end;
}

.warning-panel {
  background: #fff7e6;
  padding: 16px;
  border: 1px solid #f0c36d;
  border-radius: 12px;
  margin-bottom: 20px;
}

.warning-panel ul {
  margin-bottom: 0;
}

.ssml-input {
  min-height: 420px;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.free-text-input {
  min-height: 140px;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.free-text-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.action-panel {
  display: flex;
  justify-content: flex-end;
}

.audio-player {
  width: 100%;
}

.ssml-preview {
  margin-top: 16px;
  margin-bottom: 0;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 10px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

button,
input,
select,
textarea {
  font: inherit;
}
</style>
