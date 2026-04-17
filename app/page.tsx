import { getLinks } from "@/app/actions/link";
import { AuthButton } from "@/components/auth-button";
import CreateLinkForm from "@/components/create-link-form";
import { EnvVarWarning } from "@/components/env-var-warning";
import LinkTable from "@/components/link-table";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageReveal from "@/components/ui/page-reveal";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

function getPageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function getPageSizeParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (parsed === 10 || parsed === 20 || parsed === 50) {
    return parsed;
  }

  return 10;
}

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[]; pageSize?: string | string[] }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const { page: currentPageParam, pageSize: currentPageSizeParam } = await searchParams;
  const currentPage = getPageParam(currentPageParam);
  const currentPageSize = getPageSizeParam(currentPageSizeParam);
  const { links, page, pageSize, totalCount, totalPages } = await getLinks({
    page: currentPage,
    pageSize: currentPageSize
  });

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-5">
        <nav className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
            <div className="flex items-center gap-5 font-bold">
              <Link href={"/"}>Rút gọn link</Link>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
        <main className="w-full max-w-5xl flex-1 p-5">
          {isAuthenticated ? (
            <PageReveal className="flex flex-col gap-9">
              <CreateLinkForm />
              <LinkTable
                links={links}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
              />
            </PageReveal>
          ) : (
            <PageReveal>
              <Card>
                <CardHeader>
                  <CardTitle>Đăng nhập để quản lý link của bạn</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Mỗi link sẽ được gắn với đúng tài khoản tạo ra nó, và chỉ tài khoản đó mới thấy danh sách link của
                  mình.
                </CardContent>
              </Card>
            </PageReveal>
          )}
        </main>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-4 text-center text-xs">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
