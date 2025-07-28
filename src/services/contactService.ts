'use client';

interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
}

export const submitContactForm = async (payload: ContactFormPayload): Promise<{success: boolean, message: string}> => {
  try {
    const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'An unknown error occurred.');
    }
    
    return result;

  } catch (error: any) {
    console.error("Error calling contact API function:", error);
    throw new Error(error.message || 'An unknown error occurred.');
  }
};
