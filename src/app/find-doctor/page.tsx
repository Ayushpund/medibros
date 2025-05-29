// This file has been renamed to src/app/book-appointment/page.tsx
// and its content replaced to implement the new conceptual appointment booking feature.
// Keeping this placeholder to ensure the RENAME-FILE instruction is processed.
// RENAME-FILE: src/app/book-appointment/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Clock, User, FileText, Send, Info, PhoneOutgoing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

const DOCTOR_PHONE_NUMBER = "8446204947"; // Provided doctor's number

const appointmentSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name must be at least 2 characters." }),
  appointmentDate: z.date({ required_error: "Please select a date for the appointment." }),
  appointmentTime: z.string({ required_error: "Please select a time for the appointment." }),
  reasonForVisit: z.string().min(10, { message: "Please provide a brief reason for your visit (at least 10 characters)." }),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientName: "",
      appointmentDate: undefined,
      appointmentTime: "",
      reasonForVisit: "",
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);

    // Simulate API call and doctor's response
    await new Promise(resolve => setTimeout(resolve, 2500));

    const isConfirmed = Math.random() > 0.4; // 60% chance of confirmation for demo

    setIsLoading(false);

    if (isConfirmed) {
      toast({
        title: "Appointment Confirmed (Conceptual)",
        description: `Your appointment for ${data.patientName} on ${format(data.appointmentDate, "PPP")} at ${data.appointmentTime} is confirmed. Dr. Sharma (Ph: ${DOCTOR_PHONE_NUMBER}) has been notionally informed.`,
        variant: "default", // Default is usually greenish or neutral
      });
      form.reset(); // Reset form on successful booking
    } else {
      toast({
        title: "Appointment Request Unsuccessful (Conceptual)",
        description: `Sorry, the doctor is unavailable at the selected time (${format(data.appointmentDate, "PPP")} at ${data.appointmentTime}). Please try a different slot.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <CalendarIcon className="mr-3 h-8 w-8 text-primary" />
            Book a Doctor's Appointment
          </CardTitle>
          <CardDescription>
            Request an appointment. Our system will simulate checking availability with Dr. Sharma (Ph: {DOCTOR_PHONE_NUMBER}).
          </CardDescription>
          <Alert variant="warning" className="mt-4">
            <Info className="h-5 w-5" />
            <AlertTitle className="font-semibold">Conceptual Booking System</AlertTitle>
            <AlertDescription>
              This is a demonstration feature. No real SMS messages are sent, and no actual appointments are booked. The doctor's availability is simulated.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-foreground mb-1">Patient Name</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="patientName"
                  type="text"
                  placeholder="Full Name"
                  className="pl-10"
                  {...form.register("patientName")}
                />
              </div>
              {form.formState.errors.patientName && <p className="text-sm text-destructive mt-1">{form.formState.errors.patientName.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-foreground mb-1">Preferred Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("appointmentDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("appointmentDate") ? format(form.watch("appointmentDate")!, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("appointmentDate")}
                      onSelect={(date) => form.setValue("appointmentDate", date as Date, { shouldValidate: true })}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1 )) } // Disable past dates
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.appointmentDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.appointmentDate.message}</p>}
              </div>

              <div>
                <label htmlFor="appointmentTime" className="block text-sm font-medium text-foreground mb-1">Preferred Time</label>
                 <Select onValueChange={(value) => form.setValue("appointmentTime", value, {shouldValidate: true})} value={form.watch("appointmentTime")}>
                  <SelectTrigger className="w-full">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground inline-block" />
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.appointmentTime && <p className="text-sm text-destructive mt-1">{form.formState.errors.appointmentTime.message}</p>}
              </div>
            </div>
            
            <div>
              <label htmlFor="reasonForVisit" className="block text-sm font-medium text-foreground mb-1">Reason for Visit</label>
               <div className="relative rounded-md shadow-sm">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                <Textarea
                  id="reasonForVisit"
                  placeholder="Briefly describe the reason for your appointment..."
                  className="pl-10"
                  rows={4}
                  {...form.register("reasonForVisit")}
                />
              </div>
              {form.formState.errors.reasonForVisit && <p className="text-sm text-destructive mt-1">{form.formState.errors.reasonForVisit.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Requesting Appointment...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Request Appointment
                </>
              )}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex-col items-start text-xs text-muted-foreground">
            <p className="flex items-center"><PhoneOutgoing className="h-3 w-3 mr-1.5"/> Doctor's Reference (Conceptual): Dr. Sharma, Ph: {DOCTOR_PHONE_NUMBER}</p>
            <p className="mt-1">This is a conceptual system. Appointment confirmation is simulated. No actual SMS is sent.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
