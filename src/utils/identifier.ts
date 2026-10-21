import z from 'zod';

// Screens that sign a user in or recover an account accept either a phone number or an email.

export const isEmailInput = (value: string) => value.includes('@');

// Nigerian numbers are typed as 0801... and sent to the API as 234801...
export const formatPhone = (phoneNumber: string) => {
  const removeFirstZero = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
  return `234${removeFirstZero}`;
};

export type IdentifierPayload = { email: string } | { phone_number: string };

/** The request fields that identify the account: `email` for an email, otherwise `phone_number`. */
export const identifierToPayload = (value: string): IdentifierPayload => {
  const trimmed = value.trim();
  return isEmailInput(trimmed)
    ? { email: trimmed.toLowerCase() }
    : { phone_number: formatPhone(trimmed) };
};

export const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Enter your phone number or email')
  .superRefine((value, ctx) => {
    if (isEmailInput(value)) {
      if (!z.string().email().safeParse(value).success) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid email address' });
      }
      return;
    }

    if (!/^\d+$/.test(value)) {
      ctx.addIssue({ code: 'custom', message: 'Phone number must contain only digits' });
    } else if (value.length < 10) {
      ctx.addIssue({ code: 'custom', message: 'Phone number is less than 10 digits' });
    } else if (value.length > 11) {
      ctx.addIssue({ code: 'custom', message: 'Phone number is greater than 11 digits' });
    }
  });
