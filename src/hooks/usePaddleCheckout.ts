import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (opts: {
    priceId: string;
    customerEmail?: string;
    userId?: string;
    successUrl?: string;
    discountCode?: string;
  }) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(opts.priceId);
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: opts.customerEmail ? { email: opts.customerEmail } : undefined,
        customData: opts.userId ? { userId: opts.userId } : undefined,
        discountCode: opts.discountCode || undefined,
        settings: {
          displayMode: "overlay",
          successUrl: opts.successUrl || `${window.location.origin}/?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
