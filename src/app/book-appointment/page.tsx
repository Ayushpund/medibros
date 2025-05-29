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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { CalendarIcon, Clock, User, FileText, Send, Info, PhoneOutgoing, Search, Briefcase, MapPin, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { findDoctors, type DoctorProfile, type FindDoctorsOutput } from '@/ai/flows/find-doctors-flow';
import { Skeleton } from '@/components/ui/skeleton';

const DOCTOR_PHONE_NUMBER_FOR_SIMULATION = "8446204947";

// Schema for doctor search
const doctorSearchSchema = z.object({
  indianState: z.string().min(3, { message: "Please enter a valid Indian state (at least 3 characters)." }),
  symptomOrSpecialty: z.string().min(3, { message: "Describe symptoms or specialty (at least 3 characters)." }),
});
type DoctorSearchFormData = z.infer<typeof doctorSearchSchema>;

// Schema for appointment booking
const appointmentSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name must be at least 2 characters." }),
  appointmentDate: z.date({ required_error: "Please select a date." }),
  appointmentTime: z.string({ required_error: "Please select a time." }),
  reasonForVisit: z.string().min(10, { message: "Reason for visit must be at least 10 characters." }),
});
type AppointmentFormData = z.infer<typeof appointmentSchema>;

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

export default function FindAndBookAppointmentPage() {
  const { toast } = useToast();
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);
  const [doctorSearchError, setDoctorSearchError] = useState<string | null>(null);
  const [foundDoctors, setFoundDoctors] = useState<DoctorProfile[]>([]);
  
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  const searchForm = useForm<DoctorSearchFormData>({
    resolver: zodResolver(doctorSearchSchema),
    defaultValues: { indianState: "", symptomOrSpecialty: "" },
  });

  const appointmentForm = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const handleDoctorSearch = async (data: DoctorSearchFormData) => {
    setIsSearchingDoctors(true);
    setDoctorSearchError(null);
    setFoundDoctors([]);
    try {
      const result: FindDoctorsOutput = await findDoctors(data);
      setFoundDoctors(result.doctors);
    } catch (error) {
      console.error("Error finding doctors:", error);
      setDoctorSearchError("Failed to fetch doctor information. The AI service might be temporarily unavailable. Please try again later.");
    } finally {
      setIsSearchingDoctors(false);
    }
  };

  const handleOpenBookingModal = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    appointmentForm.reset(); // Reset form for new booking
    setIsBookingModalOpen(true);
  };

  const handleAppointmentSubmit = async (data: AppointmentFormData) => {
    if (!selectedDoctor) return;
    setIsBookingLoading(true);

    // Simulate API call and doctor's SMS response
    await new Promise(resolve => setTimeout(resolve, 2500));
    const isConfirmed = Math.random() > 0.4; // 60% chance of confirmation

    setIsBookingLoading(false);
    setIsBookingModalOpen(false);

    if (isConfirmed) {
      toast({
        title: "Appointment Confirmed (Conceptual)",
        description: `Your appointment for ${data.patientName} with ${selectedDoctor.name} on ${format(data.appointmentDate, "PPP")} at ${data.appointmentTime} is confirmed. Dr. Sharma (Ph: ${DOCTOR_PHONE_NUMBER_FOR_SIMULATION}) has been notionally informed.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Appointment Request Unsuccessful (Conceptual)",
        description: `Sorry, ${selectedDoctor.name} is unavailable at the selected time or did not confirm. Please try a different slot or doctor.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Search className="mr-3 h-8 w-8 text-primary" />
            Find a Doctor & Book Appointment
          </CardTitle>
          <CardDescription>
            Search for doctors in India by state and specialty/symptoms, then book a conceptual appointment.
          </CardDescription>
           <Alert variant="warning" className="mt-4">
            <Info className="h-5 w-5" />
            <AlertTitle className="font-semibold">Illustrative Feature</AlertTitle>
            <AlertDescription>
              Doctor profiles are AI-generated examples for India. Appointment booking is a simulation; no real messages are sent or appointments made. Dr. Sharma (Ph: {DOCTOR_PHONE_NUMBER_FOR_SIMULATION}) is a conceptual reference.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <form onSubmit={searchForm.handleSubmit(handleDoctorSearch)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="indianState" className="block text-sm font-medium text-foreground mb-1">Indian State</label>
                <Input id="indianState" placeholder="e.g., Maharashtra, Kerala" {...searchForm.register("indianState")} />
                {searchForm.formState.errors.indianState && <p className="text-sm text-destructive mt-1">{searchForm.formState.errors.indianState.message}</p>}
              </div>
              <div>
                <label htmlFor="symptomOrSpecialty" className="block text-sm font-medium text-foreground mb-1">Symptoms / Specialty</label>
                <Input id="symptomOrSpecialty" placeholder="e.g., fever, cardiologist" {...searchForm.register("symptomOrSpecialty")} />
                {searchForm.formState.errors.symptomOrSpecialty && <p className="text-sm text-destructive mt-1">{searchForm.formState.errors.symptomOrSpecialty.message}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSearchingDoctors}>
              {isSearchingDoctors ? (
                <> <Clock className="mr-2 h-4 w-4 animate-spin" /> Searching Doctors... </>
              ) : (
                <> <Search className="mr-2 h-4 w-4" /> Search Doctors </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSearchingDoctors && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {[1, 2].map(i => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {doctorSearchError && (
        <Alert variant="destructive" className="max-w-3xl mx-auto">
          <Info className="h-4 w-4" />
          <AlertTitle>Search Error</AlertTitle>
          <AlertDescription>{doctorSearchError}</AlertDescription>
        </Alert>
      )}

      {!isSearchingDoctors && foundDoctors.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold">Search Results</h2>
          {foundDoctors.map(doctor => (
            <Card key={doctor.id} className="shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 p-4">
                <CardTitle className="text-xl flex items-center">
                  <User className="mr-2 h-6 w-6 text-primary" /> {doctor.name}
                </CardTitle>
                <CardDescription className="flex items-center text-sm">
                  <Briefcase className="mr-1.5 h-4 w-4 text-muted-foreground" /> {doctor.specialty}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <p className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{doctor.address}</span>
                </p>
                <p className="flex items-center">
                  <PhoneOutgoing className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{doctor.phoneNumber} (Conceptual)</span>
                </p>
                {doctor.availabilityNotes && (
                   <p className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{doctor.availabilityNotes}</span>
                  </p>
                )}
              </CardContent>
              <CardFooter className="p-4 bg-muted/10">
                <Button onClick={() => handleOpenBookingModal(doctor)} className="w-full">
                  <CalendarIcon className="mr-2 h-4 w-4" /> Book Appointment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {!isSearchingDoctors && !doctorSearchError && foundDoctors.length === 0 && searchForm.formState.isSubmitted && (
         <Card className="max-w-3xl mx-auto text-center p-6 shadow-md">
            <CardTitle>No Doctors Found</CardTitle>
            <CardDescription className="mt-2">
              No AI-generated doctor examples matched your criteria for "{searchForm.getValues("symptomOrSpecialty")}" in "{searchForm.getValues("indianState")}". Please try different terms or a broader search.
            </CardDescription>
        </Card>
      )}

      {selectedDoctor && (
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Book Appointment with {selectedDoctor.name}</DialogTitle>
              <DialogDescription>
                Fill in your details below to request an appointment. This is a simulation.
                <br />Conceptual Doctor: {selectedDoctor.name} ({selectedDoctor.specialty})
                <br />Reference Ph: {DOCTOR_PHONE_NUMBER_FOR_SIMULATION}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)} className="space-y-4 py-4">
              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-foreground mb-1">Your Name</label>
                <Input id="patientName" placeholder="Full Name" {...appointmentForm.register("patientName")} />
                {appointmentForm.formState.errors.patientName && <p className="text-sm text-destructive mt-1">{appointmentForm.formState.errors.patientName.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="appointmentDate" className="block text-sm font-medium text-foreground mb-1">Preferred Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !appointmentForm.watch("appointmentDate") && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appointmentForm.watch("appointmentDate") ? format(appointmentForm.watch("appointmentDate")!, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={appointmentForm.watch("appointmentDate")}
                        onSelect={(date) => appointmentForm.setValue("appointmentDate", date as Date, { shouldValidate: true })}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1 )) }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {appointmentForm.formState.errors.appointmentDate && <p className="text-sm text-destructive mt-1">{appointmentForm.formState.errors.appointmentDate.message}</p>}
                </div>
                <div>
                  <label htmlFor="appointmentTime" className="block text-sm font-medium text-foreground mb-1">Preferred Time</label>
                  <Select onValueChange={(value) => appointmentForm.setValue("appointmentTime", value, {shouldValidate: true})} value={appointmentForm.watch("appointmentTime")}>
                    <SelectTrigger className="w-full">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground inline-block" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {appointmentForm.formState.errors.appointmentTime && <p className="text-sm text-destructive mt-1">{appointmentForm.formState.errors.appointmentTime.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="reasonForVisit" className="block text-sm font-medium text-foreground mb-1">Reason for Visit</label>
                <Textarea id="reasonForVisit" placeholder="Briefly describe your reason..." {...appointmentForm.register("reasonForVisit")} rows={3} />
                {appointmentForm.formState.errors.reasonForVisit && <p className="text-sm text-destructive mt-1">{appointmentForm.formState.errors.reasonForVisit.message}</p>}
              </div>
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isBookingLoading}>
                  {isBookingLoading ? (
                    <> <Clock className="mr-2 h-4 w-4 animate-spin" /> Requesting... </>
                  ) : (
                    <> <Send className="mr-2 h-4 w-4" /> Request Appointment </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
