
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeSymptoms, type SymptomAnalysisOutput } from '@/ai/flows/symptom-analysis-flow';
import { BotMessageSquare, AlertTriangle, Sparkles, Lightbulb, UserCheck, ShieldQuestion, Activity, MessageSquareHeart, PieChartIcon, Utensils, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext'; // For adding points
import { useToast } from '@/hooks/use-toast'; // For toast notifications

const symptomSchema = z.object({
  symptoms: z.string().min(10, 'Please describe your symptoms in at least 10 characters.'),
});

type SymptomFormData = z.infer<typeof symptomSchema>;

export function SymptomAnalyzerForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomAnalysisOutput | null>(null);
  const { addPoints, user } = useAuth();
  const { toast } = useToast();

  const form = useForm<SymptomFormData>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  const onSubmit = async (data: SymptomFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const aiResponse = await analyzeSymptoms({ symptoms: data.symptoms });
      setResult(aiResponse);
      if (user) {
        addPoints(10); // Add 10 points for using symptom analyzer
        toast({
            title: "Points Earned!",
            description: "You earned 10 points for using the AI Symptom Navigator.",
        });
      }
    } catch (err) {
      console.error("AI Symptom Analysis Error:", err);
      setError('An error occurred while analyzing symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeVariant = (riskScore?: string) => {
    switch (riskScore?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning'; 
      case 'low':
        return 'default'; 
      default:
        return 'secondary';
    }
  };
  
  const getTriageIcon = (triageLevel?: string) => {
    switch (triageLevel) {
      case 'Urgent Care Recommended':
        return <Activity className="mr-2 h-5 w-5 text-red-500" />;
      case 'Schedule Appointment':
        return <UserCheck className="mr-2 h-5 w-5 text-yellow-500" />; 
      case 'Self-Care Possible':
        return <Lightbulb className="mr-2 h-5 w-5 text-green-500" />;
      default:
        return <ShieldQuestion className="mr-2 h-5 w-5 text-gray-500" />;
    }
  };

  const macroData = result?.conceptualMacroBreakdown ? [
    { name: 'Carbs', value: result.conceptualMacroBreakdown.carbs, fill: 'hsl(var(--chart-1))' },
    { name: 'Protein', value: result.conceptualMacroBreakdown.protein, fill: 'hsl(var(--chart-2))' },
    { name: 'Fats', value: result.conceptualMacroBreakdown.fats, fill: 'hsl(var(--chart-3))' },
  ].filter(d => typeof d.value === 'number' && d.value >= 0) : [];


  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="symptoms" className="text-lg font-medium">Describe Your Symptoms</Label>
          <Textarea
            id="symptoms"
            placeholder="e.g., I have a persistent cough, mild fever, and body aches for the past 3 days..."
            {...form.register('symptoms')}
            rows={5}
            className="mt-2"
          />
          {form.formState.errors.symptoms && <p className="text-sm text-destructive mt-1">{form.formState.errors.symptoms.message}</p>}
        </div>
        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Symptoms...
            </>
          ) : (
            <>
              <BotMessageSquare className="mr-2 h-4 w-4" />
              Analyze Symptoms
            </>
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Sparkles className="mr-2 h-6 w-6 text-primary" />
              AI Symptom Analysis
            </CardTitle>
            <CardDescription>
              Based on your symptoms, here's a preliminary analysis. This is not a medical diagnosis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <ShieldQuestion className="mr-2 h-5 w-5 text-accent" />
                Possible Conditions:
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.possibleConditions}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <UserCheck className="mr-2 h-5 w-5 text-accent" />
                  Suggested Specialist(s):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.suggestedSpecialists?.map(specialist => (
                    <Badge key={specialist} variant="secondary" className="text-sm">{specialist}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <Activity className="mr-2 h-5 w-5 text-accent" />
                  Risk Score:
                </h3>
                 <Badge variant={getRiskBadgeVariant(result.riskScore)} className="text-sm py-1 px-3">
                  {result.riskScore || 'N/A'}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                {getTriageIcon(result.triageLevel)}
                Triage Level & Next Steps:
              </h3>
              <p className="text-sm font-semibold text-primary mb-1">{result.triageLevel}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.nextSteps}</p>
            </div>

            {result.aiChatSuggestion && (
                 <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2">
                        <MessageSquareHeart className="mr-2 h-5 w-5 text-accent" />
                        For Your Doctor Visit:
                    </h3>
                    <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{result.aiChatSuggestion}</p>
                </div>
            )}
            
            {/* --- Start of Dietary Section --- */}
            {result.conceptualMacroBreakdown && macroData.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  {result.suggestedDietaryConsiderations && result.suggestedDietaryConsiderations.toLowerCase() !== "no specific textual dietary considerations can be provided without a professional consultation." && (
                     <div className="mb-4">
                        <h3 className="text-lg font-semibold flex items-center mb-2">
                        <Utensils className="mr-2 h-5 w-5 text-accent" />
                        Brief Dietary Note:
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.suggestedDietaryConsiderations}</p>
                        <p className="text-xs text-muted-foreground italic mt-1">This is a general note. Always consult a doctor or dietitian for personalized dietary plans.</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2">
                      <PieChartIcon className="mr-2 h-5 w-5 text-accent" />
                      Conceptual Macronutrient Guidance:
                    </h3>
                    <Alert variant="default" className="mb-4">
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>For General Reference Only</AlertTitle>
                      <AlertDescription>
                        This pie chart illustrates a conceptual macronutrient balance suggested by the AI. It is not a personalized dietary prescription.
                      </AlertDescription>
                    </Alert>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltipContent hideLabel hideIndicator />} />
                          <Legend content={<ChartLegendContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
              </>
            )}
            {/* --- End of Dietary Section --- */}

          </CardContent>
          <CardFooter>
            <Alert variant="warning" className="w-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Important Disclaimer</AlertTitle>
              <AlertDescription>
                This AI-powered tool provides suggestions for informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment, including dietary planning. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read here.
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
