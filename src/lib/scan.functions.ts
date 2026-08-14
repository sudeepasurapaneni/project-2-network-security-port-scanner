import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const scanInput = z.object({
  target: z.string().min(1),
  startPort: z.number().int().min(1).max(65535),
  endPort: z.number().int().min(1).max(65535),
  timeoutMs: z.number().int().min(100).max(5000).optional(),
});

export const runScan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => scanInput.parse(data))
  .handler(async ({ data }) => {
    const { isValidIPv4, scanRange } = await import("./scan.server");

    const target = data.target.trim();
    if (!isValidIPv4(target)) {
      return { ok: false as const, error: "Enter a valid IPv4 address (e.g. 192.168.1.1)." };
    }
    if (data.endPort < data.startPort) {
      return { ok: false as const, error: "End port must be greater than or equal to start port." };
    }
    if (data.endPort - data.startPort + 1 > 1024) {
      return { ok: false as const, error: "Please scan at most 1024 ports at a time." };
    }

    const startedAt = Date.now();
    try {
      const results = await scanRange(
        target,
        data.startPort,
        data.endPort,
        data.timeoutMs ?? 1200,
      );
      return {
        ok: true as const,
        target,
        startPort: data.startPort,
        endPort: data.endPort,
        durationMs: Date.now() - startedAt,
        results,
      };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Scan failed unexpectedly.",
      };
    }
  });
