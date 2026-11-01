export type EnquiryField = "name" | "phone" | "email" | "area" | "message" | "puppyId";

export type EnquiryState = {
  ok: boolean;
  /** Summary shown above the form when something went wrong. */
  message?: string;
  errors?: Partial<Record<EnquiryField, string>>;
};

export const SUCCESS_COPY = {
  heading: "Message received!",
  body: "Thank you — our team will get back to you promptly. For the quickest reply, message us on WhatsApp.",
};
