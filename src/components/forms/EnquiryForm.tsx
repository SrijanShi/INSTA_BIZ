"use client";

import { motion } from "motion/react";
import { useId, type InputHTMLAttributes } from "react";
import { SUCCESS_COPY } from "@/lib/enquiry-types";
import { useEnquiry } from "./useEnquiry";

export type PuppyOption = { id: string; label: string };

const inputClass =
  "mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base outline-none transition-[border-color,box-shadow] focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)] aria-[invalid=true]:border-[#b3261e]";

function Field({ label, error, hint, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[0.95rem] font-semibold">
        {label}
        {input.required ? <span className="text-toffee-ink"> *</span> : <span className="font-normal text-cocoa-soft"> (optional)</span>}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-cocoa-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

/** A thank-you card with an envelope that flips into place. */
export function SentCard({ whatsappHref }: { whatsappHref: string }) {
  return (
    <motion.div
      role="status"
      initial={{ rotateX: -80, opacity: 0, y: -10 }}
      animate={{ rotateX: 0, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 16 }}
      className="tp-sent rounded-[2rem] border-[3px] border-cocoa bg-honey p-8 text-center"
    >
      <svg viewBox="0 0 120 84" className="tp-envelope mx-auto w-32" aria-hidden="true">
        <path d="M6 10h108v68H6z" fill="#fffdf8" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M6 10l54 40 54-40" fill="none" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="94" cy="62" r="12" fill="#c2622b" stroke="#2a170e" strokeWidth="2.5" />
      </svg>
      <p className="font-plush mt-4 text-[2rem]">{SUCCESS_COPY.heading}</p>
      <p className="mx-auto mt-2 max-w-[38ch] text-cocoa-soft">{SUCCESS_COPY.body}</p>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
        WhatsApp us
      </a>
    </motion.div>
  );
}

/**
 * Enquiry form. With `puppy` it is about that puppy (hidden id, pre-written
 * message); with `puppies` the visitor can pick one.
 */
export function EnquiryForm({
  puppy,
  puppies,
  whatsappHref,
  compact = false,
}: {
  puppy?: PuppyOption;
  puppies?: PuppyOption[];
  whatsappHref: string;
  compact?: boolean;
}) {
  const { state, pending, onSubmit, ref } = useEnquiry();
  const selectId = useId();
  const messageId = useId();

  if (state.ok) return <SentCard whatsappHref={whatsappHref} />;

  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="space-y-5">
      {state.message && (
        <p role="alert" className="rounded-2xl bg-blush px-4 py-3 font-semibold">
          {state.message}
        </p>
      )}
      <div className={compact ? "space-y-5" : "grid gap-5 sm:grid-cols-2"}>
        <Field label="Your name" name="name" autoComplete="name" required minLength={2} maxLength={80} error={state.errors?.name} />
        <Field
          label="Phone or WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          error={state.errors?.phone}
          hint="With country code, e.g. +971 50 123 4567"
        />
        <Field label="Email" name="email" type="email" autoComplete="email" error={state.errors?.email} />
        <Field label="Your area" name="area" autoComplete="address-level2" maxLength={80} error={state.errors?.area} hint="e.g. Dubai Marina" />
      </div>
      {puppy ? (
        <input type="hidden" name="puppyId" value={puppy.id} />
      ) : (
        puppies && (
          <div>
            <label htmlFor={selectId} className="block text-[0.95rem] font-semibold">
              Puppy you&apos;re interested in <span className="font-normal text-cocoa-soft">(optional)</span>
            </label>
            <select
              id={selectId}
              name="puppyId"
              className="mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base"
              defaultValue=""
            >
              <option value="">Not sure yet</option>
              {puppies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )
      )}
      <div>
        <label htmlFor={messageId} className="block text-[0.95rem] font-semibold">
          Message <span className="font-normal text-cocoa-soft">(optional)</span>
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={compact ? 3 : 4}
          maxLength={2000}
          className="mt-1.5 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 py-3 text-base outline-none focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)]"
          defaultValue={puppy ? `Hi! I'd love to know more about ${puppy.label}.` : ""}
        />
        {state.errors?.message && <p className="mt-1 text-sm font-semibold text-[#b3261e]">{state.errors.message}</p>}
      </div>
      {/* Honeypot: invisible to people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
