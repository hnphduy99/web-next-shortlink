# Hướng Dẫn Viết Unit Test và Integration Test

Dự án này sử dụng framework [Vitest](https://vitest.dev/) kết hợp với React Testing Library để chạy bộ test với hiệu năng nhanh và syntax giống hệt Jest.

## 1. Các lệnh cơ bản

```bash
# Chạy toàn bộ test 1 lần (dùng cho quy trình build / CI/CD)
npm test

# Chạy test trong chế độ Watch (tự động chạy lại test ngay khi bạn lưu file code)
npm run test:watch
```

---

## 2. Cấu trúc thư mục

Tất cả các file test (mang hậu tố `.test.ts` hoặc `.test.tsx`) nên được đặt bên trong thư mục `__tests__/` ở thư mục gốc, và tạo cấu trúc cây thư mục bên trong tương đồng với code thật để dễ dàng đối chiếu.

```text
├── app/
│   └── actions/
│       └── link.ts           <-- Code thật
├── components/
│   └── link-table.tsx
├── __tests__/
│   ├── app/
│   │   └── actions/
│   │       └── link.test.ts  <-- File test tương ứng
│   ├── components/
│   │   └── link-table-helpers.test.ts
│   └── lib/
│       └── short-link.test.ts
```

---

## 3. Cách viết Unit Test (Logic Độc Lập)

**Unit Test** nhắm tới các hàm logic "thuần" (Pure Functions). Đây là những hàm không gắn với Database, không gọi API, không cần quyền Auth... Nó chỉ nhận đầu vào `input` và đầu ra `output`.

Ví dụ về file `__tests__/lib/short-link.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { normalizeShortCode } from "@/lib/short-link";

// describe: Gom nhóm các bài test liên quan đến chung một hàm / chức năng
describe("normalizeShortCode", () => {
  // it/test: Định nghĩa kịch bản thực tế
  // (Đọc giống như: "It should return empty string when value is undefined")
  it("trả về chuỗi rỗng khi value là undefined", () => {
    // Gọi hàm normalizeShortCode và "expect" (mong chờ) nó sẽ "toBe" (bằng) chuỗi rỗng
    expect(normalizeShortCode(undefined)).toBe("");
  });

  it("xóa dấu gạch chéo ở cuối", () => {
    expect(normalizeShortCode("abc/")).toBe("abc");
  });
});
```

> 💡 **Kinh nghiệm viết Unit Test trong Next.js:**
> Đôi khi server component có đoạn code tính toán/format dữ liệu khá cồng kềnh. Để test dễ dàng, ta không cần phải test nguyên cả cái Component mà chỉ cần tách đoạn tính toán đó thành một hàm nhỏ (Helper function), đưa ra ngoài component hoặc chuyển qua thư mục `/lib`, sau đó gọi Unit Test thẳng trên hàm đó (Ví dụ: Các hàm `getPageParam`, `buildPageHref` đã được extract ra riêng để test ở các file helpers test).

---

## 4. Cách viết Integration Test (Có Database & Auth)

Đối với các `Server Actions` chứa những hàm tương tác với bên ngoài (Ví dụ: **lưu data tạo Link mới, lấy session User từ Supabase**), chúng ta **không nên chọc vào cục Database thật**. Nó sẽ làm chậm quá trình test và sinh ra dữ liệu rác.

Ta sẽ sử dụng kỹ thuật **Mock (Làm giả)** do thư viện `vitest` cung cấp để _cướp quyền điều khiển_ các module hệ thống và bắt chúng trả về kết quả giả định.

Ví dụ ở file `__tests__/app/actions/link.test.ts`, ta đang giả lập **Prisma** và **Supabase**:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createLink } from "@/app/actions/link";
import { prisma } from "@/lib/prisma"; // Sẽ tự động gọi tới mock ở dưới

// 🥷 BƯỚC 1: MOCK Prisma -> Để chặn không cho gọi DB thật
vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: { findUnique: vi.fn(), create: vi.fn() },
    user: { upsert: vi.fn() }
  }
}));

// 🥷 BƯỚC 2: MOCK Supabase -> Chặn bước kiểm tra login thật và cho phép nhét user ảo
const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: { getClaims: mockGetClaims }
  }))
}));

// Bắt đầu viết kịch bản
describe("Integration: Tạo Link", () => {
  // Clear mock history sau mỗi kịch bản để tránh bị lỗi data chồng chéo
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // KỊCH BẢN THỬ NGHIỆM
  it("thành công khi user đã login và slug chưa bị ai lấy", async () => {
    // 🚦 Arrange (Sắp đặt cạm bẫy mock)
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "auth-123" } }
    });
    (prisma.link.findUnique as any).mockResolvedValue(null); // Giả vờ Database không có ai đang dùng Slug này
    (prisma.link.create as any).mockResolvedValue({ shortCode: "123" }); // Giả vờ DB đã tạo xong

    // 🚀 Act (Kích hoạt chạy hàm THẬT)
    const result = await createLink({ url: "google.com", slug: "123" });

    // ✅ Assert (So sánh đối chứng kết quả)
    expect(result.error).toBeUndefined(); // Chắc chắn không có thông báo lỗi
    expect(result.data?.shortCode).toBe("123");

    // Chứng minh rằng lệnh prisma.create thực sự đã được Action gọi vào để lưu DB
    expect(prisma.link.create).toHaveBeenCalled();
  });
});
```

---

## 5. Các hàm Assertion (So sánh) thông dụng

Bạn sẽ dùng các hàm này rất nhiều đằng sau Object `expect()`

- **Lý thuyết giá trị:**
  - `expect(x).toBe(y)`: So sánh 2 biến cùng type, cùng giá trị nguyên thuỷ bằng nhau. VD: Chuỗi, số, true/false. (Tương đương thuật toán `===`)
  - `expect(x).toEqual(y)`: So sánh cấu trúc lõi của Array/Object.
  - `expect(x).toBeUndefined()`, `.toBeNull()`: Kiểm tra giá trị rỗng/mắc lỗi.

- **Check Spy / Mock Functions:**
  - `expect(myFunction).toHaveBeenCalled()`: Giúp bạn check xem một hàm (mình đã viết) có thực sự vừa được kích hoạt khi code chạy ngang qua hay không.
  - `expect(myFunction).toHaveBeenCalledWith({ tham: số, ... })`: Chứng minh code không những gọi hàm đó, mà còn truyền đúng cái parameter như thiết kế.
