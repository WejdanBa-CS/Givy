"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPaypalSupportUrl, safeSupportUrl } from "@/lib/security";

type Props = {
  supportUrl?: string;
  supportLabel?: string;
  ownerName: string;
};

/**
 * Creator tips via PayPal-hosted pages (PayPal.me / PayPal.com).
 * Card data never touches Givy servers — PayPal handles the transaction.
 * Gift purchases remain on retailer sites.
 */
export function SupportPayPanel({
  supportUrl,
  supportLabel,
  ownerName,
}: Props) {
  const safe = safeSupportUrl(supportUrl);
  if (!safe) return null;

  const label = supportLabel?.trim() || "Support with PayPal";
  const paypal = isPaypalSupportUrl(safe);

  return (
    <div className="mt-5 space-y-2">
      <p className="text-sm text-ink-soft">
        Optional tip for {ownerName.split(" ")[0]}
        {paypal ? " · secured by PayPal" : ""}. Givy never stores card numbers.
      </p>
      <Button asChild variant={paypal ? "amber" : "secondary"}>
        <a href={safe} target="_blank" rel="noopener noreferrer">
          {paypal ? label.replace(/support me/i, "Support with PayPal") : label}
          <ExternalLink size={16} />
        </a>
      </Button>
    </div>
  );
}
