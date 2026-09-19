"use client";

import { FormEvent, useState } from "react";
import { Plus, ShieldCheck, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TrackedWallet } from "@/types/wallet";
import { useRouter } from "next/navigation";

type AddWalletDialogProps = {
  onCreated: (wallet: TrackedWallet) => Promise<void>;
};

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

async function getErrorDetail(response: Response) {
  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof (payload as { detail?: unknown }).detail === "string"
    ) {
      return (payload as { detail: string }).detail;
    }
  } catch {
    // Fall through to the generic error.
  }

  return null;
}

export function AddWalletDialog({ onCreated }: AddWalletDialogProps) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  function reset() {
    setAddress("");
    setLabel("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (submitting) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAddress = address.trim();
    if (!EVM_ADDRESS.test(normalizedAddress)) {
      setError("Enter a valid 0x-prefixed 20-byte Ethereum address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/me/wallets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: normalizedAddress,
          label: label.trim() || null,
        }),
      });

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (!response.ok) {
        setError(
          (await getErrorDetail(response)) ??
            "Calyrn could not add this wallet. Please try again.",
        );
        return;
      }

      const wallet = (await response.json()) as TrackedWallet;
      await onCreated(wallet);
      setOpen(false);
      reset();
    } catch {
      setError("The request did not reach Calyrn. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        className="h-9 rounded-xl bg-[var(--calyrn-jade)] px-3.5 text-[var(--calyrn-ink)] hover:bg-[var(--calyrn-jade)]/90"
      >
        <Plus className="size-3.5" />
        Add wallet
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="calyrn-panel calyrn-edge gap-5 border-white/[0.08] bg-[var(--popover)] p-5 sm:max-w-md">
          <DialogHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[var(--calyrn-jade)]">
              <WalletCards className="size-4.5" />
            </div>
            <DialogTitle className="text-lg tracking-[-0.03em]">
              Track an Ethereum wallet
            </DialogTitle>
            <DialogDescription className="max-w-sm leading-5">
              Calyrn reads public on-chain balances. Tracking an address does
              not prove that you own or control it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <label
                htmlFor="tracked-wallet-address"
                className="data-label text-[9px]!"
              >
                Wallet address
              </label>
              <Input
                id="tracked-wallet-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="0x..."
                autoComplete="off"
                spellCheck={false}
                disabled={submitting}
                className="h-10 rounded-xl px-3 font-mono text-[11px]"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="tracked-wallet-label"
                  className="data-label text-[9px]!"
                >
                  Label
                </label>
                <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground/60">
                  Optional
                </span>
              </div>
              <Input
                id="tracked-wallet-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Primary wallet"
                maxLength={120}
                disabled={submitting}
                className="h-10 rounded-xl px-3"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
              <div>
                <div className="text-[11px] font-medium">Ethereum Mainnet</div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                  eip155:1
                </div>
              </div>
              <span className="rounded-full border border-[var(--calyrn-jade)]/20 bg-[var(--calyrn-jade)]/8 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--calyrn-jade)]">
                Phase 3B
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--calyrn-vermilion)]/20 bg-[var(--calyrn-vermilion)]/7 px-3 py-2.5 text-[11px] leading-5 text-foreground"
              >
                {error}
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-black/[0.08] px-3 py-3 text-[10px] leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--calyrn-ice)]" />
              <span>
                Read-only. Calyrn will never request your seed phrase, private
                key, transaction approval, or wallet signature.
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={submitting}
                onClick={() => handleOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="rounded-xl bg-[var(--calyrn-jade)] text-[var(--calyrn-ink)] hover:bg-[var(--calyrn-jade)]/90"
              >
                {submitting ? "Adding…" : "Track wallet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
