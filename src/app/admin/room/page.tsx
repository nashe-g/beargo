import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { listModeratedPosts } from "@/lib/feed-store";
import { isoRequired } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminRoomPage() {
  await requireAdmin();
  const posts = await listModeratedPosts();

  return (
    <AdminShell current="/admin/room">
      <h1 className="font-display text-4xl">Room</h1>
      <p className="mt-3 text-ink-soft">
        Venue thread. Hosts cannot delete criticism. Hidden posts were
        auto-removed after reports; blocked never went public.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">When</th>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Handle</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 font-normal">Post</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-ink/10 align-top">
                <td className="py-3 font-mono text-xs text-ink-soft">
                  {isoRequired(post.createdAt).replace("T", " ").slice(0, 16)}
                </td>
                <td className="py-3">{post.hostId}</td>
                <td className="py-3">{post.handleSnapshot}</td>
                <td className="py-3">
                  <StatusPill status={post.status} />
                </td>
                <td className="max-w-sm py-3">{post.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
