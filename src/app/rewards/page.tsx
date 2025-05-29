
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Ticket, Zap, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const conceptualVouchers = [
  { id: 'V001', title: '10% Off Health Supplements', pointsRequired: 100, icon: <Ticket className="h-6 w-6 text-green-500" /> },
  { id: 'V002', title: 'Free Online Yoga Class', pointsRequired: 250, icon: <Ticket className="h-6 w-6 text-blue-500" /> },
  { id: 'V003', title: '$5 Off Next Tele-Consultation', pointsRequired: 500, icon: <Ticket className="h-6 w-6 text-purple-500" /> },
  { id: 'V004', title: 'Early Access to New Features', pointsRequired: 1000, icon: <Zap className="h-6 w-6 text-yellow-500" /> },
];

const pointsToNextTier = 500; // Example: next tier at 500 points

export default function RewardsPage() {
  const { user, points, isLoading, checkDailyLogin, addPoints } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/register'); // Redirect if not logged in
    } else if (user) {
        checkDailyLogin(); // Check for daily login points when page is loaded and user is available
    }
  }, [user, isLoading, router, checkDailyLogin]);

  const handleRedeemVoucher = (voucherTitle: string, pointsReq: number) => {
    if (points >= pointsReq) {
      // In a real app, this would involve backend logic
      addPoints(-pointsReq); // Deduct points
      toast({
        title: "Voucher Redeemed (Conceptual)",
        description: `You've conceptually redeemed "${voucherTitle}". Enjoy!`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Not Enough Points",
        description: `You need ${pointsReq - points} more points to redeem "${voucherTitle}".`,
      });
    }
  };
  
  if (isLoading || !user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading rewards...</p>
      </div>
    );
  }

  const progressToNextTier = Math.min((points / pointsToNextTier) * 100, 100);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center">
                <Gift className="mr-3 h-8 w-8 text-primary" />
                Your Rewards Hub
              </CardTitle>
              <CardDescription>Earn points and redeem exciting vouchers!</CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome, {user.name}!</p>
                <p className="text-4xl font-bold text-primary">{points}</p>
                <p className="text-xs text-muted-foreground">Current Points</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Progress to Next Reward Tier</p>
                    <p className="text-sm text-muted-foreground">{points} / {pointsToNextTier} Points</p>
                </div>
                <Progress value={progressToNextTier} className="w-full h-3" />
                 <p className="text-xs text-muted-foreground mt-1 text-right">Reach {pointsToNextTier} points for special perks!</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center"><Zap className="mr-2 h-5 w-5 text-yellow-500"/>How to Earn Points</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div><Badge variant="secondary" className="mr-2">+5</Badge> Daily Login Bonus (Awarded automatically on your first visit each day).</div>
                    <div><Badge variant="secondary" className="mr-2">+2 to +15</Badge> Each time you use an AI feature (Symptom Analyzer, Report Analyzer, X-Ray Analyzer, Chatbot). Points vary by feature.</div>
                </CardContent>
            </Card>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Available Vouchers</CardTitle>
          <CardDescription>Exchange your points for these conceptual vouchers.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conceptualVouchers.map((voucher) => (
            <Card key={voucher.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    {voucher.icon}
                    <CardTitle className="text-lg">{voucher.title}</CardTitle>
                </div>
                <CardDescription>Requires: <Badge variant="outline">{voucher.pointsRequired} Points</Badge></CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleRedeemVoucher(voucher.title, voucher.pointsRequired)}
                  disabled={points < voucher.pointsRequired}
                >
                  Redeem
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
