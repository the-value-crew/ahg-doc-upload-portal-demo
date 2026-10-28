import { ContactPerson } from "../interfaces";

export type { ContactPerson };
export const CONTACT_PERSONS: ContactPerson[] = [
    {
        id: "ggarfinkel",
        name: "G. Garfinkel",
        email: "ggarfinkel@ahgpay.com",
        role: "Dedicated Onboarding Specialist",
        department: "Merchant Underwriting & Compliance",
        phone: "+1-754-732-3744",
        initials: "GG",
        statusText: "Direct Support Available",
        availability: "Direct 1-on-1 Merchant Assistance",
        directNote: "I'm your dedicated point of contact at AHG Pay. Reach out directly for any questions regarding your required documents, compliance checks, or underwriting status.",
        isPrimary: true,
    },
];

/**
 * Get the default/primary contact person (defaults to G. Garfinkel).
 */
export const getPrimaryContact = (): ContactPerson => {
    return CONTACT_PERSONS.find((c) => c.isPrimary) || CONTACT_PERSONS[0];
};

/**
 * Find contact person by id or email. Fallbacks to primary contact if not found.
 */
export const getContactByIdOrEmail = (identifier?: string | null): ContactPerson => {
    if (!identifier) return getPrimaryContact();
    const cleanId = identifier.trim().toLowerCase();
    const found = CONTACT_PERSONS.find(
        (c) => c.id.toLowerCase() === cleanId || c.email.toLowerCase() === cleanId
    );
    return found || getPrimaryContact();
};

