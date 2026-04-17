import { prisma } from "@/lib/prisma";
import { normalizeOriginalUrl } from "@/lib/short-link";
import { notFound, redirect } from "next/navigation";

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const link = await prisma.link.findUnique({
    where: { shortCode: slug }
  });

  if (!link) {
    notFound();
  }

  let destination: string;

  try {
    destination = normalizeOriginalUrl(link.originalUrl);
  } catch {
    notFound();
  }

  // Increment click counter asynchronously - don't block the redirect.
  void prisma.link
    .update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    })
    .catch(() => {
      // Non-critical: silently ignore click count failures
    });

  redirect(destination);
}
