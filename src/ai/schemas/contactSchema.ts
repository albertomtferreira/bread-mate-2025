/**
 * @fileOverview Schemas and types for the contact form flow.
 *
 * - ContactFormInputSchema - Zod schema for the contact form input.
 * - ContactFormInput - TypeScript type for the contact form input.
 * - ContactFormOutputSchema - Zod schema for the contact form output.
 * - ContactFormOutput - TypeScript type for the contact form output.
 */

import { z } from 'zod';

// Define the schema for the contact form input
export const ContactFormInputSchema = z.object({
  name: z.string().min(2).describe('The name of the person sending the message.'),
  email: z.string().email().describe('The email address of the sender.'),
  message: z.string().min(10).describe('The content of the message.'),
});
export type ContactFormInput = z.infer<typeof ContactFormInputSchema>;

// Define the schema for the flow's output
export const ContactFormOutputSchema = z.object({
  success: z.boolean().describe('Whether the submission was successful.'),
  message: z.string().describe('A summary of the outcome.'),
});
export type ContactFormOutput = z.infer<typeof ContactFormOutputSchema>;
