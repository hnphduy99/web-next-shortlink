"use client";

import { deleteLink, updateLink } from "@/app/actions/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Pencil, Trash2, X } from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import CopyButton from "./copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type LinkRow = {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: Date;
};

function buildPageHref(page: number, pageSize: number) {
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

export default function LinkTable({
  links,
  page,
  pageSize,
  totalCount,
  totalPages
}: {
  links: LinkRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}) {
  const [isPending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [deletingLink, setDeletingLink] = useState<LinkRow | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function startEditing(link: LinkRow) {
    setEditingId(link.id);
    setEditUrl(link.originalUrl);
    setEditSlug(link.shortCode);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditUrl("");
    setEditSlug("");
  }

  function handleUpdate(id: string) {
    startTransition(async () => {
      const result = await updateLink(id, {
        url: editUrl,
        slug: editSlug
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Cập nhật link thành công!");
      cancelEditing();
    });
  }

  function handleDelete() {
    if (!deletingLink) {
      return;
    }

    startTransition(async () => {
      const result = await deleteLink(deletingLink.id);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã xóa link thành công!");
      setDeletingLink(null);
    });
  }

  function handlePageSizeChange(nextPageSize: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPageSize === 10) {
      params.delete("pageSize");
    } else {
      params.set("pageSize", String(nextPageSize));
    }

    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = totalCount === 0 ? 0 : startIndex + links.length - 1;
  const visiblePages = Array.from(
    new Set([1, Math.max(1, page - 1), page, Math.min(totalPages, page + 1), totalPages].filter((value) => value >= 1))
  );
  const rowTransition = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" as const };

  return (
    <>
      <motion.div
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Danh sách link rút gọn</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>URL rút gọn</TableHead>
                  <TableHead>URL gốc</TableHead>
                  <TableHead>Số lần click</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Chưa có link nào được tạo.
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence initial={false} mode="popLayout">
                    {links.map((link, index) => (
                      <motion.tr
                        key={link.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                        transition={{ ...rowTransition, delay: reduceMotion ? 0 : index * 0.025 }}
                        className="hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                      >
                        <TableCell className="font-medium">{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>
                          {editingId === link.id ? (
                            <Input
                              value={editSlug}
                              onChange={(e) => setEditSlug(e.target.value)}
                              disabled={isPending}
                            />
                          ) : (
                            <div className="flex items-center space-x-1">
                              <a
                                href={`/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                /{link.shortCode}
                              </a>
                              <CopyButton text={`${appUrl}/${link.shortCode}`} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {editingId === link.id ? (
                            <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} disabled={isPending} />
                          ) : (
                            <div className="truncate">{link.originalUrl}</div>
                          )}
                        </TableCell>
                        <TableCell>{link.clicks}</TableCell>
                        <TableCell>{new Date(link.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>
                          <motion.div layout className="flex items-center gap-1">
                            {editingId === link.id ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdate(link.id)}
                                  disabled={isPending}
                                >
                                  <Check className="h-4 w-4" />
                                  Lưu
                                </Button>
                                <Button variant="ghost" size="icon" onClick={cancelEditing} disabled={isPending}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(link)}
                                  disabled={isPending}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingLink(link)}
                                  disabled={isPending}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
            {totalCount > 0 ? (
              <motion.div
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-muted-foreground text-sm">
                  Hiển thị {startIndex}-{endIndex} trên tổng {totalCount} link
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>Dòng / trang</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => handlePageSizeChange(Number(value))}
                      disabled={isPending}
                    >
                      <SelectTrigger size="sm" className="min-w-18">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  {totalPages > 1 ? (
                    <motion.div layout className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || isPending}
                        render={<NextLink href={buildPageHref(page - 1, pageSize)} />}
                      >
                        Trước
                      </Button>
                      {visiblePages.map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === page ? "default" : "outline"}
                          size="sm"
                          disabled={isPending}
                          render={<NextLink href={buildPageHref(pageNumber, pageSize)} />}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages || isPending}
                        render={<NextLink href={buildPageHref(page + 1, pageSize)} />}
                      >
                        Sau
                      </Button>
                    </motion.div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={Boolean(deletingLink)} onOpenChange={(open) => !open && setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá link rút gọn</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingLink
                ? `Link '${deletingLink.shortCode}' sẽ bị xóa vĩnh viễn khỏi danh sách của bạn. Hành động này không thể hoàn tác.`
                : "Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Đang xóa..." : "Xóa link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
