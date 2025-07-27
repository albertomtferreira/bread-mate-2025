'use client';

import { getCloudFunction } from '@/lib/firebase';

interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
}

const handleContactFormFunction = getCloudFunction('handleContactForm');

export const submitContactForm = async (payload: ContactFormPayload): Promise<{success: boolean, message: string}> => {
  try {
    const result: any = await handleContactFormFunction(payload);
    return result.data;
  } catch (error: any) {
    console.error("Error calling handleContactForm function:", error);
    // Re-throw to be caught by the form submission handler
    throw new Error(error.message || 'An unknown error occurred.');
  }
};
