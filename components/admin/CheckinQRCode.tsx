"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CheckinQRCodeProps {
  baseUrl: string;
}

export function CheckinQRCode({ baseUrl }: CheckinQRCodeProps) {
  const [open, setOpen] = useState(false);
  const checkinUrl = `${baseUrl}/checkin`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        Show QR Code
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Pickup QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-2">
          <QRCodeSVG value={checkinUrl} size={220} includeMargin />
          <p className="text-xs text-muted-foreground text-center">
            Print this and place it at the pickup spot.<br />
            Staff scan to confirm their pickup.
          </p>
          <p className="text-xs font-mono text-muted-foreground break-all text-center">
            {checkinUrl}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
