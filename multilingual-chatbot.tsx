"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChatLauncher } from "./components/chat-launcher";
import { LanguageSelector } from "./components/language-selector";
import { MessageBubble } from "./components/message-bubble";
import { QuickActions } from "./components/quick-actions";
import { TypingIndicator } from "./components/typing-indicator";
import { FeedbackSection } from "./components/feedback-section";
import type { Message, Language, ChatState } from "./types/chat";
import { languages, translations, commonQuestions } from "./data/languages";

export default function MultilingualChatbot() {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    messages: [],
    currentLanguage: languages[0],
    isTyping: false,
    hasNewMessages: false,
    theme: "light",
  });

  const [inputValue, setInputValue] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnectedToHuman, setIsConnectedToHuman] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentTranslations =
    translations[chatState.currentLanguage.code as keyof typeof translations] ||
    translations.en;

  const currentQuestions =
    commonQuestions[
      chatState.currentLanguage.code as keyof typeof commonQuestions
    ] || commonQuestions.en;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isTyping]);

  useEffect(() => {
    if (chatState.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatState.isOpen]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    const timer = setTimeout(() => {
      if (chatState.isOpen && chatState.messages.length > 0) {
        addMessage(currentTranslations.stillThere, "bot");
      }
    }, 5 * 60 * 1000);
    setInactivityTimer(timer);
  }, [
    chatState.isOpen,
    chatState.messages.length,
    currentTranslations.stillThere,
  ]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = chatState.currentLanguage.code;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        addMessage(currentTranslations.voiceNotSupported, "bot");
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [chatState.currentLanguage.code, currentTranslations.voiceNotSupported]);

  const toggleChat = () => {
    setChatState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasNewMessages: prev.isOpen ? false : prev.hasNewMessages,
    }));

    if (!chatState.isOpen) {
      setTimeout(() => {
        addMessage(
          "Hello! I'm LinguaBot, your AI assistant. How can I help you today?",
          "bot"
        );
      }, 500);
    }
  };

  const addMessage = (content: string, sender: "bot" | "user") => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      language: chatState.currentLanguage.code,
    };
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      hasNewMessages: sender === "bot" && !prev.isOpen,
    }));
    resetInactivityTimer();
  };

  const simulateBotResponse = async (userMessage: string) => {
    setChatState((prev) => ({ ...prev, isTyping: true }));
    if (!navigator.onLine) {
      setChatState((prev) => ({ ...prev, isTyping: false }));
      addMessage(currentTranslations.offline, "bot");
      return;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );
    setChatState((prev) => ({ ...prev, isTyping: false }));

    const lowerMessage = userMessage.toLowerCase();
    let response = "";

    if (isConnectedToHuman) {
      const humanResponses = [
        "I understand your concern. Let me help you with that right away.",
        "Thank you for providing those details. I'll look into this for you.",
        "I see what you mean. Let me check our system and get back to you.",
        "That's a great question! Here's what I can tell you about that...",
      ];
      response =
        humanResponses[Math.floor(Math.random() * humanResponses.length)];
    } else {
      if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        response =
          "Hello! I'm here to help you. What can I assist you with today?";
      } else if (lowerMessage.includes("order")) {
        response =
          "Please provide your order number and I'll track it for you.";
      } else {
        const defaultResponses = [
          "Could you please provide more details?",
          "Let me look into that for you.",
          "Thanks! I'm here to assist. Could you clarify your query?",
        ];
        response =
          defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      }
    }

    try {
      addMessage(response, "bot");
      setNetworkError(false);
    } catch {
      setNetworkError(true);
      addMessage(currentTranslations.networkError, "bot");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const now = Date.now();
    if (now - lastMessageTime < 1000) {
      addMessage(currentTranslations.rateLimited, "bot");
      return;
    }
    setLastMessageTime(now);
    const message = inputValue.trim();
    setInputValue("");
    setShowQuestions(false);
    addMessage(message, "user");
    await simulateBotResponse(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLanguageChange = (language: Language) => {
    setChatState((prev) => ({ ...prev, currentLanguage: language }));
    if (recognitionRef.current) {
      recognitionRef.current.lang = language.code;
    }
    setTimeout(() => {
      const newTranslations =
        translations[language.code as keyof typeof translations] ||
        translations.en;
      addMessage(newTranslations.languageChanged, "bot");
    }, 300);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      addMessage(currentTranslations.voiceNotSupported, "bot");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "common":
        setShowQuestions(true);
        addMessage(currentTranslations.selectQuestion, "bot");
        break;
      case "language":
        addMessage("Use the globe icon to change language.", "bot");
        break;
      case "human":
        setIsConnectedToHuman(true);
        addMessage(currentTranslations.connectingHuman, "bot");
        setTimeout(() => {
          addMessage(currentTranslations.humanConnected, "bot");
        }, 2000);
        break;
    }
  };

  const handleQuestionSelect = (question: string) => {
    setShowQuestions(false);
    setInputValue(question);
    setTimeout(() => {
      addMessage(question, "user");
      simulateBotResponse(question);
    }, 100);
  };

  const handleFeedback = (rating: number, comment: string) => {
    console.log("Feedback:", { rating, comment });
    setShowFeedback(false);
    addMessage(currentTranslations.thanksFeedback, "bot");
    setTimeout(() => {
      addMessage("Is there anything else I can help you with?", "bot");
    }, 1000);
  };

  const handleEndChat = () => {
    setShowFeedback(true);
  };

  if (!chatState.isOpen) {
    return (
      <ChatLauncher
        onClick={toggleChat}
        hasNewMessages={chatState.hasNewMessages}
        tooltip={currentTranslations.needHelp}
      />
    );
  }

  return (
    <>
      <ChatLauncher
        onClick={toggleChat}
        hasNewMessages={chatState.hasNewMessages}
        tooltip={currentTranslations.needHelp}
      />

      <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-transparent rounded-xl shadow-xl">
        <Card
          className="flex flex-col h-[600px] max-h-[80vh]  border-0 overflow-hidden rounded-xl "
          style={{ boxShadow: "none" }}
        >
          <div className="flex items-center justify-between p-4 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-500 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {currentTranslations.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  {isConnectedToHuman ? "Human Agent" : "Online"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector
                currentLanguage={chatState.currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <Button variant="ghost" size="sm" onClick={toggleChat}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
            {chatState.messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Welcome to LinguaBot!
                </h4>
                <p className="text-sm text-gray-600">
                  How can I help you today?
                </p>
              </div>
            )}

            {chatState.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {chatState.isTyping && <TypingIndicator />}
            {networkError && (
              <div className="text-center py-2">
                <p className="text-sm text-red-500">
                  {currentTranslations.networkError}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <QuickActions
            onCommonQuestions={() => handleQuickAction("common")}
            onChangeLanguage={() => handleQuickAction("language")}
            onTalkToHuman={() => handleQuickAction("human")}
            translations={currentTranslations}
            showQuestions={showQuestions}
            questions={currentQuestions}
            onQuestionSelect={handleQuestionSelect}
          />

          <div className="p-4 bg-transparent">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isListening
                      ? currentTranslations.listening
                      : currentTranslations.placeholder
                  }
                  className="pr-10"
                  disabled={isListening}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceInput}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() || chatState.isTyping || isListening
                }
                className="bg-emerald-500 hover:bg-emerald-600"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFeedback && (
            <FeedbackSection
              onSubmit={handleFeedback}
              translations={currentTranslations}
            />
          )}
        </Card>
      </div>
    </>
  );
}
