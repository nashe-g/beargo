import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ pawToken: string }> },
) {
  const { pawToken } = await context.params;
  redirect(`/p/${pawToken}`);
}
