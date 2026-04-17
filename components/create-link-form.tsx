"use client";

import { motion, useReducedMotion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { createLink } from "@/app/actions/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  url: z.string().min(1, "Url is required."),
  slug: z.string().optional()
});

export default function CreateLinkForm() {
  const [isPending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      slug: ""
    }
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await createLink(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Tạo link rút gọn thành công!");
      form.reset();
    });
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Tạo link rút gọn</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
            <motion.div
              className="flex gap-2"
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "visible"}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.06,
                    delayChildren: 0.06
                  }
                }
              }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} className="flex-1">
                <Controller
                  name="url"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="url">URL gốc *</FieldLabel>
                      <Input
                        {...field}
                        id="url"
                        aria-invalid={fieldState.invalid}
                        placeholder="https://example.com"
                        autoComplete="off"
                        disabled={isPending}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                <Controller
                  name="slug"
                  control={form.control}
                  render={({ field }) => (
                    <Field className="max-w-60">
                      <FieldLabel htmlFor="slug">Slug</FieldLabel>
                      <Input
                        {...field}
                        id="slug"
                        placeholder="slug tuỳ chỉnh"
                        autoComplete="off"
                        disabled={isPending}
                      />
                    </Field>
                  )}
                />
              </motion.div>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                whileHover={reduceMotion || isPending ? undefined : { y: -1 }}
                whileTap={reduceMotion || isPending ? undefined : { scale: 0.98 }}
              >
                <Field className="max-w-30">
                  <FieldLabel>&nbsp;</FieldLabel>
                  <Button type="submit" form="form-rhf-demo" disabled={isPending}>
                    {isPending ? "Đang tạo..." : "Tạo Link"}
                  </Button>
                </Field>
              </motion.div>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
