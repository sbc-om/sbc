import { createUserNotification } from "@/lib/db/notifications";
import { listUsers } from "@/lib/db/users";

export async function notifyAdminsAboutSubmission(input: {
  kind: "news" | "product" | "story";
  businessId: string;
  businessName: { en?: string; ar?: string };
  actorUserId: string;
}) {
  const admins = (await listUsers(true)).filter((user) => user.role === "admin" && !user.isArchived);
  if (admins.length === 0) return;

  const businessLabel = input.businessName.en || input.businessName.ar || "Business";
  const titleByKind = {
    news: "New business news awaiting review",
    product: "New business product awaiting review",
    story: "New business story awaiting review",
  } as const;

  const hrefByKind = {
    news: "/admin/moderation/news",
    product: "/admin/moderation/products",
    story: "/admin/moderation/stories",
  } as const;

  const body = `${businessLabel} submitted ${input.kind} content for moderation.`;

  await Promise.all(
    admins.map((admin) =>
      createUserNotification({
        userId: admin.id,
        type: "moderation_submission",
        title: titleByKind[input.kind],
        body,
        href: hrefByKind[input.kind],
        actorUserId: input.actorUserId,
        businessId: input.businessId,
      })
    )
  );
}
