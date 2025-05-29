
'use server';
/**
 * @fileOverview An AI flow for an application guide chatbot.
 *
 * - appGuideChatbot - A function that handles user queries about the app.
 * - AppGuideChatbotInput - The input type for the chatbot function.
 * - AppGuideChatbotOutput - The return type for the chatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AppGuideChatbotInputSchema = z.object({
  userQuery: z.string().describe('The user\'s question about the application.'),
});
export type AppGuideChatbotInput = z.infer<typeof AppGuideChatbotInputSchema>;

const AppGuideChatbotOutputSchema = z.object({
  botResponse: z.string().describe('The chatbot\'s answer to the user\'s query.'),
});
export type AppGuideChatbotOutput = z.infer<typeof AppGuideChatbotOutputSchema>;

export async function appGuideChatbot(input: AppGuideChatbotInput): Promise<AppGuideChatbotOutput> {
  return appGuideChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'appGuideChatbotPrompt',
  input: {schema: AppGuideChatbotInputSchema},
  output: {schema: AppGuideChatbotOutputSchema},
  prompt: `You are a friendly and helpful AI assistant for the "MediBros" application.
Your purpose is to guide users and answer their questions about the app's features. Keep your responses concise.

The app has the following main features:
1.  **AI Symptom Navigator**: Users describe symptoms, and the AI suggests possible conditions, specialists, triage level, and risk score. It also gives dietary considerations. It's NOT a medical diagnosis.
2.  **AI Health Report Analyzer**: Users upload health reports (PDF or image). The AI extracts data and provides a summary, health recommendations, dietary suggestions, and a conceptual macronutrient breakdown. It's NOT a medical diagnosis.
3.  **X-Ray Analyzer**: Users upload X-ray images (or PDFs with X-rays). The AI offers general, non-diagnostic observations and potential discussion points for a doctor. It's NOT a medical diagnosis.
4.  **Find & Book Appointment**: Users can search for (AI-generated fictional) doctors in India by state and specialty. They can then conceptually book an appointment, which is a simulation.
5.  **Rewards Hub**: Users earn points for daily logins and using AI features. These points can be (conceptually) exchanged for vouchers.

Your tasks:
- Answer user questions about how to use these features.
- Explain what each feature does.
- If asked about something outside of app functionality (e.g., specific medical advice, real-time doctor availability), politely state that you can only help with questions about the MediBros app's features and that they should consult a medical professional for medical advice.
- Keep your responses concise and easy to understand.

User's question: "{{{userQuery}}}"

Provide your answer:`,
});

const appGuideChatbotFlow = ai.defineFlow(
  {
    name: 'appGuideChatbotFlow',
    inputSchema: AppGuideChatbotInputSchema,
    outputSchema: AppGuideChatbotOutputSchema,
  },
  async (input: AppGuideChatbotInput) => {
    const {output} = await prompt(input);
    if (!output) {
      return { botResponse: "Sorry, I encountered an issue trying to understand that. Could you please rephrase?" };
    }
    return output;
  }
);
