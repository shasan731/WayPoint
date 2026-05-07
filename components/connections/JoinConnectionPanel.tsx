"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinConnection } from "@/lib/client-api";
import { useUiStore } from "@/store/ui-store";

export function JoinConnectionPanel({ shareToken }: { shareToken: string }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const mutation = useMutation({
    mutationFn: () => joinConnection(shareToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["following"] });
      void queryClient.invalidateQueries({ queryKey: ["connections"] });
      pushToast({ type: "success", title: "Connection joined" });
    },
    onError: (error) => {
      pushToast({ type: "error", title: "Could not join", description: error.message });
    }
  });

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <section className="w-full max-w-md rounded-md border border-border bg-white p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <LinkIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Join location share</h1>
            <p className="text-sm text-muted-foreground">This link grants access only while the owner&apos;s key remains valid.</p>
          </div>
        </div>

        {session.status === "unauthenticated" ? (
          <Button asChild className="mt-6 w-full">
            <Link href={`/sign-in?callbackUrl=${encodeURIComponent(`/join/${shareToken}`)}`}>Sign in to continue</Link>
          </Button>
        ) : (
          <Button className="mt-6 w-full" disabled={mutation.isPending || mutation.isSuccess} onClick={() => mutation.mutate()}>
            {mutation.isSuccess ? "Joined" : mutation.isPending ? "Joining" : "Join share"}
          </Button>
        )}
      </section>
    </main>
  );
}
