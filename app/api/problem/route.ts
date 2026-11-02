import { getProblem } from "@/lib/leetcode";
import { toErrorResponse } from "@/lib/normalise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  try {
    const problem = await getProblem(q);
    return Response.json({ problem }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
