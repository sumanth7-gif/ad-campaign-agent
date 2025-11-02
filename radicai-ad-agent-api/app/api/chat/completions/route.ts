import { NextRequest, NextResponse } from "next/server";
import { generatePlanFromBrief } from "@/lib/agent";
import { BriefSchema } from "@/lib/schemas";

export const runtime = "nodejs";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", process.env.CORS_ALLOW_ORIGIN || "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate early to return helpful error
    BriefSchema.parse(body);
    const plan = await generatePlanFromBrief(body);
    return withCors(NextResponse.json(plan));
  } catch (err: any) {
    return withCors(NextResponse.json({ error: err?.message || "Unknown error" }, { status: 400 }));
  }
}

