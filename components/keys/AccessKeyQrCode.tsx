"use client";

import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function AccessKeyQrCode({ shareToken }: { shareToken: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(shareToken, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  return (
    <div className="mt-3 grid gap-2 rounded-md border border-emerald-200 bg-white p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
        <QrCode className="h-4 w-4" />
        Scan to add
      </div>
      <div className="grid min-h-48 place-items-center rounded-md bg-white">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt="QR code containing the one-time WayPoint access key"
            width={192}
            height={192}
            unoptimized
            className="h-48 w-48"
          />
        ) : failed ? (
          <p className="px-4 text-center text-sm text-red-700">Unable to generate QR code.</p>
        ) : (
          <div className="h-40 w-40 animate-pulse rounded-md bg-emerald-50" />
        )}
      </div>
    </div>
  );
}
