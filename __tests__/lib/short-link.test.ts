import { normalizeOriginalUrl, normalizeShortCode } from "@/lib/short-link";
import { describe, expect, it } from "vitest";

// ─────────────────────────────────────────────
// normalizeShortCode
// ─────────────────────────────────────────────
describe("normalizeShortCode", () => {
  it("trả về chuỗi rỗng khi value là undefined", () => {
    expect(normalizeShortCode(undefined)).toBe("");
  });

  it("cắt whitespace đầu cuối", () => {
    expect(normalizeShortCode("  my-slug  ")).toBe("my-slug");
  });

  it("xóa dấu slash ở đầu chuỗi", () => {
    expect(normalizeShortCode("/my-slug")).toBe("my-slug");
  });

  it("xóa dấu slash ở cuối chuỗi", () => {
    expect(normalizeShortCode("my-slug/")).toBe("my-slug");
  });

  it("xóa nhiều dấu slash ở đầu và cuối chuỗi", () => {
    expect(normalizeShortCode("///my-slug///")).toBe("my-slug");
  });

  it("giữ nguyên slug hợp lệ", () => {
    expect(normalizeShortCode("abc123")).toBe("abc123");
  });

  it("trả về chuỗi rỗng khi chỉ có dấu slash", () => {
    expect(normalizeShortCode("///")).toBe("");
  });

  it("trả về chuỗi rỗng khi value là chuỗi rỗng", () => {
    expect(normalizeShortCode("")).toBe("");
  });
});

// ─────────────────────────────────────────────
// normalizeOriginalUrl
// ─────────────────────────────────────────────
describe("normalizeOriginalUrl", () => {
  it("giữ nguyên URL đã có https://", () => {
    expect(normalizeOriginalUrl("https://example.com")).toBe("https://example.com/");
  });

  it("giữ nguyên URL đã có http://", () => {
    expect(normalizeOriginalUrl("http://example.com")).toBe("http://example.com/");
  });

  it("tự động thêm https:// khi URL không có protocol", () => {
    expect(normalizeOriginalUrl("example.com")).toBe("https://example.com/");
  });

  it("cắt whitespace đầu cuối trước khi xử lý", () => {
    expect(normalizeOriginalUrl("  https://example.com  ")).toBe("https://example.com/");
  });

  it("hỗ trợ URL có path", () => {
    expect(normalizeOriginalUrl("example.com/some/path")).toBe("https://example.com/some/path");
  });

  it("hỗ trợ URL có query string", () => {
    expect(normalizeOriginalUrl("https://example.com/page?foo=bar")).toBe("https://example.com/page?foo=bar");
  });

  it("hỗ trợ protocol tuỳ chỉnh như ftp://", () => {
    expect(normalizeOriginalUrl("ftp://files.example.com")).toBe("ftp://files.example.com/");
  });

  it("ném lỗi khi URL hoàn toàn không hợp lệ", () => {
    expect(() => normalizeOriginalUrl("not a valid url ###")).toThrow();
  });
});
