import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "percentiles", "v0_1_0.json");
    let file = await readFile(filePath, "utf8");
    // Strip BOM if present
    if (file.charCodeAt(0) === 0xFEFF) file = file.slice(1);

    const json = JSON.parse(file);
    return NextResponse.json(json, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("percentiles GET error:", err);
    return NextResponse.json(
      { error: "Percentiles dataset not found", details: String(err) },
      { status: 500 }
    );
  }
}
