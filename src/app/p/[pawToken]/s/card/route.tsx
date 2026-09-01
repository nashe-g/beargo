import { ImageResponse } from "next/og";
import { ShareCardArt } from "@/components/share/ShareCardArt";
import { getPaw } from "@/lib/paws";
import { parseShareCard } from "@/lib/share-card";

export const size = {
  width: 1200,
  height: 630,
};

export async function GET(
  request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  const { pawToken } = await context.params;
  const paw = await getPaw(pawToken);
  const stats = parseShareCard(
    Object.fromEntries(new URL(request.url).searchParams),
  );

  return new ImageResponse(
    <ShareCardArt host={paw.hostDisplayName} stats={stats} />,
    size,
  );
}
