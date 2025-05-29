
'use client'; // Mark as client component if using hooks like useAuth or client-side components directly

import { SymptomAnalyzerForm } from '@/components/symptom-analyzer/symptom-analyzer-form';
import { DocumentReportAnalyzer } from '@/components/document-analyzer/document-report-analyzer'; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AppChatbot } from '@/components/chatbot/AppChatbot'; // Added Chatbot
import { useAuth } from '@/contexts/AuthContext'; // To greet user
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function SymptomAnalyzerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/register');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    // You can show a loading spinner or a blank page while redirecting or loading
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-12 relative">
      <div className="mb-8">
          <h1 className="text-4xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Ready to explore your health insights?</p>
      </div>

       <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">AI Symptom Navigator</CardTitle>
          <CardDescription>
            Describe your symptoms. Our AI will suggest possible conditions, relevant specialists, and provide a triage indication.
            <strong className="block mt-1">This is not a substitute for professional medical advice.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SymptomAnalyzerForm />
        </CardContent>
      </Card>

      <Separator className="my-8 max-w-4xl mx-auto" />

      <div className="max-w-4xl mx-auto">
        <DocumentReportAnalyzer />
      </div>
      
      <AppChatbot /> {/* Added Chatbot */}
    </div>
  );
}
