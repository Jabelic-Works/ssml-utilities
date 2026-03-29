import {
  emitAzureSSML,
  type AccentIR,
  type AccentIREmitWarning,
} from "@ssml-utilities/accent-ir";
import { SSMLEditor } from "@ssml-utilities/editor-react";
import { useState, type ChangeEvent } from "react";

const DEFAULT_VOICE = "ja-JP-NanamiNeural";
const DEFAULT_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

const SESSION_KEYS = {
  subscriptionKey: "azure-subscription-key",
  region: "azure-region",
  voice: "azure-voice",
  outputFormat: "azure-output-format",
} as const;

type SynthesisStatus = "idle" | "submitting" | "success" | "error";

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

function App() {
  const [subscriptionKey, setSubscriptionKey] = useState(() =>
    readSessionValue(SESSION_KEYS.subscriptionKey)
  );
  const [region, setRegion] = useState(() =>
    readSessionValue(SESSION_KEYS.region)
  );
  const [voice, setVoice] = useState(() =>
    readSessionValue(SESSION_KEYS.voice, DEFAULT_VOICE)
  );
  const [outputFormat, setOutputFormat] = useState(() =>
    readSessionValue(SESSION_KEYS.outputFormat, DEFAULT_OUTPUT_FORMAT)
  );
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_CASES[0].id);
  const initialSample = buildSampleSSML(SAMPLE_CASES[0].id, voice || DEFAULT_VOICE);
  const [ssml, setSSML] = useState(initialSample.ssml);
  const [generationWarnings, setGenerationWarnings] = useState<AccentIREmitWarning[]>(
    initialSample.warnings
  );
  const [status, setStatus] = useState<SynthesisStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);

  const replaceAudioUrl = (nextAudioUrl: string | null) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(nextAudioUrl);
  };

  const handleFieldChange =
    (
      setter: (value: string) => void,
      sessionKey: string
    ) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setter(value);
      writeSessionValue(sessionKey, value);
    };

  const handleLoadSample = () => {
    const result = buildSampleSSML(selectedSampleId, voice || DEFAULT_VOICE);

    setSSML(result.ssml);
    setGenerationWarnings(result.warnings);
    setStatus("idle");
    setStatusText("");
    replaceAudioUrl(null);
    setEditorVersion((version) => version + 1);
  };

  const handleClearCredentials = () => {
    setSubscriptionKey("");
    setRegion("");
    setVoice(DEFAULT_VOICE);
    setOutputFormat(DEFAULT_OUTPUT_FORMAT);

    writeSessionValue(SESSION_KEYS.subscriptionKey, "");
    writeSessionValue(SESSION_KEYS.region, "");
    writeSessionValue(SESSION_KEYS.voice, DEFAULT_VOICE);
    writeSessionValue(SESSION_KEYS.outputFormat, DEFAULT_OUTPUT_FORMAT);
  };

  const handleSynthesize = async () => {
    if (!subscriptionKey || !region) {
      setStatus("error");
      setStatusText("Azure の subscription key と region を入力してください。");
      return;
    }

    setStatus("submitting");
    setStatusText("Azure TTS に送信しています...");

    try {
      const response = await fetch("/api/azure/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionKey,
          region,
          ssml,
          outputFormat,
        }),
      });

      if (!response.ok) {
        setStatus("error");
        setStatusText(await readErrorMessage(response));
        replaceAudioUrl(null);
        return;
      }

      const audioBlob = await response.blob();
      const nextAudioUrl = URL.createObjectURL(audioBlob);

      replaceAudioUrl(nextAudioUrl);
      setStatus("success");
      setStatusText(`音声生成に成功しました。(${audioBlob.type || "audio"})`);
    } catch (error) {
      setStatus("error");
      setStatusText(
        error instanceof Error ? error.message : "音声生成に失敗しました。"
      );
      replaceAudioUrl(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: "32px",
        margin: "0",
        backgroundColor: "#f0f0f0",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Azure TTS Verification Surface</h1>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>
          `AccentIR -&gt; Azure SSML` の最小動作確認用 UI です。credential は
          `sessionStorage` のみを使って保持し、Worker 経由で Azure に転送します。
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            backgroundColor: "#fff",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Subscription Key</span>
            <input
              type="password"
              value={subscriptionKey}
              onChange={handleFieldChange(
                setSubscriptionKey,
                SESSION_KEYS.subscriptionKey
              )}
              placeholder="Azure Speech key"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Region</span>
            <input
              value={region}
              onChange={handleFieldChange(setRegion, SESSION_KEYS.region)}
              placeholder="japaneast"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Voice</span>
            <input
              value={voice}
              onChange={handleFieldChange(setVoice, SESSION_KEYS.voice)}
              placeholder={DEFAULT_VOICE}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Output Format</span>
            <select
              value={outputFormat}
              onChange={handleFieldChange(
                setOutputFormat,
                SESSION_KEYS.outputFormat
              )}
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
          <div style={{ display: "flex", alignItems: "end", gap: "8px" }}>
            <button onClick={handleClearCredentials}>Clear sessionStorage</button>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: "12px",
            alignItems: "end",
            backgroundColor: "#fff",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>AccentIR sample</span>
            <select
              value={selectedSampleId}
              onChange={(event) => setSelectedSampleId(event.target.value)}
            >
              {SAMPLE_CASES.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleLoadSample}>Load sample into editor</button>
          <button onClick={handleSynthesize} disabled={status === "submitting"}>
            {status === "submitting" ? "Generating..." : "Send to Azure"}
          </button>
        </section>

        <p style={{ marginTop: 0, marginBottom: "12px", color: "#555" }}>
          Voice は sample から SSML を生成するときだけ反映されます。手動編集した
          SSML はそのまま送信されます。
        </p>

        {generationWarnings.length > 0 && (
          <section
            style={{
              backgroundColor: "#fff7e6",
              padding: "16px",
              border: "1px solid #f0c36d",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <strong>Generation warnings</strong>
            <ul style={{ marginBottom: 0 }}>
              {generationWarnings.map((warning) => (
                <li key={`${warning.code}-${warning.segmentIndex}`}>
                  {warning.code}: {warning.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div style={{ width: "100%", height: "420px", marginBottom: "20px" }}>
          <SSMLEditor
            key={editorVersion}
            initialValue={ssml}
            onChange={setSSML}
            width="100%"
            height="420px"
          />
        </div>

        <section
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Result</h2>
          <p
            style={{
              marginTop: 0,
              color: status === "error" ? "#b42318" : "#555",
            }}
          >
            {statusText || "まだ送信していません。"}
          </p>
          {audioUrl && (
            <audio controls src={audioUrl} style={{ width: "100%" }}>
              Your browser does not support the audio element.
            </audio>
          )}
          <pre
            style={{
              marginTop: "16px",
              marginBottom: 0,
              padding: "16px",
              backgroundColor: "#fafafa",
              border: "1px solid #eee",
              borderRadius: "10px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {ssml}
          </pre>
        </section>
      </div>
    </div>
  );
}

export default App;
