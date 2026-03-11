import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Guard EMAIL_FROM env var
  if (!process.env.EMAIL_FROM) {
    console.error("Contact error: EMAIL_FROM env var is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Parse body with explicit error handling
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, message } = body as { name?: string; email?: string; message?: string };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 });
  }

  // Basic email format validation
  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_FROM,
      subject: `Demande Enterprise — EnergyHub`,
      text: `Nom: ${name}\nEmail: ${email}\n\n${message || "(aucun message)"}`,
      html: `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message || "(aucun message)"}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
