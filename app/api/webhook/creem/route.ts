/**
 * Creem Webhook Route
 *
 * Handles webhook events from Creem using the official SDK callbacks:
 *
 * Access Granted (onGrantAccess):
 * - subscription.active, subscription.trialing, subscription.paid
 *
 * Access Revoked:
 * - onSubscriptionCanceled: subscription.canceled
 * - onSubscriptionExpired: subscription.expired
 * - onSubscriptionPaused: subscription.paused
 * - onRefundCreated: refund.created (via checkout metadata)
 *
 * Note: onGrantAccess and onRevokeAccess are convenience wrappers.
 * We use specific callbacks for better control.
 */
import {
  Webhook,
  type GrantAccessContext,
  type FlatSubscriptionEvent,
  type FlatRefundCreated,
} from "@creem_io/nextjs";

import { setLicense, revokeLicense, type StoredLicense } from "@/lib/client/kv";

function determinePlan(product?: {
  id?: string;
  name?: string;
}): "monthly" | "yearly" | "lifetime" {
  const productId = product?.id || "";
  const productName = product?.name?.toLowerCase() || "";

  if (productId.includes("lifetime") || productName.includes("lifetime")) {
    return "lifetime";
  }
  if (
    productId.includes("yearly") ||
    productId.includes("annual") ||
    productName.includes("yearly") ||
    productName.includes("annual")
  ) {
    return "yearly";
  }
  return "monthly";
}

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,

  /**
   * Grant access when subscription becomes active, trialing, or paid.
   */
  onGrantAccess: async ({
    customer,
    metadata,
    product,
    id: subscriptionId,
    current_period_end_date,
  }: GrantAccessContext) => {
    const githubId = metadata?.referenceId as string | undefined;

    if (!githubId) {
      console.error("[webhook] onGrantAccess: No GitHub ID in metadata");
      return;
    }

    const plan = determinePlan(product);
    const license: StoredLicense = {
      isPro: true,
      plan,
      customerId: customer?.id,
      subscriptionId,
      grantedAt: new Date().toISOString(),
      // current_period_end_date is a Date object, convert to ISO string
      expiresAt:
        plan === "lifetime"
          ? undefined
          : current_period_end_date instanceof Date
            ? current_period_end_date.toISOString()
            : current_period_end_date,
      updatedAt: new Date().toISOString(),
    };

    await setLicense(githubId, license);
  },

  /**
   * Revoke access when subscription is canceled.
   */
  onSubscriptionCanceled: async ({
    metadata,
  }: FlatSubscriptionEvent<"subscription.canceled">) => {
    const githubId = metadata?.referenceId as string | undefined;
    if (githubId) {
      await revokeLicense(githubId);
    }
  },

  /**
   * Revoke access when subscription expires.
   */
  onSubscriptionExpired: async ({
    metadata,
  }: FlatSubscriptionEvent<"subscription.expired">) => {
    const githubId = metadata?.referenceId as string | undefined;
    if (githubId) {
      await revokeLicense(githubId);
    }
  },

  /**
   * Revoke access when subscription is paused.
   */
  onSubscriptionPaused: async ({
    metadata,
  }: FlatSubscriptionEvent<"subscription.paused">) => {
    const githubId = metadata?.referenceId as string | undefined;
    if (githubId) {
      await revokeLicense(githubId);
    }
  },

  /**
   * Revoke access when a refund is processed.
   *
   * RefundEntity may have checkout or subscription as expanded objects
   * (with metadata) or as string IDs. We try to extract referenceId from:
   * 1. subscription.metadata (if expanded)
   * 2. checkout.metadata (if expanded)
   */
  onRefundCreated: async (data: FlatRefundCreated) => {
    let githubId: string | undefined;

    // Try subscription.metadata first (subscription may be expanded object or string ID)
    if (data.subscription && typeof data.subscription === "object") {
      githubId = data.subscription.metadata?.referenceId as string | undefined;
    }

    // Fallback to checkout.metadata
    if (!githubId && data.checkout && typeof data.checkout === "object") {
      githubId = data.checkout.metadata?.referenceId as string | undefined;
    }

    if (githubId) {
      await revokeLicense(githubId);
    } else {
      console.error(
        "[webhook] onRefundCreated: Cannot find referenceId in subscription or checkout metadata"
      );
    }
  },
});
