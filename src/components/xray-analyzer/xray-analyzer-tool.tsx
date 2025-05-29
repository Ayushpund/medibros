
'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeXrayImage, type AnalyzeXrayImageOutput } from '@/ai/flows/analyze-xray-image-flow';
import { UploadCloud, FileScan, Sparkles, AlertTriangle, ShieldAlert, Eye, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // For adding points

export function XRayAnalyzerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeXrayImageOutput | null>(null);
  const { toast } = useToast();
  const { addPoints, user } = useAuth();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError(null);
        setAnalysisResult(null);

        if (selectedFile.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(selectedFile);
        } else {
          setImagePreview(null); 
        }
      } else {
        setFile(null);
        setFileName(null);
        setImagePreview(null);
        setError('Invalid file type. Please upload an image (PNG, JPG, WebP) or a PDF containing an X-ray.');
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload an image or PDF file for X-ray analysis.",
        });
      }
    }
  };

  const handleAnalyzeXray = async () => {
    if (!file) {
      setError('Please select an X-ray image or PDF file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const output = await analyzeXrayImage({ xrayImageDataUri: base64Image });
        setAnalysisResult(output);
        if (user) {
            addPoints(15); // Points for X-Ray analysis
            toast({
                title: "Analysis Complete!",
                description: "X-Ray observations ready. (+15 Points)",
            });
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file. Please try again.",
        });
      };
    } catch (err) {
      console.error("AI X-Ray Analysis Error:", err);
      setError('An error occurred during X-ray analysis. Please try again.');
       toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "The AI could not analyze the X-ray. Please ensure it's a clear image.",
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="xray-upload" className="text-base font-medium">Upload X-Ray Image or PDF</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="xray-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileChange}
            className="flex-grow"
          />
          <Button 
            onClick={handleAnalyzeXray} 
            disabled={!file || isLoading}
            variant="outline"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileScan className="mr-2 h-4 w-4" />}
            {isLoading ? 'Analyzing...' : 'Analyze X-Ray'}
          </Button>
        </div>
        {fileName && !isLoading && !error && (
          <p className="text-sm text-muted-foreground mt-1">Selected: {fileName}</p>
        )}
      </div>

      {imagePreview && (
        <div className="mt-4 p-2 border rounded-md bg-muted/50 flex justify-center items-center max-h-96 overflow-hidden">
          <Image 
            src={imagePreview} 
            alt="X-Ray preview" 
            width={400} 
            height={400} 
            className="object-contain rounded-md max-w-full max-h-80" 
            data-ai-hint="medical xray"
            />
        </div>
      )}
      {!imagePreview && file && file.type === 'application/pdf' && (
         <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">PDF selected. The AI will attempt to find and analyze an X-ray image within it.</p>
        </div>
      )}


      {isLoading && (
        <div className="text-center p-4">
          <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse mb-2" />
          <p className="text-sm font-semibold">AI is analyzing your X-ray image...</p>
          <p className="text-xs text-muted-foreground">This may take a few moments. Please wait.</p>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoading && (
        <Card className="mt-6 shadow-inner bg-background">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Eye className="mr-2 h-5 w-5 text-accent" />
              AI X-Ray Observations (Non-Diagnostic)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">General AI Observations:</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.aiObservations}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Potential Discussion Points with Your Doctor:</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.potentialDiscussionPoints}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Alert variant="destructive" className="w-full">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="font-bold">Crucial Disclaimer</AlertTitle>
              <AlertDescription>
                {analysisResult.disclaimer}
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
