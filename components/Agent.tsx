"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const isFeedbackGenerating = useRef(false);
  const messagesRef = useRef<SavedMessage[]>([]);
  const endOfCallMessagesRef = useRef<SavedMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      console.log("VAPI message received:", message.type, message);
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        console.log("Transcript saved:", newMessage);
        setMessages((prev) => [...prev, newMessage]);
        messagesRef.current = [...messagesRef.current, newMessage];
      }

      // end-of-call-report contains the FULL reliable transcript
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((message as any).type === "end-of-call-report") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const report = message as any;
        const reportMessages: SavedMessage[] = (report.messages ?? [])
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.message ?? m.content ?? "",
          }));
        console.log("end-of-call-report messages:", reportMessages.length, reportMessages);
        if (reportMessages.length > 0) {
          endOfCallMessagesRef.current = reportMessages;
        }
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  useEffect(() => {
    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback called with", messages.length, "messages:", messages);

      if (messages.length === 0) {
        console.error("No transcript messages captured — cannot generate feedback.");
        setFeedbackError("No conversation was recorded. Please try again.");
        setIsGeneratingFeedback(false);
        isFeedbackGenerating.current = false;
        return;
      }

      try {
        const result = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages,
          feedbackId,
        });

        console.log("createFeedback result:", result);

        if (result.success && result.feedbackId) {
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          const errMsg = (result as any).error ?? "Failed to generate feedback.";
          console.error("createFeedback returned failure:", errMsg);
          setFeedbackError(`Error: ${errMsg}`);
          setIsGeneratingFeedback(false);
          isFeedbackGenerating.current = false;
        }
      } catch (err) {
        console.error("Exception in createFeedback:", err);
        setFeedbackError("An unexpected error occurred. Please try again.");
        setIsGeneratingFeedback(false);
        isFeedbackGenerating.current = false;
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else if (!isFeedbackGenerating.current) {
        isFeedbackGenerating.current = true;
        setIsGeneratingFeedback(true);
        setFeedbackError(null);
        // Prefer end-of-call-report (full reliable transcript), fallback to collected messages
        setTimeout(() => {
          const transcript =
            endOfCallMessagesRef.current.length > 0
              ? endOfCallMessagesRef.current
              : messagesRef.current;
          console.log("Using transcript source:", endOfCallMessagesRef.current.length > 0 ? "end-of-call-report" : "messagesRef", "count:", transcript.length);
          handleGenerateFeedback(transcript);
        }, 1000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(
        undefined,
        undefined,
        undefined,
        process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
        {
          variableValues: {
            username: userName,
            userid: userId,
          },
        }
      );
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {isGeneratingFeedback ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-semibold animate-pulse">Generating your feedback...</p>
            <p className="text-sm text-gray-400">Please wait, do not close this page.</p>
          </div>
        ) : feedbackError ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-red-400 font-semibold">{feedbackError}</p>
            <button
              className="btn-call"
              onClick={() => {
                isFeedbackGenerating.current = false;
                setFeedbackError(null);
                setIsGeneratingFeedback(true);
                isFeedbackGenerating.current = true;
                const transcript =
                  endOfCallMessagesRef.current.length > 0
                    ? endOfCallMessagesRef.current
                    : messagesRef.current;
                createFeedback({
                  interviewId: interviewId!,
                  userId: userId!,
                  transcript,
                  feedbackId,
                }).then((result) => {
                  if (result.success && result.feedbackId) {
                    router.push(`/interview/${interviewId}/feedback`);
                  } else {
                    setFeedbackError("Failed again. Please check your connection and try once more.");
                    setIsGeneratingFeedback(false);
                    isFeedbackGenerating.current = false;
                  }
                }).catch(() => {
                  setFeedbackError("An unexpected error occurred. Please try again.");
                  setIsGeneratingFeedback(false);
                  isFeedbackGenerating.current = false;
                });
              }}
            >
              Retry
            </button>
          </div>
        ) : callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;