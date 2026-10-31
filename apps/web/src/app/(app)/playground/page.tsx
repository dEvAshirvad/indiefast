"use client";

import { useHealth } from "../../../queries/health";

export default function PlaygroundPage() {
  const health = useHealth();
  if (health.isPending) return <main>Loading health</main>;
  if (health.isError) return <main>{health.error.message}</main>;
  return <pre>{JSON.stringify(health.data)}</pre>;
}
