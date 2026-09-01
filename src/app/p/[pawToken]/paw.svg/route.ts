import { CANONICAL_ORIGIN, pawScanUrl, publicOrigin } from "@/lib/config";
import { getPaw } from "@/lib/paws";
import { parsePawFill, pawQrSvg } from "@/lib/paw-svg";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const query = new URL(request.url).searchParams;
  const fill = parsePawFill(query.get("fill"));
  const origin =
    query.get("src") === "local" ? publicOrigin(request) : CANONICAL_ORIGIN;
  const svg = pawQrSvg(pawScanUrl(paw.token, origin), fill);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="beargo-${paw.token}.svg"`,
      "Cache-Control": "no-store",
    },
  });
}
