
'use server';
/**
 * @fileOverview An AI flow to extract health log data from a document (PDF or Image).
 *
 * - extractHealthDataFromDocument - A function that processes a document and extracts health-related information.
 * - ExtractHealthDataInput - The input type for the extractHealthDataFromDocument function.
 * - ExtractHealthDataOutput - The return type for the extractHealthDataFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { MedicationFormData } from '@/types/schemas'; // Ensure this path is correct
import { medicationSchema, vitalSignsSchema, habitsSchema } from '@/types/schemas';

const ExtractHealthDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (PDF or Image) encoded as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractHealthDataInput = z.infer<typeof ExtractHealthDataInputSchema>;

// Making fields optional as not all info might be in the document
const ExtractedMedicationSchema = medicationSchema.extend({
  name: medicationSchema.shape.name.optional(),
  dosage: medicationSchema.shape.dosage.optional(),
  frequency: medicationSchema.shape.frequency.optional(),
});


const ExtractHealthDataOutputSchema = z.object({
  vitalSigns: vitalSignsSchema.optional().describe("Extracted vital signs data."),
  symptoms: z.string().optional().describe("Description of symptoms found in the document."),
  medications: z.array(ExtractedMedicationSchema).optional().describe("List of medications extracted, including name, dosage, and frequency."),
  habits: habitsSchema.optional().describe("Lifestyle habits like sleep, exercise, diet, and mood."),
  notes: z.string().optional().describe("Any other relevant notes or general health information extracted."),
});
export type ExtractHealthDataOutput = z.infer<typeof ExtractHealthDataOutputSchema>;


export async function extractHealthDataFromDocument(input: ExtractHealthDataInput): Promise<ExtractHealthDataOutput> {
  return extractHealthDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractHealthDataFromDocumentPrompt',
  input: {schema: ExtractHealthDataInputSchema},
  output: {schema: ExtractHealthDataOutputSchema},
  prompt: `You are an AI assistant specialized in extracting structured health information from documents, which could be PDFs or images containing text.
The user has provided a document encoded as a data URI.
Analyze the content of the document: {{media url=documentDataUri}}

Extract the following information if available and structure it according to the output schema:
1.  **Vital Signs**: Look for heart rate, blood pressure (systolic and diastolic), temperature, blood sugar levels, and oxygen saturation.
2.  **Symptoms**: Identify any descriptions of medical symptoms the person is experiencing.
3.  **Medications**: List all medications mentioned. For each medication, try to find its name, dosage (e.g., "10mg", "1 tablet"), and frequency (e.g., "once a day", "as needed"). If a medication is mentioned but dosage or frequency is missing, include the name and leave other fields blank.
4.  **Habits**: Note any information related to lifestyle habits such as sleep duration/quality, exercise routines, dietary notes, and mood.
5.  **Notes**: Capture any other general health observations, doctor's comments, or miscellaneous health data that doesn't fit into the above categories.

If a piece of information for a specific field is not found, omit that field or leave it as an empty string/array as appropriate for the schema.
Prioritize accuracy. If the information is unclear or ambiguous, it's better to omit it than to guess.
Focus only on information present in the document. Do not infer or add external knowledge. If the document is an image, extract text from it first if possible.`,
});

const extractHealthDataFlow = ai.defineFlow(
  {
    name: 'extractHealthDataFromDocumentFlow',
    inputSchema: ExtractHealthDataInputSchema,
    outputSchema: ExtractHealthDataOutputSchema,
  },
  async (input: ExtractHealthDataInput) => {
    const {output} = await prompt(input);
    // Ensure medications is an array, even if empty, to match form expectations
    if (output && output.medications === undefined) {
      output.medications = [];
    }
    return output!;
  }
);
