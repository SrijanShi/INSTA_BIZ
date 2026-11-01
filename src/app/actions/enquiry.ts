"use server";

import { getAllPuppies } from "@/lib/content";
import type { EnquiryField, EnquiryState } from "@/lib/enquiry-types";
import { site } from "@/lib/site";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

function validate(data: FormData) {
  const errors: Partial<Record<EnquiryField, string>> = {};
  const name = text(data, "name");
  const phone = text(data, "phone");
  const email = text(data, "email");
  const area = text(data, "area");
  const message = text(data, "message");
  const puppyId = text(data, "puppyId");

  if (name.length < 2) errors.name = "Please tell us your name.";
  else if (name.length > 80) errors.name = "That name is a little long — 80 characters max.";

  const digits = phone.replace(/\D/g, "");
  if (!phone) errors.phone = "We need a phone or WhatsApp number to reach you.";
  else if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15)
    errors.phone = "Please enter a valid number with country code, e.g. +971 50 123 4567.";

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email doesn't look quite right.";
  if (area.length > 80) errors.area = "Please keep your area under 80 characters.";
  if (message.length > 2000) errors.message = "Please keep your message under 2000 characters.";
  if (puppyId && !getAllPuppies().some((p) => p.id === puppyId)) errors.puppyId = "Please choose a puppy from the list.";

  return { errors, values: { name, phone, email, area, message, puppyId } };
}

/** Email the enquiry through Resend when configured; otherwise just log it. */
async function deliver(values: ReturnType<typeof validate>["values"]) {
  const puppy = values.puppyId ? getAllPuppies().find((p) => p.id === values.puppyId) : undefined;
  const lines = [
    `Name: ${values.name}`,
    `Phone / WhatsApp: ${values.phone}`,
    values.email && `Email: ${values.email}`,
    values.area && `Area: ${values.area}`,
    puppy && `Puppy: ${puppy.displayName} (${puppy.breed}) — /puppies/${puppy.slug}`,
    values.message && `\n${values.message}`,
  ].filter(Boolean);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  if (!apiKey || !to) {
    console.info(`[enquiry] ${site.name}\n${lines.join("\n")}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM ?? "TeddyPups website <onboarding@resend.dev>",
      to: [to],
      reply_to: values.email || undefined,
      subject: `New enquiry from ${values.name}${puppy ? ` about ${puppy.displayName}` : ""}`,
      text: lines.join("\n"),
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

export async function sendEnquiry(_prev: EnquiryState, data: FormData): Promise<EnquiryState> {
  // Bots fill the hidden "website" field; pretend all went well.
  if (text(data, "website")) return { ok: true };

  const { errors, values } = validate(data);
  if (Object.keys(errors).length) {
    return { ok: false, message: "Please check the highlighted details.", errors };
  }
  try {
    await deliver(values);
    return { ok: true };
  } catch (err) {
    console.error("[enquiry] delivery failed", err);
    return { ok: false, message: "Sorry, we couldn't send that just now. Please try again or message us on WhatsApp." };
  }
}
