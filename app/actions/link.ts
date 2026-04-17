"use server";

import { normalizeOriginalUrl, normalizeShortCode } from "@/lib/short-link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function generateShortCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null
  };
}

export async function createLink(data: { url: string; slug?: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Bạn cần đăng nhập để tạo link." };
  }

  const shortCode = normalizeShortCode(data.slug) || generateShortCode();
  let originalUrl: string;

  try {
    originalUrl = normalizeOriginalUrl(data.url);
  } catch {
    return { error: "URL không hợp lệ. Vui lòng nhập đầy đủ domain hoặc link hợp lệ." };
  }

  // Check if shortCode already exists
  const existing = await prisma.link.findUnique({
    where: { shortCode }
  });

  if (existing) {
    return { error: "Slug đã tồn tại. Vui lòng chọn slug khác." };
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email
    }
  });

  const link = await prisma.link.create({
    data: {
      shortCode,
      originalUrl,
      userId: user.id
    }
  });

  revalidatePath("/");

  return { data: link };
}

export async function getLinks({
  page = 1,
  pageSize = 10
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      links: [],
      page: 1,
      pageSize,
      totalCount: 0,
      totalPages: 0
    };
  }

  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10;
  const where = { userId: user.id };
  const totalCount = await prisma.link.count({ where });
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / safePageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(safePage, totalPages);
  const links = await prisma.link.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * safePageSize,
    take: safePageSize
  });

  return {
    links,
    page: currentPage,
    pageSize: safePageSize,
    totalCount,
    totalPages
  };
}

export async function updateLink(id: string, data: { url: string; slug?: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Bạn cần đăng nhập để sửa link." };
  }

  const existingLink = await prisma.link.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!existingLink) {
    return { error: "Không tìm thấy link của bạn để sửa." };
  }

  const shortCode = normalizeShortCode(data.slug) || existingLink.shortCode;
  let originalUrl: string;

  try {
    originalUrl = normalizeOriginalUrl(data.url);
  } catch {
    return { error: "URL không hợp lệ. Vui lòng nhập đầy đủ domain hoặc link hợp lệ." };
  }

  const duplicate = await prisma.link.findFirst({
    where: {
      shortCode,
      NOT: {
        id
      }
    }
  });

  if (duplicate) {
    return { error: "Slug đã tồn tại. Vui lòng chọn slug khác." };
  }

  const link = await prisma.link.update({
    where: { id },
    data: {
      shortCode,
      originalUrl
    }
  });

  revalidatePath("/");

  return { data: link };
}

export async function deleteLink(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Bạn cần đăng nhập để xóa link." };
  }

  const deleted = await prisma.link.deleteMany({
    where: {
      id,
      userId: user.id
    }
  });

  if (deleted.count === 0) {
    return { error: "Không tìm thấy link của bạn để xóa." };
  }

  revalidatePath("/");

  return { success: true };
}
