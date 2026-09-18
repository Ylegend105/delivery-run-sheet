// Generates the ElevenLabs voice-over and derives per-scene timings from the
// character-level alignment the API returns, so the visuals stay in sync with
// the narration instead of being timed by hand.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = "eleven_multilingual_v2";
const TAIL_SECONDS = 1.0;

function loadEnv() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

// "Brian" — a default voice. Free accounts are blocked from library voices, and
// listing voices needs a voices_read permission the render key does not have.
const FALLBACK_VOICE_ID = "nPczCjzI2devNBz1zQrb";

async function pickVoiceId(apiKey) {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) {
    console.warn(`Could not list voices (${res.status}); using stock voice.`);
    return FALLBACK_VOICE_ID;
  }
  const { voices } = await res.json();
  const preferred = voices?.find((v) => /brian|adam|rachel|george/i.test(v.name));
  const chosen = preferred ?? voices?.[0];
  if (!chosen) return FALLBACK_VOICE_ID;
  console.log(`Voice: ${chosen.name} (${chosen.voice_id})`);
  return chosen.voice_id;
}

function timingsFromAlignment(scenes, alignment, fullText) {
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const usable = alignment.characters?.length === fullText.length;

  const result = {};
  let cursor = 0;
  let previousEnd = 0;

  for (const scene of scenes) {
    const from = cursor;
    const to = cursor + scene.line.length - 1;
    cursor = to + 2; // skip the joining space

    const start = usable ? starts[from] : (from / fullText.length) * ends.at(-1);
    const end = usable ? ends[to] : (to / fullText.length) * ends.at(-1);

    result[scene.id] = {
      start: Number(previousEnd.toFixed(3)),
      end: Number(Math.max(end, start + 0.5).toFixed(3)),
    };
    previousEnd = result[scene.id].end;
  }

  if (!usable) {
    console.warn("Alignment length mismatch — fell back to proportional timings.");
  }
  return { scenes: result, totalDuration: Number((previousEnd + TAIL_SECONDS).toFixed(3)) };
}

async function main() {
  loadEnv();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing ELEVENLABS_API_KEY. Put it in marketing-video/.env as ELEVENLABS_API_KEY=sk_...",
    );
    process.exit(1);
  }

  const scenes = JSON.parse(readFileSync(join(ROOT, "src/narration.json"), "utf8"));
  const fullText = scenes.map((s) => s.line).join(" ");
  const voiceId = await pickVoiceId(apiKey);

  console.log(`Synthesising ${fullText.length} characters...`);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: fullText,
        model_id: MODEL,
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.3 },
      }),
    },
  );
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text()}`);

  const payload = await res.json();
  mkdirSync(join(ROOT, "public"), { recursive: true });
  writeFileSync(join(ROOT, "public/voiceover.mp3"), Buffer.from(payload.audio_base64, "base64"));

  const { scenes: sceneTimings, totalDuration } = timingsFromAlignment(
    scenes,
    payload.alignment,
    fullText,
  );
  writeFileSync(
    join(ROOT, "src/timings.json"),
    `${JSON.stringify({ hasAudio: true, totalDuration, scenes: sceneTimings }, null, 2)}\n`,
  );

  console.log(`Wrote public/voiceover.mp3 (${totalDuration}s) and src/timings.json`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
