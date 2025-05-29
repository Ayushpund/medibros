import { XRayAnalyzerTool } from '@/components/xray-analyzer/xray-analyzer-tool';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function XRayAnalyzerPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">AI X-Ray Image Analyzer</CardTitle>
          <CardDescription>
            Upload an X-ray image (or a PDF containing an X-ray). Our AI will provide general, non-diagnostic observations.
          </CardDescription>
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-bold">Critical Medical Disclaimer</AlertTitle>
            <AlertDescription>
              This tool is for informational purposes only and is **NOT a substitute for professional medical diagnosis or advice from a qualified radiologist or physician.** AI-generated observations are general and should not be used for making any health decisions. Always consult a healthcare professional for accurate interpretation and diagnosis of any medical images.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <XRayAnalyzerTool />
        </CardContent>
      </Card>
    </div>
  );
}
