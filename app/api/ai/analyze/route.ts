import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getAuthUser, getProfile, getSupabase } from "@/lib/auth";
import { buildExecutiveSnapshot } from "@/lib/ai/executiveSnapshot";
import { getPresetById } from "@/lib/ai/presets";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Current Google AI Studio Flash model available to this API key. */
const GEMINI_MODEL = "gemini-3.5-flash-lite";

const DENIED = "Access Denied: Fitur ini hanya untuk Admin";

type AnalyzeBody = {
  prompt?: string;
  presetId?: string;
};

function getGoogleApiKey(): string | null {
  const raw =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GEMINI_API_KEY ??
    "";
  const key = raw.trim().replace(/^["']|["']$/g, "");
  return key.length > 0 ? key : null;
}

function buildSystemPrompt(snapshotJson: string) {
  return `You are the AI Business Executive Assistant for Enercon Sales Tracker.
Audience: company administrators / business executives in Indonesia.
Respond in clear professional Bahasa Indonesia (unless the user asks otherwise).
Be concise, decision-oriented, and grounded ONLY in the provided CRM snapshot JSON.
Do not invent deals, people, or numbers that are not in the snapshot.
Do NOT dump or reprint the raw JSON. Write an analysis report in prose and bullet points.
If data is insufficient, say what is missing and still give the best possible recommendation.
Prefer short sections with bullets, then a clear "Rekomendasi manajemen" closing.
Currency values in the snapshot are IDR.

CRM SNAPSHOT JSON:
${snapshotJson}`;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile();
    if (profile?.role?.toLowerCase() !== "admin") {
      return Response.json({ error: DENIED }, { status: 403 });
    }

    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      return Response.json(
        {
          error:
            "GOOGLE_GENERATIVE_AI_API_KEY belum tersedia di runtime. Setelah menambahkannya di Vercel → Settings → Environment Variables, lakukan Redeploy (Deployments → ⋯ → Redeploy) agar key ikut ke production.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as AnalyzeBody;
    const preset = getPresetById(body.presetId);
    const prompt = (body.prompt?.trim() || preset?.prompt || "").trim();

    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const safePrompt = prompt.slice(0, 4000);

    const supabase = await getSupabase();
    const snapshot = await buildExecutiveSnapshot(supabase);
    const snapshotJson = JSON.stringify(snapshot);

    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google(GEMINI_MODEL),
      system: buildSystemPrompt(snapshotJson),
      prompt: safePrompt,
      temperature: 0.35,
      maxTokens: 4096,
    });

    // Surface provider errors into the HTTP stream instead of a silent close
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ai/analyze]", err);
    return Response.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
