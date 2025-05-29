
'use server';
/**
 * @fileOverview An AI flow to analyze extracted health data and provide recommendations, including dietary suggestions.
 *
 * - analyzeExtractedHealthData - A function that processes extracted health data and generates insights.
 * - AnalyzeExtractedHealthDataInput - The input type (which is the output of document extraction).
 * - AnalyzeExtractedHealthDataOutput - The return type for the analysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtractHealthDataOutput } from './extract-health-data-from-document-flow';

const AnalyzeExtractedHealthDataInputSchema = z.object({
  vitalSigns: z.object({
    heartRate: z.string().optional(),
    bloodPressureSystolic: z.string().optional(),
    bloodPressureDiastolic: z.string().optional(),
    temperature: z.string().optional(),
    bloodSugar: z.string().optional(),
    oxygenSaturation: z.string().optional(),
  }).optional().describe("Extracted vital signs data."),
  symptoms: z.string().optional().describe("Description of symptoms found."),
  medications: z.array(z.object({
    name: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
  })).optional().describe("List of medications extracted."),
  habits: z.object({
    sleep: z.string().optional(),
    exercise: z.string().optional(),
    diet: z.string().optional(),
    mood: z.string().optional(),
  }).optional().describe("Lifestyle habits."),
  notes: z.string().optional().describe("Any other relevant notes or general health information extracted."),
});
export type AnalyzeExtractedHealthDataInput = ExtractHealthDataOutput;

const AnalyzeExtractedHealthDataOutputSchema = z.object({
  reportSummary: z.string().describe('A concise summary of the key findings from the health report data.'),
  healthRecommendations: z.string().describe('Actionable health recommendations and lifestyle advice based on the report. This is NOT medical advice.'),
  importantObservations: z.string().optional().describe('Any particularly important observations or potential concerns highlighted by the AI.'),
  suggestedDietaryPlan: z.string().optional().describe("Brief, general dietary suggestions based on the report, if any textual advice is given beyond the macro breakdown. This is NOT a personalized medical diet plan. Emphasize consulting a professional. Focus should be on macro breakdown if possible."),
  conceptualMacroBreakdown: z.object({
    carbs: z.number().min(0).max(100),
    protein: z.number().min(0).max(100),
    fats: z.number().min(0).max(100),
  }).optional().describe("A conceptual macronutrient breakdown (carbs, protein, fats percentages summing to 100) for general guidance, if applicable from the report. Example: { carbs: 45, protein: 30, fats: 25 }."),
  disclaimer: z.string().describe('A standard disclaimer emphasizing this is not medical advice and to consult a healthcare professional.'),
});
export type AnalyzeExtractedHealthDataOutput = z.infer<typeof AnalyzeExtractedHealthDataOutputSchema>;

export async function analyzeExtractedHealthData(input: AnalyzeExtractedHealthDataInput): Promise<AnalyzeExtractedHealthDataOutput> {
  return analyzeDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeExtractedDataPrompt',
  input: {schema: AnalyzeExtractedHealthDataInputSchema},
  output: {schema: AnalyzeExtractedHealthDataOutputSchema},
  prompt: `You are an AI health assistant reviewing extracted data from a user's health report (which could have been a PDF or an image).
Your goal is to provide a helpful summary, general recommendations, and conceptual dietary guidance primarily through a macronutrient breakdown.

CRITICALLY IMPORTANT: You are NOT a doctor. Your response is for informational purposes ONLY and is NOT a medical diagnosis or treatment plan. ALWAYS emphasize that the user MUST consult a qualified healthcare provider for any medical concerns, advice, diagnosis, or treatment, including personalized dietary plans.

Please keep your responses as concise as possible while still being thorough and accurate according to the schema.

Extracted Health Data:
{{#if vitalSigns}}
Vital Signs:
  Heart Rate: {{vitalSigns.heartRate}}
  Blood Pressure: {{vitalSigns.bloodPressureSystolic}}/{{vitalSigns.bloodPressureDiastolic}}
  Temperature: {{vitalSigns.temperature}}
  Blood Sugar: {{vitalSigns.bloodSugar}}
  Oxygen Saturation: {{vitalSigns.oxygenSaturation}}
{{/if}}
{{#if symptoms}}
Symptoms: {{{symptoms}}}
{{/if}}
{{#if medications.length}}
Medications:
{{#each medications}}
  - Name: {{this.name}}, Dosage: {{this.dosage}}, Frequency: {{this.frequency}}
{{/each}}
{{/if}}
{{#if habits}}
Habits:
  Sleep: {{habits.sleep}}
  Exercise: {{habits.exercise}}
  Diet: {{habits.diet}}
  Mood: {{habits.mood}}
{{/if}}
{{#if notes}}
Notes: {{{notes}}}
{{/if}}

Based on the provided extracted data, generate:
1.  **Report Summary**: A brief overview of the main points in the data.
2.  **Health Recommendations**: General, actionable lifestyle or wellness advice.
3.  **Important Observations**: Highlight any data points that might warrant discussion with a doctor.
4.  **Conceptual Macro Breakdown**: If the report data allows and it seems appropriate as a very general conceptual guide (NOT a prescription), suggest a sample macronutrient percentage breakdown (carbohydrates, protein, fats) that might support general well-being, ensuring percentages sum to 100. Example: { "carbs": 45, "protein": 30, "fats": 25 }. If not appropriate or data is insufficient, omit this field or return null. Explicitly state this is a conceptual, non-personalized guide. This is the primary form of dietary guidance for visualization.
5.  **(Optional/Brief) Suggested Dietary Plan**: If you provide any textual dietary suggestions, keep it EXTREMELY brief (1-2 sentences maximum), complementary to the macro breakdown. For instance, "Consider discussing a diet low in saturated fats with your doctor based on these findings." ALWAYS state this is general advice and a professional (doctor or dietitian) should be consulted. If the report provides insufficient detail for specific textual dietary suggestions, omit this field.
6.  **Disclaimer**: Include the following EXACT disclaimer: "This analysis is AI-generated based on the information you provided. It is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment, including dietary planning. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or dietary changes."

Focus on being informative and cautious. Keep the language clear and easy to understand.`,
});

const analyzeDataFlow = ai.defineFlow(
  {
    name: 'analyzeExtractedHealthDataFlow',
    inputSchema: AnalyzeExtractedHealthDataInputSchema,
    outputSchema: AnalyzeExtractedHealthDataOutputSchema,
  },
  async (input: AnalyzeExtractedHealthDataInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate analysis for the health data.");
    }
    // Ensure the disclaimer is always present and correct
    output.disclaimer = "This analysis is AI-generated based on the information you provided. It is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment, including dietary planning. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or dietary changes.";

    // Validate conceptualMacroBreakdown sums to 100 if present
    if (output.conceptualMacroBreakdown) {
        const { carbs, protein, fats } = output.conceptualMacroBreakdown;
        if (Math.round(carbs + protein + fats) !== 100) {
            output.conceptualMacroBreakdown = undefined;
        }
    }
    return output;
  }
);
