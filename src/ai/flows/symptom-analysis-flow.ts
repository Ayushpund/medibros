
'use server';
/**
 * @fileOverview An AI agent that analyzes symptoms, suggests specialists, provides a triage level, dietary considerations, and a conceptual macro breakdown.
 *
 * - analyzeSymptoms - A function that handles the symptom analysis process.
 * - SymptomAnalysisInput - The input type for the analyzeSymptoms function.
 * - SymptomAnalysisOutput - The return type for the analyzeSymptoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomAnalysisInputSchema = z.object({
  symptoms: z
    .string()
    .describe('A natural language description of the symptoms the user is experiencing.'),
});
export type SymptomAnalysisInput = z.infer<typeof SymptomAnalysisInputSchema>;

const SymptomAnalysisOutputSchema = z.object({
  possibleConditions: z
    .string()
    .describe('A list of possible medical conditions based on the symptoms. This is NOT a diagnosis.'),
  suggestedSpecialists: z
    .array(z.string())
    .describe('A list of medical specialist types best suited to address the symptoms (e.g., Cardiologist, Neurologist).'),
  triageLevel: z
    .enum(['Urgent Care Recommended', 'Schedule Appointment', 'Self-Care Possible'])
    .describe('An indication of the urgency for seeking medical attention.'),
  riskScore: z
    .enum(['High', 'Medium', 'Low'])
    .describe('A general risk assessment based on the described symptoms.'),
  nextSteps: z
    .string()
    .describe('Recommended next steps, ALWAYS including advice to seek professional medical consultation for actual diagnosis and treatment, tailored to the triage level.'),
  aiChatSuggestion: z
    .string()
    .optional()
    .describe('A suggestion for what the user might discuss with a doctor, or a follow-up question the AI might ask if it were a chatbot.'),
  suggestedDietaryConsiderations: z // Keeping for schema consistency, but prompt de-emphasizes it.
    .string()
    .optional()
    .describe("General dietary considerations or advice based on the symptoms. This is NOT a personalized medical diet plan. Always advise consulting a professional. Focus should be on macro breakdown if possible."),
  conceptualMacroBreakdown: z.object({
    carbs: z.number().min(0).max(100),
    protein: z.number().min(0).max(100),
    fats: z.number().min(0).max(100),
  }).optional().describe("A conceptual macronutrient breakdown (carbs, protein, fats percentages summing to 100) for general guidance, if applicable. Example: { carbs: 50, protein: 25, fats: 25 }."),
});
export type SymptomAnalysisOutput = z.infer<typeof SymptomAnalysisOutputSchema>;

export async function analyzeSymptoms(input: SymptomAnalysisInput): Promise<SymptomAnalysisOutput> {
  return symptomAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomAnalysisPrompt',
  input: {schema: SymptomAnalysisInputSchema},
  output: {schema: SymptomAnalysisOutputSchema},
  prompt: `You are an AI assistant designed to help users understand their medical symptoms, identify appropriate medical specialists, assess urgency, and provide general wellness advice including a conceptual macronutrient breakdown for dietary visualization.

CRITICALLY IMPORTANT: You are NOT a doctor or medical professional. Your response is NOT a diagnosis and should NEVER be treated as such. Your information is for educational and informational purposes only. ALWAYS EMPHASIZE that the user MUST consult a qualified healthcare provider (e.g., a doctor or registered dietitian) for any medical concerns, actual medical advice, diagnosis, treatment, or personalized diet plans before making any health decisions.

Please keep your overall responses concise.

User's described symptoms: {{{symptoms}}}

Based on the symptoms described, provide the following:
1.  **Possible Conditions**: List a few possible medical conditions that might align with these symptoms. Prefix with "Possible conditions could include: ". This is not a diagnosis.
2.  **Suggested Specialists**: Recommend 1-3 types of medical specialists who are best suited to evaluate these symptoms (e.g., "Cardiologist," "Pulmonologist," "General Practitioner").
3.  **Triage Level**: Assess the urgency. Choose ONE from: "Urgent Care Recommended", "Schedule Appointment", "Self-Care Possible".
4.  **Risk Score**: Provide a general risk assessment. Choose ONE from: "High", "Medium", "Low". This should correlate with the triage level.
5.  **Next Steps**: Provide clear, actionable next steps. This MUST include strongly advising professional medical consultation. Tailor the advice to the triage level.
6.  **AI Chat Suggestion**: Briefly suggest what a user might want to ask a real doctor or what key information to share.
7.  **Conceptual Macro Breakdown**: If appropriate and only as a very general conceptual guide (NOT a prescription), suggest a sample macronutrient percentage breakdown (carbohydrates, protein, fats) that might support general well-being in relation to the symptoms, ensuring percentages sum to 100. For example: { "carbs": 50, "protein": 25, "fats": 25 }. If not appropriate, omit this field or return null for it. Explicitly state this is a conceptual, non-personalized guide. This is the primary form of dietary guidance you should aim to provide for visualization. If you provide brief textual dietary considerations, keep it to 1-2 sentences AT MOST.
8.  **(Optional/Brief) Suggested Dietary Considerations**: If you provide any textual dietary considerations, keep it EXTREMELY brief (1-2 sentences maximum) and complementary to the macro breakdown. For example, "Consider discussing a diet low in processed foods with your doctor." Always state this is general advice and a professional should be consulted. If no specific dietary advice is relevant or safe to give generally, omit this field or state "No specific textual dietary considerations can be provided without a professional consultation."

Ensure your entire response is empathetic and cautious.
Example for triage and risk:
- If symptoms sound severe (e.g., chest pain, difficulty breathing): Triage: "Urgent Care Recommended", Risk: "High".
- If symptoms sound moderate (e.g., persistent rash, mild joint pain): Triage: "Schedule Appointment", Risk: "Medium".
- If symptoms sound minor (e.g., slight headache, occasional sneeze): Triage: "Self-Care Possible", Risk: "Low", but still advise seeing a doctor if symptoms persist or worsen.
`,
});

const symptomAnalysisFlow = ai.defineFlow(
  {
    name: 'symptomAnalysisFlow',
    inputSchema: SymptomAnalysisInputSchema,
    outputSchema: SymptomAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate a response.");
    }
    // Ensure suggestedSpecialists is always an array
    if (output.suggestedSpecialists === undefined) {
        output.suggestedSpecialists = ["General Practitioner"];
    }
    if (typeof output.suggestedSpecialists === 'string') {
        const specialistsString = output.suggestedSpecialists as string;
        if (specialistsString.includes(',')) {
            output.suggestedSpecialists = specialistsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else {
            output.suggestedSpecialists = [specialistsString.trim()].filter(s => s.length > 0);
        }
         if (output.suggestedSpecialists.length === 0) {
            output.suggestedSpecialists = ["General Practitioner"];
        }
    }
    
    // Validate conceptualMacroBreakdown sums to 100 if present
    if (output.conceptualMacroBreakdown) {
        const { carbs, protein, fats } = output.conceptualMacroBreakdown;
        if (Math.round(carbs + protein + fats) !== 100) {
            // If sum is not 100, nullify it to prevent charting errors or misleading info
            output.conceptualMacroBreakdown = undefined; 
        }
    }

    output.triageLevel = output.triageLevel || 'Schedule Appointment';
    output.riskScore = output.riskScore || 'Medium';
    output.possibleConditions = output.possibleConditions || 'Could not determine specific conditions based on input. Please consult a doctor.';
    output.nextSteps = output.nextSteps || 'It is important to consult with a qualified healthcare professional for an accurate diagnosis and appropriate treatment plan. Please schedule an appointment with your doctor.';
    
    return output;
  }
);
