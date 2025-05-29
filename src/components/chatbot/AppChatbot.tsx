
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send, MessageCircle, X, User, Bot, Loader2, CornerDownLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { appGuideChatbot, type AppGuideChatbotOutput, type AppGuideChatbotInput } from '@/ai/flows/app-guide-chatbot-flow';
import { useAuth } from '@/contexts/AuthContext'; // To get user name for avatar

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function AppChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, addPoints } = useAuth();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse: AppGuideChatbotOutput = await appGuideChatbot({ userQuery: text });
      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        text: aiResponse.botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      if (user) { // Add points if user is logged in
        addPoints(2); // Example: 2 points per chatbot interaction
      }
    } catch (error) {
      console.error("Chatbot AI error:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        text: "Sorry, I couldn't connect to the AI assistant. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Open Chatbot"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] shadow-xl z-50 flex flex-col rounded-lg border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg">AI Health Guide</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close Chatbot">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
             <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                    <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm">Hello{user ? ` ${user.name}` : ''}! How can I help you navigate the AI Health Navigator features today?</p>
                </div>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <Avatar className="h-8 w-8 border">
                     <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                   <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === 'user' && user && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="abstract letter"/>
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                 {msg.sender === 'user' && !user && (
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                 )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                    <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask about app features..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
