
'use server';
/**
 * @fileOverview An AI flow to provide general, non-diagnostic observations on an X-ray image.
 *
 * - analyzeXrayImage - A function that processes an X-ray image and generates observations.
 * - AnalyzeXrayImageInput - The input type for the analyzeXrayImage function.
 * - AnalyzeXrayImageOutput - The return type for the analyzeXrayImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeXrayImageInputSchema = z.object({
  xrayImageDataUri: z
    .string()
    .describe(
      "An X-ray image (or a PDF containing an X-ray image) encoded as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeXrayImageInput = z.infer<typeof AnalyzeXrayImageInputSchema>;

const AnalyzeXrayImageOutputSchema = z.object({
  aiObservations: z.string().describe("General, non-diagnostic observations based on the visual content of the X-ray image. This should include details on image quality, recognizable general structures or shapes, density variations, and symmetry if apparent. This should not interpret or diagnose any medical conditions."),
  potentialDiscussionPoints: z.string().describe("Specific, general areas or visual features observed in the image (e.g., 'the hazy area in the upper right,' 'the clarity of the structures on the left side,' 'any unexpected dense spots') that a user should definitely discuss with a qualified radiologist or physician for their professional opinion and to assess any potential implications or risks. Avoid any speculative medical advice or direct risk assessment by the AI."),
  disclaimer: z.string().describe('A mandatory, prominent disclaimer stating this is not a medical diagnosis and a qualified healthcare professional must be consulted.'),
});
export type AnalyzeXrayImageOutput = z.infer<typeof AnalyzeXrayImageOutputSchema>;

export async function analyzeXrayImage(input: AnalyzeXrayImageInput): Promise<AnalyzeXrayImageOutput> {
  return analyzeXrayImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeXrayImagePrompt',
  input: {schema: AnalyzeXrayImageInputSchema},
  output: {schema: AnalyzeXrayImageOutputSchema},
  prompt: `You are an AI assistant. You have been provided with an image that is stated to be an X-ray: {{media url=xrayImageDataUri}}

Your task is to provide **DETAILED, VERY GENERAL, NON-DIAGNOSTIC observations** based on the visual content.
- Focus only on what can be visually observed in a generic sense.
- **aiObservations**:
    - Comment on overall image quality (e.g., "Image appears clear and well-contrasted," "Image seems blurry in certain areas," "Possible artifacts like streaks are noted").
    - Describe prominent general shapes or structures (e.g., "Elongated dense structures consistent with long bones are visible," "Diffuse hazy areas are present in the upper portion," "Several small, well-defined circular opacities are noted," "No obvious non-biological foreign objects seen").
    - If there's a clear overall symmetry or asymmetry in the general layout of dense structures, mention it (e.g., "The dense structures appear largely symmetrical on the left and right sides of the midline").
    - Note any visually striking variations in density or texture across different regions of the image (e.g., "The lower part of the image shows higher density compared to the upper part," "A mottled texture is observed in the central area").
- **DO NOT attempt to identify any specific anatomical parts beyond extremely generic terms like 'bone-like structures' or 'soft tissue-like areas' unless they are extremely obvious and universally recognizable (e.g. outline of a heart if very clear).**
- **ABSOLUTELY DO NOT attempt to diagnose any medical conditions, abnormalities, fractures, diseases, or any specific medical findings.**
- **DO NOT provide any medical advice or interpretation of the image's medical significance.**
- **DO NOT assign any risk level or state risk factors directly. Your role is to highlight visual elements for professional review.**

- **potentialDiscussionPoints**: Based on your detailed visual observations, suggest specific general aspects or features a user MUST discuss with their doctor or a radiologist. Frame these points to encourage the user to seek professional assessment for any potential implications or risks. For example: "You should discuss the observed hazy area in the upper right with your doctor to understand its significance," or "It is important to have a healthcare professional review the clarity of the structures on the left side and any noted density variations in the central region to assess their potential implications." Keep this very general and tied to visual observations, emphasizing that only a professional can determine if these visual aspects represent any risk.

- **disclaimer**: Include the following EXACT disclaimer: "IMPORTANT: This AI-generated observation is for informational purposes only and is NOT a medical diagnosis or a substitute for professional medical advice. X-ray interpretation requires a trained radiologist or physician. Always consult a qualified healthcare professional for any health concerns or before making any decisions related to your health or treatment, including risk assessment."

Keep your language cautious and strictly informational. Avoid any phrasing that could be misconstrued as medical expertise, diagnosis, or risk assessment by the AI. If the image is not clearly an X-ray or is of very poor quality making detailed observation impossible, state that clear observations cannot be made for those reasons.
`,
});

const analyzeXrayImageFlow = ai.defineFlow(
  {
    name: 'analyzeXrayImageFlow',
    inputSchema: AnalyzeXrayImageInputSchema,
    outputSchema: AnalyzeXrayImageOutputSchema,
  },
  async (input: AnalyzeXrayImageInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate observations for the X-ray image.");
    }
    // Ensure the disclaimer is always present and correct
    output.disclaimer = "IMPORTANT: This AI-generated observation is for informational purposes only and is NOT a medical diagnosis or a substitute for professional medical advice. X-ray interpretation requires a trained radiologist or physician. Always consult a qualified healthcare professional for any health concerns or before making any decisions related to your health or treatment, including risk assessment.";
    return output;
  }
);
