import type { Metadata } from "next";
import { JoinConnectionPanel } from "@/components/connections/JoinConnectionPanel";

export const metadata: Metadata = {
  title: "Join share"
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  return <JoinConnectionPanel shareToken={token} />;
}
