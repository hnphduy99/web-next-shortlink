import { describe, expect, it } from "vitest";

// ─────────────────────────────────────────────
// buildPageHref — extract từ components/link-table.tsx
// ─────────────────────────────────────────────

function buildPageHref(page: number, pageSize: number): string {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== 10) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────
describe("buildPageHref", () => {
  it('trả về "/" khi page=1 và pageSize=10 (giá trị mặc định)', () => {
    expect(buildPageHref(1, 10)).toBe("/");
  });

  it("thêm query ?page=N khi page > 1", () => {
    expect(buildPageHref(2, 10)).toBe("/?page=2");
  });

  it("thêm query ?pageSize=N khi pageSize khác 10", () => {
    expect(buildPageHref(1, 20)).toBe("/?pageSize=20");
  });

  it("thêm cả page và pageSize vào query khi cả hai khác default", () => {
    const href = buildPageHref(3, 50);
    expect(href).toContain("page=3");
    expect(href).toContain("pageSize=50");
    expect(href.startsWith("/?")).toBe(true);
  });

  it('trả về "/" khi pageSize=10 và page=1 (pageSize=10 là default, bỏ qua)', () => {
    expect(buildPageHref(1, 10)).toBe("/");
  });

  it("xử lý pageSize=50 với page=1 đúng cách", () => {
    expect(buildPageHref(1, 50)).toBe("/?pageSize=50");
  });

  it("page=2 với pageSize=20 tạo URL đầy đủ", () => {
    const href = buildPageHref(2, 20);
    expect(href).toBe("/?page=2&pageSize=20");
  });
});
