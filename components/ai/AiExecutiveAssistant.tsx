"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  Copy,
  Download,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AI_INSIGHT_PRESETS, type AiInsightPreset } from "@/lib/ai/presets";
import dynamic from "next/dynamic";

const AiMarkdownReport = dynamic(
  () => import("@/components/ai/AiMarkdownReport").then((m) => m.AiMarkdownReport),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-slate-500">Preparing report view…</p>
    ),
  }
);

const ICON_MAP: Record<AiInsightPreset["icon"], LucideIcon> = {
  users: Users,
  chart: BarChart3,
  forecast: Target,
  risk: AlertTriangle,
  strategy: Lightbulb,
};

const GEMINI_MODEL_LABEL = "gemini-3.5-flash-lite";

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

async function readErrorMessage(res: Response): Promise<string> {
  const raw = await res.text();
  try {
    const data = JSON.parse(raw) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    if (raw.trim()) return raw.trim().slice(0, 400);
  }
  if (res.status === 403) return "Access Denied: Fitur ini hanya untuk Admin";
  if (res.status === 401) return "Unauthorized — silakan login ulang.";
  return `Request failed (${res.status})`;
}

export function AiExecutiveAssistant() {
  const [draft, setDraft] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    loadingRef.current = false;
    setIsLoading(false);
  }, []);

  const runAnalysis = useCallback(async (prompt: string, presetId?: string | null) => {
    const trimmed = prompt.trim();
    if (!trimmed || loadingRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    abortRef.current = controller;
    loadingRef.current = true;

    setActivePresetId(presetId ?? null);
    setCompletion("");
    setCopied(false);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          prompt: trimmed,
          ...(presetId ? { presetId } : {}),
        }),
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) return;

      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }
      if (!res.body) {
        throw new Error("Streaming response tidak tersedia dari server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (requestId !== requestIdRef.current) return;
        text += decoder.decode(value, { stream: true });
        setCompletion(text);
      }
      text += decoder.decode();

      if (requestId !== requestIdRef.current) return;

      if (!text.trim()) {
        throw new Error(
          "Gemini mengembalikan respons kosong. Coba lagi, atau periksa model/API key di server."
        );
      }
      setCompletion(text);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      if (isAbortError(err)) {
        setErrorMessage("Analisis dibatalkan.");
        return;
      }
      const message = err instanceof Error ? err.message : "AI analysis failed";
      console.error("[AiExecutiveAssistant]", message);
      setErrorMessage(
        message.toLowerCase().includes("access denied")
          ? "Access Denied: Fitur ini hanya untuk Admin"
          : message
      );
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        abortRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  const activePreset = useMemo(
    () => AI_INSIGHT_PRESETS.find((p) => p.id === activePresetId) ?? null,
    [activePresetId]
  );

  async function handleCopy() {
    if (!completion) return;
    try {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function handleExportMarkdown() {
    if (!completion) return;
    const title = activePreset?.label ?? "Custom Analysis";
    const md = `# AI Executive Assistant Report\n\n**Focus:** ${title}\n**Generated:** ${new Date().toISOString()}\n\n---\n\n${completion}\n`;
    downloadText(`enercon-ai-analysis-${stamp()}.md`, md, "text/markdown;charset=utf-8");
  }

  function handleExportText() {
    if (!completion) return;
    downloadText(`enercon-ai-analysis-${stamp()}.txt`, completion, "text/plain;charset=utf-8");
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#0b1220] via-[#12263f] to-[#0e7490] px-5 py-5 text-white shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Bot className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/90">
                Enercon · Admin only
              </p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
                AI Executive Assistant
              </h2>
              <p className="mt-1 text-sm text-slate-200/85">
                Powered by Gemini — analisis performa, forecast, dan keputusan strategis.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-50 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            {GEMINI_MODEL_LABEL}
          </div>
        </div>
      </div>

      <section aria-label="Quick insights">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Quick Insights</h3>
            <p className="text-xs text-slate-500">
              Preset pertanyaan eksekutif — satu klik untuk analisis.
            </p>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {AI_INSIGHT_PRESETS.map((preset) => {
            const Icon = ICON_MAP[preset.icon];
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runAnalysis(preset.prompt, preset.id)}
                className={`group rounded-2xl border px-4 py-3.5 text-left transition ${
                  active
                    ? "border-cyan-300 bg-cyan-50/80 shadow-sm"
                    : "border-slate-200/90 bg-white hover:border-cyan-200 hover:bg-cyan-50/40"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      active
                        ? "bg-cyan-100 text-cyan-800 ring-cyan-200"
                        : "bg-slate-50 text-slate-600 ring-slate-200 group-hover:bg-cyan-50 group-hover:text-cyan-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{preset.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {preset.description}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
        <label htmlFor="ai-custom-prompt" className="text-sm font-semibold text-slate-900">
          Custom question
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Tanyakan apa saja tentang pipeline, target, atau strategi — AI memakai snapshot CRM terkini.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <textarea
            id="ai-custom-prompt"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Contoh: Sales mana yang paling berisiko miss target tahun ini, dan apa yang harus dilakukan minggu ini?"
            className="input-field min-h-[72px] flex-1 resize-y"
            disabled={isLoading}
          />
          <div className="flex shrink-0 flex-col gap-2 sm:w-36">
            <button
              type="button"
              disabled={isLoading || !draft.trim()}
              onClick={() => void runAnalysis(draft, null)}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Analyze
            </button>
            {isLoading ? (
              <button type="button" onClick={stop} className="btn-secondary">
                Stop
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Analysis Report</h3>
            <p className="text-xs text-slate-500">
              {activePreset
                ? activePreset.label
                : completion
                  ? "Custom analysis"
                  : "Pilih quick insight atau tulis pertanyaan"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!completion || isLoading}
              onClick={() => void handleCopy()}
              className="btn-secondary gap-1.5 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Analysis Report"}
            </button>
            <button
              type="button"
              disabled={!completion || isLoading}
              onClick={handleExportText}
              className="btn-secondary gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Text
            </button>
            <button
              type="button"
              disabled={!completion || isLoading}
              onClick={handleExportMarkdown}
              className="btn-secondary gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Markdown
            </button>
          </div>
        </div>

        <div className="min-h-[280px] px-4 py-5 sm:px-5">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading && !completion ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Menyiapkan analisis…</p>
                <p className="mt-1 text-xs text-slate-500">
                  Mengambil snapshot CRM dan meminta insight dari Gemini.
                </p>
              </div>
            </div>
          ) : null}

          {!isLoading && !completion && !errorMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Belum ada laporan</p>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Mulai dari Quick Insights di atas. Jawaban akan muncul di sini secara streaming.
                </p>
              </div>
            </div>
          ) : null}

          {completion ? (
            <AiMarkdownReport content={completion} streaming={isLoading} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
