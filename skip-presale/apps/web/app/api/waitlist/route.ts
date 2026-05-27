import { NextResponse } from "next/server";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().trim().email(),
  xHandle: z.string().trim().max(80).optional().default(""),
  discordUsername: z.string().trim().max(80).optional().default("")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid email address to join early access." }, { status: 400 });
  }

  // TODO: Persist waitlist records in a database or email platform before production launch.
  return NextResponse.json({
    message: "You're on the SKIP waitlist. Welcome to the early community.",
    data: {
      email: parsed.data.email,
      xHandle: parsed.data.xHandle,
      discordUsername: parsed.data.discordUsername
    }
  });
}
