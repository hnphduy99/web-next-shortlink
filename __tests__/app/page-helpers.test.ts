import { describe, expect, it } from "vitest";

// ─────────────────────────────────────────────
// Các helper function được extract từ app/page.tsx
// để có thể unit-test độc lập (không cần render RSC)
// ─────────────────────────────────────────────

function getPageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function getPageSizeParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (parsed === 10 || parsed === 20 || parsed === 50) {
    return parsed;
  }

  return 10;
}

// ─────────────────────────────────────────────
// getPageParam
// ─────────────────────────────────────────────
describe("getPageParam", () => {
  it("trả về 1 khi value là undefined", () => {
    expect(getPageParam(undefined)).toBe(1);
  });

  it("trả về 1 khi value là chuỗi rỗng", () => {
    expect(getPageParam("")).toBe(1);
  });

  it("trả về 1 khi value không phải số", () => {
    expect(getPageParam("abc")).toBe(1);
  });

  it("trả về 1 khi value là 0", () => {
    expect(getPageParam("0")).toBe(1);
  });

  it("trả về 1 khi value là số âm", () => {
    expect(getPageParam("-5")).toBe(1);
  });

  it("chuyển đổi chuỗi số hợp lệ thành number", () => {
    expect(getPageParam("3")).toBe(3);
  });

  it("làm tròn xuống khi là số thập phân", () => {
    expect(getPageParam("2.9")).toBe(2);
  });

  it("lấy phần tử đầu khi value là mảng", () => {
    expect(getPageParam(["5", "999"])).toBe(5);
  });

  it("trả về 1 khi mảng rỗng", () => {
    expect(getPageParam([])).toBe(1);
  });

  it("trả về 1 khi value là NaN", () => {
    expect(getPageParam("NaN")).toBe(1);
  });

  it("trả về 1 khi value là Infinity", () => {
    expect(getPageParam("Infinity")).toBe(1);
  });
});

// ─────────────────────────────────────────────
// getPageSizeParam
// ─────────────────────────────────────────────
describe("getPageSizeParam", () => {
  it("trả về 10 khi value là undefined", () => {
    expect(getPageSizeParam(undefined)).toBe(10);
  });

  it("trả về 10 khi value hợp lệ là '10'", () => {
    expect(getPageSizeParam("10")).toBe(10);
  });

  it("trả về 20 khi value hợp lệ là '20'", () => {
    expect(getPageSizeParam("20")).toBe(20);
  });

  it("trả về 50 khi value hợp lệ là '50'", () => {
    expect(getPageSizeParam("50")).toBe(50);
  });

  it("trả về 10 (default) khi value không thuộc [10,20,50]", () => {
    expect(getPageSizeParam("30")).toBe(10);
  });

  it("trả về 10 (default) khi value là chuỗi bất kỳ", () => {
    expect(getPageSizeParam("abc")).toBe(10);
  });

  it("trả về 10 (default) khi value là chuỗi rỗng", () => {
    expect(getPageSizeParam("")).toBe(10);
  });

  it("lấy phần tử đầu khi value là mảng hợp lệ", () => {
    expect(getPageSizeParam(["20", "50"])).toBe(20);
  });

  it("trả về 10 (default) khi mảng có giá trị không hợp lệ", () => {
    expect(getPageSizeParam(["99"])).toBe(10);
  });
});
