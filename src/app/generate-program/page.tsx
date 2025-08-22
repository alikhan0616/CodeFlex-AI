"use client";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Divide } from "lucide-react";

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [callEnded, setCallEnded] = useState(false);

  const { user } = useUser();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (callEnded) {
      const redirectTimer = setTimeout(() => {
        router.push("/profile");
      }, 1500);
      return () => clearTimeout(redirectTimer);
    }
  }, [callEnded, router]);

  useEffect(() => {
    const handleCallStart = () => {
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
    };

    const handleCallEnd = () => {
      setConnecting(false);
      setCallActive(false);
      setIsSpeaking(false);
      setCallEnded(true);
    };

    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { content: message.transcript, role: message.role };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleError = (error: any) => {
      console.log("vapi Error", error);
      setConnecting(false);
      setCallActive(false);
    };

    vapi
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);

    return () => {
      vapi
        .off("call-start", handleCallStart)
        .off("call-end", handleCallEnd)
        .off("speech-start", handleSpeechStart)
        .off("speech-end", handleSpeechEnd)
        .off("message", handleMessage)
        .off("error", handleError);
    };
  }, []);

  // toggleCall function
  const toggleCall = async () => {
    try {
      if (callEnded) {
        router.push("/profile");
        return;
      }

      if (callActive) {
        vapi.stop();
        setCallActive(false);
        return;
      }

      setConnecting(true);
      await vapi.start({
        // VAPI call configuration
      });
    } catch (error) {
      console.error("Error toggling call:", error);
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase"> Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Have a voice conversation with our AI assistant to create your
            personalized plan
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-8">
          {/* Left Card (AI Info) */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border transition-colors overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="relative size-32 mb-4">
              <div
                className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-sm ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              />
              <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                <img
                  src="/ai-avatar.png"
                  alt="AI Assistant"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground">CodeFlex AI</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fitness & Diet Coach
            </p>

            {/* Status Indicator */}
            <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">
                {isSpeaking
                  ? "speaking..."
                  : callActive
                  ? "Listening..."
                  : callEnded
                  ? "Redirecting..."
                  : "Waiting"}
              </span>
            </div>
          </Card>

          {/* Right Card (User Info) */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border transition-colors overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="relative size-32 mb-4">
              <img
                src={user?.imageUrl || "/ai-avatar.png"}
                alt="User"
                className="object-cover rounded-full"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground">You</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user && (user.firstName || user.lastName)
                ? [user.firstName, user.lastName].filter(Boolean).join(" ")
                : "Guest"}
            </p>

            {/* User Ready Text */}
            <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </Card>
        </div>

        {/* message container (only shows when messages exist) */}
        {messages.length > 0 && (
          <div
            ref={messageContainerRef}
            className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
          >
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className="message-item animate-fadeIn ">
                  <div className="font-semibold text-xs text-muted-foreground mb-1 ">
                    {msg.role === "assistant" ? "CodeFlex AI" : "You"} :
                  </div>
                  <p className="text-foreground">{msg.content}</p>
                </div>
              ))}
              {callEnded && (
                <div className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-primary mb-1">
                    System:
                  </div>
                  <p className="text-foreground">
                    Your fitness program has been created! Redirecting to your
                    profile...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call controls  */}
        <div className="flex justify-center mt-6">
          <Button
            className={`w-auto px-6 text-xl rounded-3xl ${
              callActive
                ? "bg-destructive hover:bg-destructive/90"
                : callEnded
                ? "bg-green-600 hover:bg-green-700"
                : "bg-primary hover:bg-primary/90"
            } text-white relative`}
            onClick={toggleCall}
            disabled={connecting || callEnded}
          >
            {connecting && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
            )}

            <span>
              {callActive
                ? "End Call"
                : connecting
                ? "Connecting..."
                : callEnded
                ? "View Profile"
                : "Start Call"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;
