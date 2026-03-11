"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariantsType } from "./button";
import type { ComponentProps } from "react";

interface ButtonLinkProps extends ComponentProps<typeof Link>, ButtonVariantsType {
  className?: string;
}

export function ButtonLink({
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Link>
  );
}
