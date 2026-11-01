"use client";

import { useActionState, useEffect, useRef, useTransition, type FormEvent } from "react";
import { sendEnquiry } from "@/app/actions/enquiry";
import type { EnquiryState } from "@/lib/enquiry-types";

/**
 * Submits a form to the `sendEnquiry` server action. Validation is done on
 * the server (the form uses noValidate) so every field gets a friendly,
 * consistent message.
 */
export function useEnquiry(resetOnSuccess = false) {
  const [state, dispatch, actionPending] = useActionState<EnquiryState, FormData>(sendEnquiry, { ok: false });
  const [transitionPending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return {
    state,
    pending: actionPending || transitionPending,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      startTransition(() => dispatch(data));
    },
    ref,
  };
}
