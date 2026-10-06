import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Link2, Loader2, Music, Scissors, ShieldCheck, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropArea } from "@/components/file-drop-area";
import { Chip, Field, Panel, Tabs, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { baseName, downloadBlob, formatBytes } from "@/lib/files";
import {
  AUDIO_TARGETS,
  VIDEO_TARGETS,
  bitrateForSize,
  convertMedia,
  formatTime,
  parseTime,
  probeMedia,
  videoToGif,
  webCodecsSupported,
  type AudioTarget,
  type MediaInfo,
  type QualityLevel,
  type VideoTarget,
} from "@/lib/media";

export const Route = createFileRoute("/video-tools")({
  component: RouteComponent,
});

type Tab = "audio" | "compress" | "trim" | "gif" | "convert";

const TABS: { value: Tab; label: string }[] = [
  { value: "audio", label: "Video → MP3" },
  { value: "compress", label: "Compress" },
  { value: "trim", label: "Trim / Cut" },
  { value: "gif", label: "Video → GIF" },
  { value: "convert", label: "Convert format" },
];

const ACCEPT = "video/*,audio/*,.mkv,.mov,.m4a,.flac,.ogg,.opus,.ts";

// Sites that only stream through their own players; browsers can't fetch these as files
const STREAMING_SITES = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|x\.com|twitter\.com|vimeo\.com|t\.me)$/i;

type Source = { file: File; url: string; info: MediaInfo };

function RouteComponent() {
  const [tab, setTab] = useState<Tab>("audio");
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  useSEO({
    title: "Video to MP3, Compress Video, Trim Video & Video to GIF, Free & Private | Utility Hub",
    description:
      "Extract MP3 audio from videos, compress videos for WhatsApp or email, trim and cut clips, make GIFs and convert MOV, MKV and WebM to MP4. Runs in your browser: your files are never uploaded.",
    path: "/video-tools",
    keywords:
      "video to mp3, mp4 to mp3, extract audio from video, compress video, reduce video size, trim video, cut video, video to gif, mov to mp4, mkv to mp4, webm to mp4, audio converter, wav to mp3, m4a to mp3",
    applicationCategory: "MultimediaApplication",
    featureList: [
      "Extract audio as MP3, M4A, WAV, OGG or FLAC",
      "Compress video to a target size (e.g. under 16 MB) or quality",
      "Trim and cut video or audio",
      "Convert video to an animated GIF",
      "Convert MOV, MKV and WebM to MP4 (and back)",
      "Hardware-accelerated, runs on your device: files are never uploaded",
    ],
  });

  // Release the preview URL when the source changes or the page closes
  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source.url);
  }, [source]);

  const open = async (file: File) => {
    setError(null);
    setLoading(`Reading ${file.name}…`);
    try {
      const info = await probeMedia(file);
      setSource({ file, url: URL.createObjectURL(file), info });
      if (!info.video && (tab === "gif" || tab === "compress" || tab === "convert")) setTab("audio");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally {
      setLoading(null);
    }
  };

  const openUrl = async (raw: string) => {
    setError(null);
    let url: URL;
    try {
      url = new URL(raw.trim());
    } catch {
      setError("That doesn't look like a link.");
      return;
    }
    if (STREAMING_SITES.test(url.hostname)) {
      setError(
        `${url.hostname.replace(/^www\./, "")} only plays videos inside its own app and doesn't let other websites download them, so this can't work in a browser. ` +
          "If it's your own video, download it from the site (for YouTube: YouTube Studio → Content → ⋮ → Download), then open the file here."
      );
      return;
    }
    setLoading("Downloading…");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`The server answered ${res.status}.`);
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setLoading(`Downloading… ${formatBytes(received)}${total ? ` of ${formatBytes(total)}` : ""}`);
      }
      const name = decodeURIComponent(url.pathname.split("/").pop() || "download") || "download";
      const type = res.headers.get("content-type") ?? "";
      await open(new File(chunks as BlobPart[], name, { type }));
    } catch (e) {
      setLoading(null);
      setError(
        e instanceof TypeError
          ? "That website doesn't allow other sites to download its files (CORS), or the link isn't reachable. Download the file to your device and open it here instead."
          : e instanceof Error
            ? e.message
            : "Download failed."
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <ToolHeader
        title="Video & Audio Tools"
        subtitle="Video to MP3, compress, trim, GIF and format conversion. Everything runs on your device, nothing is uploaded."
      />

      {!webCodecsSupported() ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          This browser doesn't support in-browser video processing (WebCodecs). Please use the latest Chrome, Edge or Firefox, or Safari 17+.
        </p>
      ) : null}

      <Panel>
        {source ? (
          <SourceCard source={source} mediaRef={mediaRef} onClear={() => setSource(null)} />
        ) : (
          <>
            <FileDropArea accept={ACCEPT} onFiles={(f) => open(f[0])} hint="Drop a video or audio file: MP4, MOV, MKV, WebM, MP3, M4A, WAV, OGG, FLAC…" />
            <UrlLoader onLoad={openUrl} disabled={!!loading} />
          </>
        )}
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {loading}
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600" data-testid="source-error">{error}</p> : null}
      </Panel>

      <Tabs value={tab} onChange={setTab} options={TABS} />

      {source ? (
        <>
          {tab === "audio" && <AudioTool key={source.url} source={source} mediaRef={mediaRef} />}
          {tab === "compress" && <CompressTool key={source.url} source={source} />}
          {tab === "trim" && <TrimTool key={source.url} source={source} mediaRef={mediaRef} />}
          {tab === "gif" && <GifTool key={source.url} source={source} mediaRef={mediaRef} />}
          {tab === "convert" && <ConvertTool key={source.url} source={source} />}
        </>
      ) : (
        <Panel className="text-sm text-muted-foreground">Open a video or audio file above to start.</Panel>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div className="space-y-1">
          <p>
            <b className="text-foreground">Private by design.</b> Files are processed by your browser's built-in video engine (hardware-accelerated
            where available). Nothing is sent to a server, so it also works offline once the page has loaded.
          </p>
          <p>
            <b className="text-foreground">Why no YouTube links?</b> YouTube, TikTok and Instagram stream videos only through their own players and
            block other websites from downloading them. Links straight to a file (ending in .mp4, .mp3, …) work if that site allows it.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------- Source ----------------

function UrlLoader({ onLoad, disabled }: { onLoad: (url: string) => void; disabled: boolean }) {
  const [url, setUrl] = useState("");
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) onLoad(url);
      }}
    >
      <div className="relative flex-1">
        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          aria-label="Link to a video or audio file"
          placeholder="…or paste a direct link to a video/audio file (https://…/video.mp4)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={disabled || !url.trim()}>
        Load link
      </Button>
    </form>
  );
}

function SourceCard({ source, mediaRef, onClear }: { source: Source; mediaRef: RefObject<HTMLVideoElement & HTMLAudioElement | null>; onClear: () => void }) {
  const { file, info, url } = source;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {info.video ? (
        <video ref={mediaRef} src={url} controls playsInline className="max-h-80 w-full rounded-lg bg-black" />
      ) : (
        <div className="flex flex-col justify-center gap-3 rounded-lg border border-border p-4">
          <Music className="h-10 w-10 text-muted-foreground" />
          <audio ref={mediaRef} src={url} controls className="w-full" />
        </div>
      )}
      <div className="space-y-2 text-sm">
        <div className="break-all font-semibold" data-testid="source-name">{file.name}</div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
          <dt>Size</dt>
          <dd className="text-foreground">{formatBytes(file.size)}</dd>
          <dt>Duration</dt>
          <dd className="text-foreground" data-testid="source-duration">{formatTime(info.duration)}</dd>
          <dt>Format</dt>
          <dd className="text-foreground">{info.format}</dd>
          {info.video ? (
            <>
              <dt>Video</dt>
              <dd className="text-foreground">
                {info.video.width}×{info.video.height} · {(info.video.codec ?? "unknown").toUpperCase()}
              </dd>
            </>
          ) : null}
          <dt>Audio</dt>
          <dd className="text-foreground">
            {info.audio ? `${(info.audio.codec ?? "unknown").toUpperCase()} · ${info.audio.channels === 1 ? "mono" : "stereo"} · ${(info.audio.sampleRate / 1000).toFixed(1)} kHz` : "none"}
          </dd>
        </dl>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4" /> Open another file
        </Button>
      </div>
    </div>
  );
}

// ---------------- Shared job runner ----------------

type JobResult = { blob: Blob; name: string; kind: "video" | "audio" | "image" };

function useJob() {
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const resultUrl = useObjectUrl(result?.blob ?? null);

  const run = async (work: (job: { onProgress: (p: number) => void; onStart: (cancel: () => void) => void }) => Promise<JobResult>) => {
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const out = await work({ onProgress: (p) => setProgress(p), onStart: (cancel) => (cancelRef.current = cancel) });
      setResult(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "Canceled.") setError(msg || "Something went wrong.");
    } finally {
      cancelRef.current = null;
      setProgress(null);
    }
  };

  return { progress, result, resultUrl, error, run, cancel: () => cancelRef.current?.(), reset: () => setResult(null) };
}

function useObjectUrl(blob: Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function JobPanel({
  job,
  label,
  disabled,
  onRun,
  original,
}: {
  job: ReturnType<typeof useJob>;
  label: string;
  disabled?: boolean;
  onRun: () => void;
  original?: number;
}) {
  const running = job.progress !== null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onRun} disabled={disabled || running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {running ? `Working… ${Math.round((job.progress ?? 0) * 100)}%` : label}
        </Button>
        {running ? (
          <Button variant="ghost" onClick={job.cancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        ) : null}
      </div>
      {running ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-blue-600 transition-[width]" style={{ width: `${Math.round((job.progress ?? 0) * 100)}%` }} />
        </div>
      ) : null}
      {job.error ? <p className="text-sm text-red-600" data-testid="job-error">{job.error}</p> : null}
      {job.result && job.resultUrl ? (
        <div className="space-y-3 rounded-lg border border-border p-4" data-testid="job-result">
          {job.result.kind === "video" ? (
            <video src={job.resultUrl} controls playsInline className="max-h-72 w-full rounded bg-black" />
          ) : job.result.kind === "audio" ? (
            <audio src={job.resultUrl} controls className="w-full" />
          ) : (
            <img src={job.resultUrl} alt="Result" className="max-h-72 rounded" />
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>
              <b>{job.result.name}</b> · {formatBytes(job.result.blob.size)}
              {original && original > job.result.blob.size ? (
                <span className="font-semibold text-green-600"> ({Math.round((1 - job.result.blob.size / original) * 100)}% smaller)</span>
              ) : null}
            </span>
            <Button onClick={() => downloadBlob(job.result!.blob, job.result!.name)}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------- Time range ----------------

function TimeRange({
  duration,
  start,
  end,
  onChange,
  mediaRef,
}: {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  mediaRef: RefObject<HTMLVideoElement & HTMLAudioElement | null>;
}) {
  const now = () => mediaRef.current?.currentTime ?? 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Start">
        <div className="flex gap-2">
          <TimeInput value={start} max={duration} onChange={(v) => onChange(v, Math.max(end, v + 0.1))} />
          <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={() => onChange(Math.min(now(), end - 0.1), end)}>
            Set to playhead
          </Button>
        </div>
      </Field>
      <Field label="End">
        <div className="flex gap-2">
          <TimeInput value={end} max={duration} onChange={(v) => onChange(Math.min(start, Math.max(0, v - 0.1)), v)} />
          <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={() => onChange(start, Math.max(now(), start + 0.1))}>
            Set to playhead
          </Button>
        </div>
      </Field>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Selected: {formatTime(start)} → {formatTime(end)} ({formatTime(end - start)}). Play the preview above and use “Set to playhead” to pick exact points.
      </p>
    </div>
  );
}

function TimeInput({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(formatTime(value));
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : formatTime(value);
  return (
    <Input
      className="h-9"
      value={shown}
      onFocus={() => {
        setText(formatTime(value));
        setFocused(true);
      }}
      onChange={(e) => {
        setText(e.target.value);
        const v = parseTime(e.target.value);
        if (Number.isFinite(v)) onChange(Math.min(Math.max(0, v), max));
      }}
      onBlur={() => setFocused(false)}
      placeholder="m:ss"
    />
  );
}

// ---------------- Tools ----------------

const BITRATES = [96, 128, 192, 256, 320];

function AudioTool({ source, mediaRef }: { source: Source; mediaRef: RefObject<HTMLVideoElement & HTMLAudioElement | null> }) {
  const [target, setTarget] = useState<AudioTarget>("mp3");
  const [kbps, setKbps] = useState(192);
  const [mono, setMono] = useState(false);
  const [cut, setCut] = useState(false);
  const [range, setRange] = useState({ start: 0, end: source.info.duration });
  const job = useJob();
  const lossless = target === "wav" || target === "flac";

  if (!source.info.audio) return <Panel className="text-sm">This file has no audio track.</Panel>;

  return (
    <Panel>
      <Field label="Output format">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AUDIO_TARGETS) as AudioTarget[]).map((t) => (
            <Chip key={t} active={target === t} onClick={() => setTarget(t)}>
              {AUDIO_TARGETS[t].label}
            </Chip>
          ))}
        </div>
      </Field>
      {!lossless ? (
        <Field label="Quality (bitrate)" hint="192 kbps sounds great for music; 96–128 kbps is fine for speech and keeps files small.">
          <div className="flex flex-wrap gap-2">
            {BITRATES.map((b) => (
              <Chip key={b} active={kbps === b} onClick={() => setKbps(b)}>
                {b} kbps
              </Chip>
            ))}
          </div>
        </Field>
      ) : null}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={mono} onChange={(e) => setMono(e.target.checked)} /> Mono (half the size, for speech)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={cut} onChange={(e) => setCut(e.target.checked)} />
          <Scissors className="h-4 w-4" /> Only keep part of it
        </label>
      </div>
      {cut ? (
        <TimeRange duration={source.info.duration} start={range.start} end={range.end} mediaRef={mediaRef} onChange={(start, end) => setRange({ start, end })} />
      ) : null}
      <JobPanel
        job={job}
        label={`Convert to ${AUDIO_TARGETS[target].label.split(" ")[0]}`}
        onRun={() =>
          job.run(async (j) => ({
            blob: await convertMedia({
              ...j,
              file: source.file,
              target,
              trim: cut ? range : undefined,
              audio: { bitrate: lossless ? undefined : kbps * 1000, channels: mono ? 1 : undefined },
              copy: false,
            }),
            name: `${baseName(source.file.name)}.${AUDIO_TARGETS[target].ext}`,
            kind: "audio",
          }))
        }
      />
    </Panel>
  );
}

const SIZE_PRESETS = [
  { mb: 8, label: "8 MB" },
  { mb: 16, label: "16 MB (WhatsApp)" },
  { mb: 25, label: "25 MB (Email)" },
  { mb: 50, label: "50 MB" },
  { mb: 100, label: "100 MB" },
];

const RESOLUTIONS = [
  { value: 0, label: "Original" },
  { value: 1080, label: "1080p" },
  { value: 720, label: "720p" },
  { value: 480, label: "480p" },
  { value: 360, label: "360p" },
];

function CompressTool({ source }: { source: Source }) {
  const [mode, setMode] = useState<"size" | "quality">("size");
  const [targetMb, setTargetMb] = useState(() => {
    const mb = source.file.size / 1024 / 1024;
    return SIZE_PRESETS.find((p) => p.mb < mb * 0.8)?.mb ?? Math.max(1, Math.round(mb / 2));
  });
  const [level, setLevel] = useState<QualityLevel>("medium");
  const [resolution, setResolution] = useState(0);
  const [muted, setMuted] = useState(false);
  const job = useJob();
  const { duration, video } = source.info;
  const audioBitrate = muted || !source.info.audio ? 0 : 96_000;
  const videoBitrate = bitrateForSize(targetMb * 1024 * 1024, duration, audioBitrate);
  // With a size target, pick a resolution the bitrate can actually carry
  const autoHeight = videoBitrate >= 2_500_000 ? 1080 : videoBitrate >= 1_200_000 ? 720 : videoBitrate >= 600_000 ? 480 : 360;
  const height = resolution || (mode === "size" ? autoHeight : 0);

  if (!video) return <Panel className="text-sm">This is an audio file. Use “Video → MP3” to re-encode it at a lower bitrate.</Panel>;

  return (
    <Panel>
      <Tabs
        value={mode}
        onChange={setMode}
        options={[
          { value: "size", label: "Target file size" },
          { value: "quality", label: "Quality" },
        ]}
      />
      {mode === "size" ? (
        <Field label="Make it smaller than" hint={`Video bitrate ≈ ${(videoBitrate / 1_000_000).toFixed(2)} Mbps for ${formatTime(duration)}.`}>
          <div className="flex flex-wrap items-center gap-2">
            {SIZE_PRESETS.map((p) => (
              <Chip key={p.mb} active={targetMb === p.mb} onClick={() => setTargetMb(p.mb)}>
                {p.label}
              </Chip>
            ))}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                className="h-9 w-24"
                aria-label="Target size in MB"
                value={targetMb}
                onChange={(e) => setTargetMb(Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
          </div>
        </Field>
      ) : (
        <Field label="Quality">
          <div className="flex flex-wrap gap-2">
            {(["high", "medium", "low"] as const).map((q) => (
              <Chip key={q} active={level === q} onClick={() => setLevel(q)}>
                {q === "high" ? "High (bigger)" : q === "medium" ? "Medium" : "Low (smallest)"}
              </Chip>
            ))}
          </div>
        </Field>
      )}
      <Field label="Resolution" hint={mode === "size" && !resolution ? `Auto: ${Math.min(autoHeight, video.height)}p fits this size best.` : undefined}>
        <div className="flex flex-wrap gap-2">
          {RESOLUTIONS.map((r) => (
            <Chip key={r.value} active={resolution === r.value} onClick={() => setResolution(r.value)}>
              {r.value === 0 && mode === "size" ? "Auto" : r.label}
            </Chip>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} /> Remove sound
      </label>
      <JobPanel
        job={job}
        label="Compress video"
        original={source.file.size}
        onRun={() =>
          job.run(async (j) => ({
            blob: await convertMedia({
              ...j,
              file: source.file,
              target: "mp4",
              video: {
                maxHeight: height || undefined,
                forceTranscode: true,
                ...(mode === "size" ? { bitrate: videoBitrate } : { quality: level }),
              },
              audio: muted ? { discard: true } : { bitrate: audioBitrate || undefined },
            }),
            name: `${baseName(source.file.name)}-compressed.mp4`,
            kind: "video",
          }))
        }
      />
    </Panel>
  );
}

function TrimTool({ source, mediaRef }: { source: Source; mediaRef: RefObject<HTMLVideoElement & HTMLAudioElement | null> }) {
  const [range, setRange] = useState({ start: 0, end: source.info.duration });
  const [exact, setExact] = useState(false);
  const job = useJob();
  const { target, kind } = sameKindTarget(source);
  const ext = kind === "video" ? VIDEO_TARGETS[target as VideoTarget].ext : AUDIO_TARGETS[target as AudioTarget].ext;

  return (
    <Panel>
      <TimeRange duration={source.info.duration} start={range.start} end={range.end} mediaRef={mediaRef} onChange={(start, end) => setRange({ start, end })} />
      {kind === "video" ? (
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="radio" className="mt-1" checked={!exact} onChange={() => setExact(false)} />
            <span>
              <b>Fast</b>: no quality loss, done in seconds. The start may move back slightly to the nearest key frame.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" className="mt-1" checked={exact} onChange={() => setExact(true)} />
            <span>
              <b>Frame-exact</b>: cuts exactly where you chose, but re-encodes (slower).
            </span>
          </label>
        </div>
      ) : null}
      <JobPanel
        job={job}
        label="Cut"
        onRun={() =>
          job.run(async (j) => ({
            blob: await convertMedia({ ...j, file: source.file, target, trim: range, copy: kind === "video" ? !exact : true, compatible: false }),
            name: `${baseName(source.file.name)}-${formatTime(range.start).replace(/[:.]/g, "-")}.${ext}`,
            kind,
          }))
        }
      />
    </Panel>
  );
}

/** Keep the trimmed file in the same container as the original where we can write it. */
function sameKindTarget(source: Source): { target: AudioTarget | VideoTarget; kind: "video" | "audio" } {
  const f = source.info.format.toLowerCase();
  if (source.info.video) {
    if (f.includes("webm")) return { target: "webm", kind: "video" };
    if (f.includes("matroska") || f.includes("mkv")) return { target: "mkv", kind: "video" };
    if (f.includes("quicktime") || f.includes("mov")) return { target: "mov", kind: "video" };
    return { target: "mp4", kind: "video" };
  }
  if (f.includes("mp3")) return { target: "mp3", kind: "audio" };
  if (f.includes("wav")) return { target: "wav", kind: "audio" };
  if (f.includes("flac")) return { target: "flac", kind: "audio" };
  if (f.includes("ogg")) return { target: "ogg", kind: "audio" };
  return { target: "m4a", kind: "audio" };
}

function GifTool({ source, mediaRef }: { source: Source; mediaRef: RefObject<HTMLVideoElement & HTMLAudioElement | null> }) {
  const [range, setRange] = useState({ start: 0, end: Math.min(5, source.info.duration) });
  const [width, setWidth] = useState(480);
  const [fps, setFps] = useState(12);
  const job = useJob();
  const length = range.end - range.start;
  const tooLong = length > 30;

  if (!source.info.video) return <Panel className="text-sm">This file has no video.</Panel>;

  return (
    <Panel>
      <TimeRange duration={source.info.duration} start={range.start} end={range.end} mediaRef={mediaRef} onChange={(start, end) => setRange({ start, end })} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Width">
          <div className="flex flex-wrap gap-2">
            {[240, 320, 480, 640].map((w) => (
              <Chip key={w} active={width === w} onClick={() => setWidth(w)}>
                {w}px
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Frames per second">
          <div className="flex flex-wrap gap-2">
            {[8, 10, 12, 15, 20].map((f) => (
              <Chip key={f} active={fps === f} onClick={() => setFps(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </Field>
      </div>
      {tooLong ? (
        <p className="text-sm text-amber-600">GIFs get very large. Pick 30 seconds or less (shorter is better), or use “Compress” for a small MP4 instead.</p>
      ) : (
        <p className="text-xs text-muted-foreground">{Math.ceil(length * fps)} frames. Smaller width and fewer frames make a smaller GIF.</p>
      )}
      <JobPanel
        job={job}
        label="Make GIF"
        disabled={tooLong || length <= 0}
        onRun={() =>
          job.run(async (j) => ({
            blob: await videoToGif({ ...j, file: source.file, start: range.start, end: range.end, width, fps }),
            name: `${baseName(source.file.name)}.gif`,
            kind: "image",
          }))
        }
      />
    </Panel>
  );
}

function ConvertTool({ source }: { source: Source }) {
  const [target, setTarget] = useState<VideoTarget>("mp4");
  const [resolution, setResolution] = useState(0);
  const job = useJob();

  if (!source.info.video) return <Panel className="text-sm">This is an audio file. Use “Video → MP3” to convert it to MP3, M4A, WAV, OGG or FLAC.</Panel>;

  return (
    <Panel>
      <Field label="Convert to">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(VIDEO_TARGETS) as VideoTarget[]).map((t) => (
            <Chip key={t} active={target === t} onClick={() => setTarget(t)}>
              {VIDEO_TARGETS[t].label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Resolution">
        <div className="flex flex-wrap gap-2">
          {RESOLUTIONS.map((r) => (
            <Chip key={r.value} active={resolution === r.value} onClick={() => setResolution(r.value)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Note>
        When the video's codec already fits the new format (e.g. iPhone MOV → MP4), it's repackaged without re-encoding: instant and no quality loss.
      </Note>
      <JobPanel
        job={job}
        label={`Convert to ${VIDEO_TARGETS[target].ext.toUpperCase()}`}
        onRun={() =>
          job.run(async (j) => ({
            blob: await convertMedia({ ...j, file: source.file, target, video: { maxHeight: resolution || undefined, quality: resolution ? "high" : undefined } }),
            name: `${baseName(source.file.name)}.${VIDEO_TARGETS[target].ext}`,
            kind: "video",
          }))
        }
      />
    </Panel>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
