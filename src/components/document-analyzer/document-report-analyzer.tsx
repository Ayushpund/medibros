
'use client';

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractHealthDataFromDocument, type ExtractHealthDataOutput } from '@/ai/flows/extract-health-data-from-document-flow';
import { analyzeExtractedHealthData, type AnalyzeExtractedHealthDataOutput } from '@/ai/flows/analyze-extracted-health-data-flow';
import { UploadCloud, FileText, Sparkles, AlertTriangle, ShieldAlert, FileCheck2, BrainCircuit, PieChartIcon, Utensils, Lightbulb, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext'; // For adding points
import { useToast } from '@/hooks/use-toast'; // For toast notifications

export function DocumentReportAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractHealthDataOutput | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeExtractedHealthDataOutput | null>(null);
  const { addPoints, user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setDocumentFileName(selectedFile.name);
        setExtractedData(null);
        setAnalysisResult(null);
        setExtractionError(null);
        setAnalysisError(null);
      } else {
        setFile(null);
        setDocumentFileName(null);
        setExtractionError('Invalid file type. Please upload a PDF or an image (PNG, JPG, WebP).');
      }
    }
  };

  const handleExtractAndAnalyze = async () => {
    if (!file) {
      setExtractionError('Please select a PDF or image file first.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setExtractedData(null);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Document = reader.result as string;
        const extractionOutput = await extractHealthDataFromDocument({ documentDataUri: base64Document });
        setExtractedData(extractionOutput);
        setIsExtracting(false);
        
        if (user) {
            addPoints(5); // Points for successful extraction
            toast({ title: "Extraction Complete", description: "Data extracted. Analyzing now... (+5 Points)" });
        }


        if (extractionOutput && (extractionOutput.symptoms || extractionOutput.medications?.length || extractionOutput.notes || extractionOutput.vitalSigns || extractionOutput.habits)) {
          setIsAnalyzing(true);
          try {
            const analysisOutput = await analyzeExtractedHealthData(extractionOutput);
            setAnalysisResult(analysisOutput);
            if (user) {
                addPoints(10); // Points for successful analysis
                toast({ title: "Analysis Complete!", description: "Report analysis ready. (+10 Points)" });
            }
          } catch (analysisErr) {
            console.error("AI Analysis Error:", analysisErr);
            setAnalysisError('An error occurred while analyzing the health report. Please try again.');
          } finally {
            setIsAnalyzing(false);
          }
        } else {
           setIsAnalyzing(false); 
           setAnalysisError('Could not extract sufficient data to analyze. Please check the document content or try a different document.');
           setExtractedData(null); 
        }
      };
      reader.onerror = () => {
        setIsExtracting(false);
        setExtractionError('Failed to read the document file.');
      };
    } catch (extractErr) {
      console.error("AI Extraction Error:", extractErr);
      setExtractionError('An error occurred during document data extraction. Please try again.');
      setIsExtracting(false);
    }
  };

  const renderExtractedDataSummary = (data: ExtractHealthDataOutput) => (
    <Card className="mt-4 bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center"><FileCheck2 className="mr-2 h-5 w-5 text-green-600" /> Extracted Information (Summary)</CardTitle>
        <CardDescription>This is a summary of data found in your document. The AI will use this for its analysis.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        {data.vitalSigns && Object.values(data.vitalSigns).some(v => v) && <p><strong>Vital Signs:</strong> Detected</p>}
        {data.symptoms && <p><strong>Symptoms:</strong> Detected</p>}
        {data.medications && data.medications.length > 0 && <p><strong>Medications:</strong> {data.medications.length} found</p>}
        {data.habits && Object.values(data.habits).some(v => v) && <p><strong>Habits:</strong> Detected</p>}
        {data.notes && <p><strong>Notes:</strong> Detected</p>}
        {(!data.symptoms && (!data.medications || data.medications.length === 0) && !data.notes && !data.vitalSigns && !data.habits) && 
          <p className="text-orange-600">No specific health data categories were prominently identified for summary. The AI will attempt to analyze based on any general text found, but results may be limited.</p>
        }
      </CardContent>
    </Card>
  );
  
  const macroData = analysisResult?.conceptualMacroBreakdown ? [
    { name: 'Carbs', value: analysisResult.conceptualMacroBreakdown.carbs, fill: 'hsl(var(--chart-1))' },
    { name: 'Protein', value: analysisResult.conceptualMacroBreakdown.protein, fill: 'hsl(var(--chart-2))' },
    { name: 'Fats', value: analysisResult.conceptualMacroBreakdown.fats, fill: 'hsl(var(--chart-3))' },
  ].filter(d => typeof d.value === 'number' && d.value >= 0) : [];


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <FileText className="mr-2 h-6 w-6 text-primary" />
          AI Health Report Analyzer
        </CardTitle>
        <CardDescription>
          Upload your health report (PDF or Image). Our AI will extract key information and provide a general analysis and recommendations.
          <strong className="block mt-1">This is not a substitute for professional medical advice.</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="document-upload" className="text-base font-medium">Upload Health Report (PDF or Image)</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="document-upload"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="flex-grow"
            />
            <Button 
              onClick={handleExtractAndAnalyze} 
              disabled={!file || isExtracting || isAnalyzing}
              variant="outline"
            >
              {isExtracting || isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isExtracting ? 'Extracting...' : (isAnalyzing ? 'Analyzing...' : 'Upload & Analyze')}
            </Button>
          </div>
          {documentFileName && !isExtracting && !extractionError && (
            <p className="text-sm text-muted-foreground mt-1">Selected: {documentFileName}</p>
          )}
        </div>

        {isExtracting && (
          <div className="text-center p-4">
            <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse mb-2" />
            <p className="text-sm font-semibold">AI is extracting data from your document...</p>
            <p className="text-xs text-muted-foreground">This may take a few moments.</p>
          </div>
        )}
        
        {extractionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Extraction Error</AlertTitle>
            <AlertDescription>{extractionError}</AlertDescription>
          </Alert>
        )}

        {extractedData && !isExtracting && renderExtractedDataSummary(extractedData)}

        {isAnalyzing && (
            <div className="text-center p-4 mt-4">
                <BrainCircuit className="h-8 w-8 text-primary mx-auto animate-pulse mb-2" />
                <p className="text-sm font-semibold">AI is analyzing the extracted report data...</p>
                <p className="text-xs text-muted-foreground">Please wait.</p>
            </div>
        )}

        {analysisError && (
            <Alert variant="destructive" className="mt-4">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
        )}

        {analysisResult && !isAnalyzing && (
          <Card className="mt-6 shadow-inner bg-background">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="mr-2 h-5 w-5 text-accent" />
                AI Report Analysis & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Summary:</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.reportSummary}</p>
              </div>
              {analysisResult.importantObservations && (
                <div>
                  <h4 className="font-semibold mb-1">Important Observations:</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.importantObservations}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1">Health Recommendations:</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.healthRecommendations}</p>
              </div>

              {/* --- Start of Dietary Section --- */}
              {analysisResult.conceptualMacroBreakdown && macroData.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    {analysisResult.suggestedDietaryPlan && analysisResult.suggestedDietaryPlan.toLowerCase() !== "no specific textual dietary considerations can be provided without a professional consultation." && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold flex items-center mb-2">
                            <Utensils className="mr-2 h-5 w-5 text-accent" />
                            Brief Dietary Note:
                            </h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.suggestedDietaryPlan}</p>
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
                          This pie chart illustrates a conceptual macronutrient balance suggested by the AI based on the report. It is not a personalized dietary prescription.
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
                  {analysisResult.disclaimer}
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
