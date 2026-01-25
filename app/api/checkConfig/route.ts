import { NextResponse } from "next/server";




export async function GET() {
  return NextResponse.json({
    smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    pushConfigured: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  });
}

