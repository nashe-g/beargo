export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ error: "Sit a table." }, { status: 410 });
}
