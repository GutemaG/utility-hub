// Video & audio processing on top of Mediabunny (WebCodecs). Everything runs in the browser:
// files are read from disk, decoded/encoded by the device's own codecs, and never uploaded.
import type { AudioCodec, Input, OutputFormat, Quality, VideoCodec } from "mediabunny";

const loadMediabunny = () => import("mediabunny");

let mp3Ready: Promise<void> | null = null;
/** Browsers can't encode MP3 natively, so register the LAME (wasm) encoder once, on first use. */
function ensureMp3Encoder() {
  if (!mp3Ready) {
    mp3Ready = (async () => {
      const { canEncodeAudio } = await loadMediabunny();
      if (!(await canEncodeAudio("mp3"))) {
        const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
        registerMp3Encoder();
      }
    })();
  }
  return mp3Ready;
}

export function webCodecsSupported() {
  return typeof window !== "undefined" && "VideoEncoder" in window && "AudioEncoder" in window && "VideoDecoder" in window;
}

export type MediaInfo = {
  duration: number;
  format: string;
  video: { width: number; height: number; codec: string | null } | null;
  audio: { codec: string | null; channels: number; sampleRate: number } | null;
};

async function openInput(file: Blob) {
  const { Input, BlobSource, ALL_FORMATS } = await loadMediabunny();
  return new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
}

export async function probeMedia(file: Blob): Promise<MediaInfo> {
  const input = await openInput(file);
  try {
    const [format, duration, video, audio] = await Promise.all([
      input.getFormat(),
      input.computeDuration(),
      input.getPrimaryVideoTrack(),
      input.getPrimaryAudioTrack(),
    ]);
    return {
      duration,
      format: format.name,
      video: video ? { width: video.displayWidth, height: video.displayHeight, codec: video.codec } : null,
      audio: audio ? { codec: audio.codec, channels: audio.numberOfChannels, sampleRate: audio.sampleRate } : null,
    };
  } catch {
    throw new Error("This file isn't a video or audio format the browser can read (try MP4, MOV, WebM, MKV, MP3, M4A, WAV, OGG or FLAC).");
  } finally {
    input.dispose();
  }
}

export type AudioTarget = "mp3" | "m4a" | "wav" | "ogg" | "flac";
export type VideoTarget = "mp4" | "webm" | "mov" | "mkv";
export type QualityLevel = "low" | "medium" | "high" | "very-high";

export const AUDIO_TARGETS: Record<AudioTarget, { label: string; ext: string; mime: string }> = {
  mp3: { label: "MP3", ext: "mp3", mime: "audio/mpeg" },
  m4a: { label: "M4A (AAC)", ext: "m4a", mime: "audio/mp4" },
  wav: { label: "WAV (lossless, large)", ext: "wav", mime: "audio/wav" },
  ogg: { label: "OGG (Opus)", ext: "ogg", mime: "audio/ogg" },
  flac: { label: "FLAC (lossless)", ext: "flac", mime: "audio/flac" },
};

export const VIDEO_TARGETS: Record<VideoTarget, { label: string; ext: string; mime: string }> = {
  mp4: { label: "MP4 (plays everywhere)", ext: "mp4", mime: "video/mp4" },
  webm: { label: "WebM", ext: "webm", mime: "video/webm" },
  mov: { label: "MOV", ext: "mov", mime: "video/quicktime" },
  mkv: { label: "MKV", ext: "mkv", mime: "video/x-matroska" },
};

async function outputFormat(target: AudioTarget | VideoTarget): Promise<OutputFormat> {
  const mb = await loadMediabunny();
  switch (target) {
    case "mp3":
      await ensureMp3Encoder();
      return new mb.Mp3OutputFormat();
    case "m4a":
      return new mb.Mp4OutputFormat({ fastStart: "in-memory" });
    case "wav":
      return new mb.WavOutputFormat();
    case "ogg":
      return new mb.OggOutputFormat();
    case "flac":
      return new mb.FlacOutputFormat();
    case "mp4":
      return new mb.Mp4OutputFormat({ fastStart: "in-memory" });
    case "webm":
      return new mb.WebMOutputFormat();
    case "mov":
      return new mb.MovOutputFormat({ fastStart: "in-memory" });
    case "mkv":
      return new mb.MkvOutputFormat();
  }
}

async function quality(level: QualityLevel): Promise<Quality> {
  const mb = await loadMediabunny();
  return { low: mb.QUALITY_LOW, medium: mb.QUALITY_MEDIUM, high: mb.QUALITY_HIGH, "very-high": mb.QUALITY_VERY_HIGH }[level];
}

export type Job = {
  /** 0..1 */
  onProgress?: (progress: number) => void;
  /** Lets the caller keep a handle to cancel the running conversion */
  onStart?: (cancel: () => void) => void;
};

export type ConvertOptions = Job & {
  file: Blob;
  target: AudioTarget | VideoTarget;
  trim?: { start?: number; end?: number };
  audio?: { discard?: boolean; bitrate?: number; quality?: QualityLevel; channels?: number };
  video?: {
    maxHeight?: number;
    quality?: QualityLevel;
    bitrate?: number;
    frameRate?: number;
    forceTranscode?: boolean;
  };
  /** false = re-encode everything (frame-exact trims); default copies streams where possible (fast) */
  copy?: boolean;
  /** Default true: switch to the most widely playable codecs for the container. false keeps the source codecs (e.g. when trimming). */
  compatible?: boolean;
};

const PREFERRED_CODECS: Partial<Record<AudioTarget | VideoTarget, { video: VideoCodec[]; audio: AudioCodec[] }>> = {
  mp4: { video: ["avc", "hevc", "vp9", "av1"], audio: ["aac", "opus"] },
  mov: { video: ["avc", "hevc", "vp9", "av1"], audio: ["aac", "opus"] },
  m4a: { video: [], audio: ["aac", "opus"] },
  webm: { video: ["vp9", "vp8", "av1"], audio: ["opus", "vorbis"] },
};

export async function convertMedia(opts: ConvertOptions): Promise<Blob> {
  if (!webCodecsSupported()) {
    throw new Error("This browser can't process video. Use the latest Chrome, Edge or Firefox, or Safari 17+.");
  }
  const mb = await loadMediabunny();
  const input: Input = await openInput(opts.file);
  try {
    const isAudioTarget = opts.target in AUDIO_TARGETS;
    const format = await outputFormat(opts.target);
    const output = new mb.Output({ format, target: new mb.BufferTarget() });
    const videoTrack = await input.getPrimaryVideoTrack();
    const audioQuality = opts.audio?.quality ? await quality(opts.audio.quality) : undefined;
    const videoQuality = opts.video?.quality ? await quality(opts.video.quality) : undefined;

    // Only shrink: never upscale a 480p clip to "720p"
    let height: number | undefined;
    if (videoTrack && opts.video?.maxHeight && videoTrack.displayHeight > opts.video.maxHeight) {
      height = Math.round(opts.video.maxHeight / 2) * 2;
    }

    // Pick codecs every player understands (H.264 + AAC in MP4) instead of copying e.g. VP8 into an MP4.
    // Streams that already use the chosen codec are still copied without re-encoding.
    let videoCodec: VideoCodec | undefined;
    let audioCodec: AudioCodec | undefined;
    if (opts.compatible !== false) {
      const prefs = PREFERRED_CODECS[opts.target];
      if (prefs && videoTrack && !isAudioTarget) {
        const outHeight = height ?? videoTrack.displayHeight;
        const outWidth = Math.round(((videoTrack.displayWidth / videoTrack.displayHeight) * outHeight) / 2) * 2;
        videoCodec = (await mb.getFirstEncodableVideoCodec(prefs.video, { width: outWidth, height: outHeight })) ?? undefined;
      }
      if (prefs) audioCodec = (await mb.getFirstEncodableAudioCodec(prefs.audio)) ?? undefined;
    }

    const conversion = await mb.Conversion.init({
      input,
      output,
      tracks: "primary",
      showWarnings: false,
      trim: opts.trim,
      copy: opts.copy === false ? false : { boundaryPolicy: "expand" },
      video: isAudioTarget
        ? { discard: true }
        : {
            height,
            codec: videoCodec,
            quality: videoQuality,
            bitrate: opts.video?.bitrate,
            frameRate: opts.video?.frameRate,
            forceTranscode: opts.video?.forceTranscode,
          },
      audio: opts.audio?.discard
        ? { discard: true }
        : {
            codec: audioCodec,
            quality: audioQuality,
            bitrate: opts.audio?.bitrate,
            numberOfChannels: opts.audio?.channels,
            forceTranscode: opts.audio?.bitrate !== undefined || undefined,
          },
    });

    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks.map((d) => d.reason).join(", ");
      if (/no_encodable|undecodable|unknown_source_codec/.test(reasons)) {
        throw new Error("Your browser can't decode or encode this file's codec. Try another output format or a different browser (Chrome works best).");
      }
      throw new Error(isAudioTarget ? "This file has no audio track." : "This file has no video or audio that can be converted.");
    }

    opts.onStart?.(() => void conversion.cancel());
    conversion.onProgress = (p) => opts.onProgress?.(p);
    await conversion.execute();
    const buffer = (output.target as InstanceType<typeof mb.BufferTarget>).buffer;
    if (!buffer) throw new Error("Conversion produced no output.");
    const mime = (isAudioTarget ? AUDIO_TARGETS[opts.target as AudioTarget] : VIDEO_TARGETS[opts.target as VideoTarget]).mime;
    return new Blob([buffer], { type: mime });
  } catch (e) {
    if (e instanceof mb.ConversionCanceledError) throw new Error("Canceled.");
    throw e;
  } finally {
    input.dispose();
  }
}

export type GifOptions = Job & {
  file: Blob;
  start: number;
  end: number;
  width: number;
  fps: number;
};

/** Decode frames with WebCodecs and encode them into an animated GIF (gifenc, one palette per frame). */
export async function videoToGif(opts: GifOptions): Promise<Blob> {
  if (!webCodecsSupported()) throw new Error("This browser can't decode video. Use the latest Chrome, Edge or Firefox.");
  const mb = await loadMediabunny();
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const input = await openInput(opts.file);
  let canceled = false;
  opts.onStart?.(() => (canceled = true));
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error("This file has no video.");
    if (!(await track.canDecode())) throw new Error("Your browser can't decode this video's codec.");
    const width = Math.min(opts.width, track.displayWidth);
    const height = Math.max(2, Math.round((width / track.displayWidth) * track.displayHeight));
    const sink = new mb.CanvasSink(track, { width, height, fit: "fill" });

    const step = 1 / opts.fps;
    const times: number[] = [];
    for (let t = opts.start; t < opts.end; t += step) times.push(t);

    const gif = GIFEncoder();
    const delay = Math.round(1000 / opts.fps);
    let i = 0;
    for await (const wrapped of sink.canvasesAtTimestamps(times)) {
      if (canceled) throw new Error("Canceled.");
      i++;
      if (!wrapped) continue;
      const ctx = wrapped.canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
      const { data } = ctx.getImageData(0, 0, width, height);
      const palette = quantize(data, 256);
      gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay });
      opts.onProgress?.(i / times.length);
    }
    gif.finish();
    return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
  } finally {
    input.dispose();
  }
}

/** Video bitrate (bps) that makes the output land just under `targetBytes`, leaving room for audio and container overhead. */
export function bitrateForSize(targetBytes: number, durationSec: number, audioBitrate: number) {
  const totalBits = targetBytes * 8 * 0.94;
  return Math.max(100_000, Math.floor(totalBits / Math.max(durationSec, 0.1) - audioBitrate));
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = sec.toFixed(1).padStart(4, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1:23.5", "83.5", "1:02:03" → seconds (NaN when invalid). */
export function parseTime(value: string) {
  const parts = value.trim().split(":").map(Number);
  if (!parts.length || parts.some((p) => !Number.isFinite(p) || p < 0)) return NaN;
  return parts.reduce((total, p) => total * 60 + p, 0);
}
