import { createLink } from "@/app/actions/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─────────────────────────────────────────────
// 1. MOCK CÁC DEPENDENCIES (Làm giả các thành phần bên ngoài)
// ─────────────────────────────────────────────

// Mock Prisma (Giả lập Database)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    user: {
      upsert: vi.fn()
    }
  }
}));

// Mock Supabase Server Client (Giả lập Auth)
const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getClaims: mockGetClaims
    }
  }))
}));

// Mock next/cache (Giả lập Next.js App Router cache)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

// ─────────────────────────────────────────────
// 2. VIẾT THỬ NGHIỆM (Integration Tests)
// ─────────────────────────────────────────────

describe("Integration: createLink Action", () => {
  // Chạy trước mỗi test để huỷ những kết quả giả lập từ test trước
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trả về lỗi nếu người dùng CHƯA đăng nhập", async () => {
    // Giả lập trả về user null
    mockGetClaims.mockResolvedValue({ error: null, data: { claims: null } });

    const response = await createLink({ url: "https://example.com" });

    // Kỳ vọng hàm trả về đúng thông báo lỗi
    expect(response).toEqual({ error: "Bạn cần đăng nhập để tạo link." });

    // Đảm bảo Prisma không bị gọi
    expect(prisma.link.create).not.toHaveBeenCalled();
  });

  it("trả về lỗi nếu URL gốc không hợp lệ", async () => {
    // Giả lập có user đăng nhập
    mockGetClaims.mockResolvedValue({
      error: null,
      data: { claims: { sub: "user-123", email: "test@example.com" } }
    });

    const response = await createLink({ url: "not a valid url format ###" });

    expect(response).toEqual({
      error: "URL không hợp lệ. Vui lòng nhập đầy đủ domain hoặc link hợp lệ."
    });
  });

  it("trả về lỗi nếu slug (shortCode) đã tồn tại", async () => {
    mockGetClaims.mockResolvedValue({
      error: null,
      data: { claims: { sub: "user-123", email: "test@example.com" } }
    });

    // Giả lập database trả về rằng slug này "đã có bài viết/link"
    (prisma.link.findUnique as any).mockResolvedValue({
      id: "existing-id",
      shortCode: "duplicatename"
    });

    const response = await createLink({ url: "google.com", slug: "duplicatename" });

    expect(response).toEqual({ error: "Slug đã tồn tại. Vui lòng chọn slug khác." });
  });

  it("tạo link THÀNH CÔNG, gọi DB và xoá cache Next.js", async () => {
    // 1. Giả lập mọi thứ suôn sẻ: có auth auth, không bị trùng slug
    mockGetClaims.mockResolvedValue({
      error: null,
      data: { claims: { sub: "user-123", email: "test@example.com" } }
    });

    (prisma.link.findUnique as any).mockResolvedValue(null); // Slug chưa ai dùng
    (prisma.user.upsert as any).mockResolvedValue({});
    (prisma.link.create as any).mockResolvedValue({
      id: "new-link-id",
      shortCode: "myslug",
      originalUrl: "https://google.com/",
      userId: "user-123"
    });

    // 2. Chạy hàm cần test
    const response = await createLink({ url: "google.com", slug: "myslug" });

    // 3. Kiểm chứng
    // - Lỗi phải là undefined
    expect(response.error).toBeUndefined();
    // - Dữ liệu trả về đúng như mock
    expect(response.data?.shortCode).toBe("myslug");
    // - Đảm bảo lệnh check unique DB gọi đúng tham số
    expect(prisma.link.findUnique).toHaveBeenCalledWith({
      where: { shortCode: "myslug" }
    });
    // - Đảm bảo lệnh insert DB được chạy
    expect(prisma.link.create).toHaveBeenCalled();
    // - Đảm bảo Next.js nhận được lệnh clear cache (RSC) ở trang chủ
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
