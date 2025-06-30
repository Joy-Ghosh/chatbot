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

  // Inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(() => {
      if (chatState.isOpen && chatState.messages.length > 0) {
        addMessage(currentTranslations.stillThere, "bot");
      }
    }, 5 * 60 * 1000); // 5 minutes

    setInactivityTimer(timer);
  }, [
    chatState.isOpen,
    chatState.messages.length,
    currentTranslations.stillThere,
  ]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [resetInactivityTimer]);

  // Initialize speech recognition
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

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [chatState.currentLanguage.code, currentTranslations.voiceNotSupported]);

  const toggleChat = () => {
    setChatState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasNewMessages: prev.isOpen ? false : prev.hasNewMessages,
    }));

    if (!chatState.isOpen) {
      // Welcome message when opening chat in current language
      setTimeout(() => {
        const welcomeMessages = {
          en: "Hello! I'm LinguaBot, your AI assistant. How can I help you today?",
          hi: "नमस्ते! मैं LinguaBot हूँ, आपका AI सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?",
          bn: "হ্যালো! আমি LinguaBot, আপনার AI সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
          te: "హలో! నేను LinguaBot, మీ AI సహాయకుడు. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
          mr: "नमस्कार! मी LinguaBot आहे, तुमचा AI सहाय्यक. आज मी तुमची कशी मदत करू शकतो?",
          ta: "வணக்கம்! நான் LinguaBot, உங்கள் AI உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
          gu: "નમસ્તે! હું LinguaBot છું, તમારો AI સહાયક. આજે હું તમારી કેવી રીતે મદદ કરી શકું?",
          kn: "ನಮಸ್ಕಾರ! ನಾನು LinguaBot, ನಿಮ್ಮ AI ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
          ml: "നമസ്കാരം! ഞാൻ LinguaBot ആണ്, നിങ്ങളുടെ AI സഹായി. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
          pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ LinguaBot ਹਾਂ, ਤੁਹਾਡਾ AI ਸਹਾਇਕ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
          or: "ନମସ୍କାର! ମୁଁ LinguaBot, ଆପଣଙ୍କର AI ସହାୟକ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
          as: "নমস্কাৰ! মই LinguaBot, আপোনাৰ AI সহায়ক। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰো?",
        };

        const welcomeMessage =
          welcomeMessages[
            chatState.currentLanguage.code as keyof typeof welcomeMessages
          ] || welcomeMessages.en;
        addMessage(welcomeMessage, "bot");
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

    // Check for network connectivity
    if (!navigator.onLine) {
      setChatState((prev) => ({ ...prev, isTyping: false }));
      addMessage(currentTranslations.offline, "bot");
      return;
    }

    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    setChatState((prev) => ({ ...prev, isTyping: false }));

    // Intelligent responses based on user input and current language
    const lowerMessage = userMessage.toLowerCase();
    let response = "";

    if (isConnectedToHuman) {
      // Human agent responses in current language
      const humanResponses = {
        en: [
          "I understand your concern. Let me help you with that right away.",
          "Thank you for providing those details. I'll look into this for you.",
          "I see what you mean. Let me check our system and get back to you.",
          "That's a great question! Here's what I can tell you about that...",
        ],
        hi: [
          "मैं आपकी चिंता समझता हूं। मैं तुरंत इसमें आपकी मदद करूंगा।",
          "उन विवरणों को प्रदान करने के लिए धन्यवाद। मैं आपके लिए इसकी जांच करूंगा।",
          "मैं समझ गया कि आपका क्या मतलब है। मुझे अपना सिस्टम चेक करने दें।",
          "यह एक बेहतरीन सवाल है! मैं आपको इसके बारे में बता सकता हूं...",
        ],
        bn: [
          "আমি আপনার উদ্বেগ বুঝতে পারছি। আমি এখনই এতে আপনাকে সাহায্য করব।",
          "এই বিবরণ প্রদান করার জন্য ধন্যবাদ। আমি আপনার জন্য এটি দেখব।",
          "আমি বুঝতে পারছি আপনি কী বলতে চাচ্ছেন। আমাকে আমাদের সিস্টেম চেক করতে দিন।",
          "এটি একটি দুর্দান্ত প্রশ্ন! আমি আপনাকে এ সম্পর্কে বলতে পারি...",
        ],
        te: [
          "నేను మీ ఆందోళనను అర్థం చేసుకున్నాను. నేను వెంటనే దీనిలో మీకు సహాయం చేస్తాను.",
          "ఆ వివరాలను అందించినందుకు ధన్యవాదాలు. నేను మీ కోసం దీన్ని చూస్తాను।",
          "మీరు ఏమి అనుకుంటున్నారో నాకు అర్థమైంది. నేను మా సిస్టమ్‌ను చెక్ చేయనివ్వండి।",
          "అది గొప్ప ప్రశ్న! దాని గురించి నేను మీకు చెప్పగలను...",
        ],
        mr: [
          "मला तुमची चिंता समजली आहे. मी लगेच यात तुमची मदत करेन.",
          "ते तपशील दिल्याबद्दल धन्यवाद. मी तुमच्यासाठी याकडे पाहीन.",
          "तुम्हाला काय म्हणायचे आहे ते मला समजले. मला आमची सिस्टम तपासू द्या.",
          "हा एक उत्तम प्रश्न आहे! मी तुम्हाला त्याबद्दल सांगू शकतो...",
        ],
        ta: [
          "உங்கள் கவலையை நான் புரிந்துகொள்கிறேன். நான் உடனே இதில் உங்களுக்கு உதவுகிறேன்.",
          "அந்த விவரங்களை வழங்கியதற்கு நன்றி. நான் உங்களுக்காக இதைப் பார்ப்பேன்.",
          "நீங்கள் என்ன சொல்கிறீர்கள் என்று எனக்குப் புரிகிறது. எங்கள் சிஸ்டத்தை சரிபார்க்க என்னை அனுமதிக்கவும்.",
          "அது ஒரு சிறந்த கேள்வி! அதைப் பற்றி நான் உங்களுக்குச் சொல்ல முடியும்...",
        ],
        gu: [
          "હું તમારી ચિંતા સમજું છું. હું તરત જ આમાં તમારી મદદ કરીશ.",
          "તે વિગતો આપવા બદલ આભાર. હું તમારા માટે આ જોઈશ.",
          "તમે શું કહેવા માગો છો તે મને સમજાયું. મને અમારી સિસ્ટમ ચેક કરવા દો.",
          "તે એક સરસ પ્રશ્ન છે! હું તમને તેના વિશે કહી શકું છું...",
        ],
        kn: [
          "ನಿಮ್ಮ ಕಾಳಜಿಯನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ನಾನು ತಕ್ಷಣ ಇದರಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
          "ಆ ವಿವರಗಳನ್ನು ಒದಗಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ನಿಮಗಾಗಿ ಇದನ್ನು ನೋಡುತ್ತೇನೆ.",
          "ನೀವು ಏನು ಹೇಳುತ್ತಿದ್ದೀರಿ ಎಂದು ನನಗೆ ಅರ್ಥವಾಗಿದೆ. ನಮ್ಮ ಸಿಸ್ಟಂ ಅನ್ನು ಪರಿಶೀಲಿಸಲು ನನಗೆ ಅವಕಾಶ ನೀಡಿ.",
          "ಅದು ಒಂದು ಉತ್ತಮ ಪ್ರಶ್ನೆ! ಅದರ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಳಬಲ್ಲೆ...",
        ],
        ml: [
          "നിങ്ങളുടെ ആശങ്ക ഞാൻ മനസ്സിലാക്കുന്നു. ഞാൻ ഉടനെ ഇതിൽ നിങ്ങളെ സഹായിക്കും.",
          "ആ വിശദാംശങ്ങൾ നൽകിയതിന് നന്ദി. ഞാൻ നിങ്ങൾക്കായി ഇത് നോക്കാം.",
          "നിങ്ങൾ എന്താണ് ഉദ്ദേശിക്കുന്നതെന്ന് എനിക്ക് മനസ്സിലായി. ഞങ്ങളുടെ സിസ്റ്റം പരിശോധിക്കാൻ എന്നെ അനുവദിക്കൂ.",
          "അതൊരു മികച്ച ചോദ്യമാണ്! അതിനെക്കുറിച്ച് എനിക്ക് നിങ്ങളോട് പറയാൻ കഴിയും...",
        ],
        pa: [
          "ਮੈਂ ਤੁਹਾਡੀ ਚਿੰਤਾ ਸਮਝਦਾ ਹਾਂ। ਮੈਂ ਤੁਰੰਤ ਇਸ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।",
          "ਉਹ ਵੇਰਵੇ ਪ੍ਰਦਾਨ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ਮੈਂ ਤੁਹਾਡੇ ਲਈ ਇਸ ਨੂੰ ਦੇਖਾਂਗਾ।",
          "ਮੈਨੂੰ ਸਮਝ ਆ ਗਿਆ ਕਿ ਤੁਸੀਂ ਕੀ ਕਹਿਣਾ ਚਾਹੁੰਦੇ ਹੋ। ਮੈਨੂੰ ਸਾਡਾ ਸਿਸਟਮ ਚੈੱਕ ਕਰਨ ਦਿਓ।",
          "ਇਹ ਇੱਕ ਵਧੀਆ ਸਵਾਲ ਹੈ! ਮੈਂ ਤੁਹਾਨੂੰ ਇਸ ਬਾਰੇ ਦੱਸ ਸਕਦਾ ਹਾਂ...",
        ],
        or: [
          "ମୁଁ ଆପଣଙ୍କର ଚିନ୍ତା ବୁଝିପାରୁଛି। ମୁଁ ତୁରନ୍ତ ଏଥିରେ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବି।",
          "ସେହି ବିବରଣୀ ପ୍ରଦାନ କରିଥିବାରୁ ଧନ୍ୟବାଦ। ମୁଁ ଆପଣଙ୍କ ପାଇଁ ଏହାକୁ ଦେଖିବି।",
          "ଆପଣ କ'ଣ କହିବାକୁ ଚାହୁଁଛନ୍ତି ମୁଁ ବୁଝିପାରିଲି। ମୋତେ ଆମର ସିଷ୍ଟମ ଯାଞ୍ଚ କରିବାକୁ ଦିଅନ୍ତୁ।",
          "ଏହା ଏକ ଉତ୍ତମ ପ୍ରଶ୍ନ! ମୁଁ ଆପଣଙ୍କୁ ସେ ବିଷୟରେ କହିପାରିବି...",
        ],
        as: [
          "মই আপোনাৰ চিন্তা বুজি পাইছো। মই তৎক্ষণাৎ ইয়াত আপোনাক সহায় কৰিম।",
          "সেই বিৱৰণবোৰ প্ৰদান কৰাৰ বাবে ধন্যবাদ। মই আপোনাৰ বাবে ইয়াক চাম।",
          "আপুনি কি ক'ব বিচাৰিছে মই বুজি পাইছো। মোক আমাৰ চিষ্টেম পৰীক্ষা কৰিবলৈ দিয়ক।",
          "এইটো এটা উত্তম প্ৰশ্ন! মই আপোনাক সেই বিষয়ে ক'ব পাৰো...",
        ],
      };

      const langResponses =
        humanResponses[
          chatState.currentLanguage.code as keyof typeof humanResponses
        ] || humanResponses.en;
      response =
        langResponses[Math.floor(Math.random() * langResponses.length)];
    } else {
      // Bot responses based on keywords and current language
      const botResponses = {
        en: {
          greeting:
            "Hello! I'm here to help you. What can I assist you with today?",
          order:
            "I can help you track your order. Please provide your order number and I'll look it up for you.",
          payment:
            "We accept all major credit cards, UPI, PayPal, and bank transfers. Is there a specific payment issue you're experiencing?",
          return:
            "Our return policy allows returns within 30 days of purchase. Would you like me to start a return process for you?",
          shipping:
            "We offer standard (5-7 days) and express (2-3 days) shipping. Cash on delivery is also available.",
          hours:
            "Our customer service is available 24/7 through this chat. Our phone support is available Monday-Friday 9AM-6PM IST.",
          default: [
            "Thanks for your message! I'm here to help. Could you provide more details about what you need assistance with?",
            "I understand you're looking for help. Let me see how I can assist you with that.",
            "That's a great question! Let me provide you with the information you need.",
            "I'm here to help you resolve this. Can you tell me more about the specific issue you're facing?",
          ],
        },
        hi: {
          greeting:
            "नमस्ते! मैं आपकी मदद के लिए यहाँ हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?",
          order:
            "मैं आपके ऑर्डर को ट्रैक करने में मदद कर सकता हूँ। कृपया अपना ऑर्डर नंबर दें और मैं इसे देखूंगा।",
          payment:
            "हम सभी प्रमुख क्रेडिट कार्ड, UPI, PayPal, और बैंक ट्रांसफर स्वीकार करते हैं। क्या कोई विशिष्ट भुगतान समस्या है?",
          return:
            "हमारी वापसी नीति खरीदारी के 30 दिनों के भीतर वापसी की अनुमति देती है। क्या आप चाहते हैं कि मैं आपके लिए वापसी प्रक्रिया शुरू करूं?",
          shipping:
            "हम मानक (5-7 दिन) और एक्सप्रेस (2-3 दिन) शिपिंग प्रदान करते हैं। कैश ऑन डिलीवरी भी उपलब्ध है।",
          hours:
            "हमारी ग्राहक सेवा इस चैट के माध्यम से 24/7 उपलब्ध है। हमारा फोन सपोर्ट सोमवार-शुक्रवार सुबह 9 बजे से शाम 6 बजे तक उपलब्ध है।",
          default: [
            "आपके संदेश के लिए धन्यवाद! मैं मदद के लिए यहाँ हूँ। क्या आप बता सकते हैं कि आपको किस चीज़ में सहायता चाहिए?",
            "मैं समझता हूँ कि आप मदद की तलाश में हैं। देखते हैं कि मैं आपकी कैसे सहायता कर सकता हूँ।",
            "यह एक बेहतरीन सवाल है! मुझे आपको आवश्यक जानकारी प्रदान करने दें।",
            "मैं इसे हल करने में आपकी मदद के लिए यहाँ हूँ। क्या आप मुझे विशिष्ट समस्या के बारे में और बता सकते हैं?",
          ],
        },
        bn: {
          greeting:
            "হ্যালো! আমি আপনাকে সাহায্য করার জন্য এখানে আছি। আজ আমি আপনাকে কীভাবে সহায়তা করতে পারি?",
          order:
            "আমি আপনার অর্ডার ট্র্যাক করতে সাহায্য করতে পারি। অনুগ্রহ করে আপনার অর্ডার নম্বর দিন এবং আমি এটি দেখব।",
          payment:
            "আমরা সমস্ত প্রধান ক্রেডিট কার্ড, UPI, PayPal, এবং ব্যাংক ট্রান্সফার গ্রহণ করি। কোনো নির্দিষ্ট পেমেন্ট সমস্যা আছে কি?",
          return:
            "আমাদের রিটার্ন নীতি ক্রয়ের 30 দিনের মধ্যে রিটার্নের অনুমতি দেয়। আপনি কি চান যে আমি আপনার জন্য রিটার্ন প্রক্রিয়া শুরু করি?",
          shipping:
            "আমরা স্ট্যান্ডার্ড (5-7 দিন) এবং এক্সপ্রেস (2-3 দিন) শিপিং অফার করি। ক্যাশ অন ডেলিভারিও উপলব্ধ।",
          hours:
            "আমাদের কাস্টমার সার্ভিস এই চ্যাটের মাধ্যমে 24/7 উপলব্ধ। আমাদের ফোন সাপোর্ট সোমবার-শুক্রবার সকাল 9টা থেকে সন্ধ্যা 6টা পর্যন্ত উপলব্ধ।",
          default: [
            "আপনার বার্তার জন্য ধন্যবাদ! আমি সাহায্য করার জন্য এখানে আছি। আপনি কি বলতে পারেন যে আপনার কী ধরনের সহায়তা প্রয়োজন?",
            "আমি বুঝতে পারছি যে আপনি সাহায্য খুঁজছেন। দেখি আমি আপনাকে কীভাবে সহায়তা করতে পারি।",
            "এটি একটি দুর্দান্ত প্রশ্ন! আমাকে আপনাকে প্রয়োজনীয় তথ্য প্রদান করতে দিন।",
            "আমি এটি সমাধান করতে আপনাকে সাহায্য করার জন্য এখানে আছি। আপনি কি আমাকে নির্দিষ্ট সমস্যা সম্পর্কে আরও বলতে পারেন?",
          ],
        },
        te: {
          greeting:
            "హలో! నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
          order:
            "నేను మీ ఆర్డర్‌ను ట్రాక్ చేయడంలో సహాయం చేయగలను. దయచేసి మీ ఆర్డర్ నంబర్ ఇవ్వండి మరియు నేను దానిని చూస్తాను.",
          payment:
            "మేము అన్ని ప్రధాన క్రెడిట్ కార్డులు, UPI, PayPal, మరియు బ్యాంక్ బదిలీలను అంగీకరిస్తాము. ఏదైనా నిర్దిష్ట చెల్లింపు సమస్య ఉందా?",
          return:
            "మా రిటర్న్ పాలసీ కొనుగోలు తర్వాత 30 రోజులలో రిటర్న్‌లను అనుమతిస్తుంది. మీ కోసం రిటర్న్ ప్రక్రియను ప్రారంభించాలని మీరు అనుకుంటున్నారా?",
          shipping:
            "మేము స్టాండర్డ్ (5-7 రోజులు) మరియు ఎక్స్‌ప్రెస్ (2-3 రోజులు) షిప్పింగ్ అందిస్తాము. క్యాష్ ఆన్ డెలివరీ కూడా అందుబాటులో ఉంది.",
          hours:
            "మా కస్టమర్ సర్వీస్ ఈ చాట్ ద్వారా 24/7 అందుబాటులో ఉంది. మా ఫోన్ సపోర్ట్ సోమవారం-శుక్రవారం ఉదయం 9 గంటల నుండి సాయంత్రం 6 గంటల వరకు అందుబాటులో ఉంది.",
          default: [
            "మీ సందేశానికి ధన్యవాదాలు! నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను. మీకు ఎలాంటి సహాయం అవసరమో చెప్పగలరా?",
            "మీరు సహాయం వెతుకుతున్నారని నేను అర్థం చేసుకున్నాను. నేను మీకు ఎలా సహాయం చేయగలనో చూద్దాం.",
            "అది గొప్ప ప్రశ్న! మీకు అవసరమైన సమాచారాన్ని అందించనివ్వండి.",
            "దీన్ని పరిష్కరించడంలో మీకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. నిర్దిష్ట సమస్య గురించి మీరు మరింత చెప్పగలరా?",
          ],
        },
        mr: {
          greeting:
            "नमस्कार! मी तुमची मदत करण्यासाठी इथे आहे. आज मी तुमची कशी मदत करू शकतो?",
          order:
            "मी तुमचा ऑर्डर ट्रॅक करण्यात मदत करू शकतो. कृपया तुमचा ऑर्डर नंबर द्या आणि मी तो पाहीन.",
          payment:
            "आम्ही सर्व प्रमुख क्रेडिट कार्ड, UPI, PayPal, आणि बँक ट्रान्सफर स्वीकारतो. काही विशिष्ट पेमेंट समस्या आहे का?",
          return:
            "आमचे रिटर्न धोरण खरेदीच्या 30 दिवसांत रिटर्नला परवानगी देते. तुम्हाला मी तुमच्यासाठी रिटर्न प्रक्रिया सुरू करावी असे वाटते का?",
          shipping:
            "आम्ही स्टँडर्ड (5-7 दिवस) आणि एक्सप्रेस (2-3 दिवस) शिपिंग ऑफर करतो. कॅश ऑन डिलिव्हरी देखील उपलब्ध आहे.",
          hours:
            "आमची ग्राहक सेवा या चॅटद्वारे 24/7 उपलब्ध आहे. आमचा फोन सपोर्ट सोमवार-शुक्रवार सकाळी 9 ते संध्याकाळी 6 पर्यंत उपलब्ध आहे.",
          default: [
            "तुमच्या संदेशाबद्दल धन्यवाद! मी मदत करण्यासाठी इथे आहे. तुम्हाला कोणत्या गोष्टीत मदत हवी आहे ते सांगू शकाल का?",
            "मला समजले की तुम्ही मदत शोधत आहात. पाहूया मी तुमची कशी मदत करू शकतो.",
            "हा एक उत्तम प्रश्न आहे! मला तुम्हाला आवश्यक माहिती देऊ द्या.",
            "हे सोडवण्यात तुमची मदत करण्यासाठी मी इथे आहे. तुम्ही मला विशिष्ट समस्येबद्दल अधिक सांगू शकाल का?",
          ],
        },
        ta: {
          greeting:
            "வணக்கம்! நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
          order:
            "உங்கள் ஆர்டரை கண்காணிக்க நான் உதவ முடியும். தயவுசெய்து உங்கள் ஆர்டர் எண்ணைக் கொடுங்கள், நான் அதைப் பார்ப்பேன்.",
          payment:
            "நாங்கள் அனைத்து முக்கிய கிரெடிட் கார்டுகள், UPI, PayPal, மற்றும் வங்கி பரிமாற்றங்களை ஏற்றுக்கொள்கிறோம். ஏதேனும் குறிப்பிட்ட கட்டணச் சிக்கல் உள்ளதா?",
          return:
            "எங்கள் திரும்பப் பெறும் கொள்கை வாங்கிய 30 நாட்களுக்குள் திரும்பப் பெற அனுமதிக்கிறது. உங்களுக்காக திரும்பப் பெறும் செயல்முறையைத் தொடங்க வேண்டுமா?",
          shipping:
            "நாங்கள் நிலையான (5-7 நாட்கள்) மற்றும் விரைவு (2-3 நாட்கள்) ஷிப்பிங்கை வழங்குகிறோம். பணம் செலுத்தும் டெலிவரியும் கிடைக்கிறது.",
          hours:
            "எங்கள் வாடிக்கையாளர் சேவை இந்த அரட்டை மூலம் 24/7 கிடைக்கிறது. எங்கள் ஃபோன் ஆதரவு திங்கள்-வெள்ளி காலை 9 முதல் மாலை 6 வரை கிடைக்கிறது.",
          default: [
            "உங்கள் செய்திக்கு நன்றி! நான் உதவ இங்கே இருக்கிறேன். உங்களுக்கு என்ன உதவி தேவை என்று சொல்ல முடியுமா?",
            "நீங்கள் உதவி தேடுகிறீர்கள் என்று புரிகிறது. நான் உங்களுக்கு எப்படி உதவ முடியும் என்று பார்ப்போம்.",
            "அது ஒரு சிறந்த கேள்வி! உங்களுக்குத் தேவையான தகவலை வழங்க என்னை அனுமதிக்கவும்.",
            "இதைத் தீர்க்க உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன். குறிப்பிட்ட பிரச்சினையைப் பற்றி மேலும் சொல்ல முடியுமா?",
          ],
        },
        gu: {
          greeting:
            "નમસ્તે! હું તમારી મદદ કરવા માટે અહીં છું. આજે હું તમારી કેવી રીતે મદદ કરી શકું?",
          order:
            "હું તમારા ઓર્ડરને ટ્રેક કરવામાં મદદ કરી શકું છું. કૃપા કરીને તમારો ઓર્ડર નંબર આપો અને હું તેને જોઈશ.",
          payment:
            "અમે બધા મુખ્ય ક્રેડિટ કાર્ડ, UPI, PayPal, અને બેંક ટ્રાન્સફર સ્વીકારીએ છીએ. કોઈ ચોક્કસ પેમેન્ટ સમસ્યા છે?",
          return:
            "અમારી રિટર્ન પોલિસી ખરીદીના 30 દિવસમાં રિટર્નની મંજૂરી આપે છે. તમે ઇચ્છો છો કે હું તમારા માટે રિટર્ન પ્રક્રિયા શરૂ કરું?",
          shipping:
            "અમે સ્ટાન્ડર્ડ (5-7 દિવસ) અને એક્સપ્રેસ (2-3 દિવસ) શિપિંગ ઓફર કરીએ છીએ. કેશ ઓન ડિલિવરી પણ ઉપલબ્ધ છે.",
          hours:
            "અમારી કસ્ટમર સર્વિસ આ ચેટ દ્વારા 24/7 ઉપલબ્ધ છે. અમારો ફોન સપોર્ટ સોમવાર-શુક્રવાર સવારે 9 થી સાંજે 6 સુધી ઉપલબ્ધ છે.",
          default: [
            "તમારા સંદેશા માટે આભાર! હું મદદ કરવા માટે અહીં છું. તમને કયા પ્રકારની સહાય જોઈએ છે તે કહી શકો છો?",
            "હું સમજું છું કે તમે મદદ શોધી રહ્યા છો. ચાલો જોઈએ કે હું તમારી કેવી રીતે મદદ કરી શકું.",
            "તે એક સરસ પ્રશ્ન છે! મને તમને જરૂરી માહિતી આપવા દો.",
            "આને ઉકેલવામાં તમારી મદદ કરવા માટે હું અહીં છું. તમે મને ચોક્કસ સમસ્યા વિશે વધુ કહી શકો છો?",
          ],
        },
        kn: {
          greeting:
            "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
          order:
            "ನಿಮ್ಮ ಆರ್ಡರ್ ಅನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡಬಹುದು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆರ್ಡರ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ ಮತ್ತು ನಾನು ಅದನ್ನು ನೋಡುತ್ತೇನೆ.",
          payment:
            "ನಾವು ಎಲ್ಲಾ ಪ್ರಮುಖ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗಳು, UPI, PayPal, ಮತ್ತು ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆಗಳನ್ನು ಸ್ವೀಕರಿಸುತ್ತೇವೆ. ಯಾವುದೇ ನಿರ್ದಿಷ್ಟ ಪಾವತಿ ಸಮಸ್ಯೆ ಇದೆಯೇ?",
          return:
            "ನಮ್ಮ ರಿಟರ್ನ್ ನೀತಿಯು ಖರೀದಿಯ 30 ದಿನಗಳಲ್ಲಿ ರಿಟರ್ನ್‌ಗಳನ್ನು ಅನುಮತಿಸುತ್ತದೆ. ನಿಮಗಾಗಿ ರಿಟರ್ನ್ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪ್ರಾರಂಭಿಸಬೇಕೆಂದು ನೀವು ಬಯಸುತ್ತೀರಾ?",
          shipping:
            "ನಾವು ಸ್ಟ್ಯಾಂಡರ್ಡ್ (5-7 ದಿನಗಳು) ಮತ್ತು ಎಕ್ಸ್‌ಪ್ರೆಸ್ (2-3 ದಿನಗಳು) ಶಿಪ್ಪಿಂಗ್ ಅನ್ನು ನೀಡುತ್ತೇವೆ. ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ ಕೂಡ ಲಭ್ಯವಿದೆ.",
          hours:
            "ನಮ್ಮ ಗ್ರಾಹಕ ಸೇವೆಯು ಈ ಚಾಟ್ ಮೂಲಕ 24/7 ಲಭ್ಯವಿದೆ. ನಮ್ಮ ಫೋನ್ ಬೆಂಬಲವು ಸೋಮವಾರ-ಶುಕ್ರವಾರ ಬೆಳಿಗ್ಗೆ 9 ರಿಂದ ಸಂಜೆ 6 ರವರೆಗೆ ಲಭ್ಯವಿದೆ.",
          default: [
            "ನಿಮ್ಮ ಸಂದೇಶಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. ನಿಮಗೆ ಯಾವ ರೀತಿಯ ಸಹಾಯ ಬೇಕು ಎಂದು ಹೇಳಬಹುದೇ?",
            "ನೀವು ಸಹಾಯ ಹುಡುಕುತ್ತಿದ್ದೀರಿ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು ಎಂದು ನೋಡೋಣ.",
            "ಅದು ಒಂದು ಉತ್ತಮ ಪ್ರಶ್ನೆ! ನಿಮಗೆ ಅಗತ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಲು ನನಗೆ ಅವಕಾಶ ನೀಡಿ.",
            "ಇದನ್ನು ಪರಿಹರಿಸಲು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ನಿರ್ದಿಷ್ಟ ಸಮಸ್ಯೆಯ ಬಗ್ಗೆ ನೀವು ಹೆಚ್ಚು ಹೇಳಬಹುದೇ?",
          ],
        },
        ml: {
          greeting:
            "നമസ്കാരം! നിങ്ങളെ സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
          order:
            "നിങ്ങളുടെ ഓർഡർ ട്രാക്ക് ചെയ്യാൻ എനിക്ക് സഹായിക്കാൻ കഴിയും. ദയവായി നിങ്ങളുടെ ഓർഡർ നമ്പർ നൽകുക, ഞാൻ അത് നോക്കാം.",
          payment:
            "ഞങ്ങൾ എല്ലാ പ്രധാന ക്രെഡിറ്റ് കാർഡുകൾ, UPI, PayPal, ബാങ്ക് ട്രാൻസ്ഫറുകൾ എന്നിവ സ്വീകരിക്കുന്നു. എന്തെങ്കിലും പ്രത്യേക പേയ്‌മെന്റ് പ്രശ്നമുണ്ടോ?",
          return:
            "ഞങ്ങളുടെ റിട്ടേൺ പോളിസി വാങ്ങലിന്റെ 30 ദിവസത്തിനുള്ളിൽ റിട്ടേൺ അനുവദിക്കുന്നു. നിങ്ങൾക്കായി റിട്ടേൺ പ്രക്രിയ ആരംഭിക്കണമെന്ന് നിങ്ങൾ ആഗ്രഹിക്കുന്നുണ്ടോ?",
          shipping:
            "ഞങ്ങൾ സ്റ്റാൻഡേർഡ് (5-7 ദിവസം) ഒപ്പം എക്സ്പ്രസ് (2-3 ദിവസം) ഷിപ്പിംഗ് വാഗ്ദാനം ചെയ്യുന്നു. ക്യാഷ് ഓൺ ഡെലിവറിയും ലഭ്യമാണ്.",
          hours:
            "ഞങ്ങളുടെ കസ്റ്റമർ സേവനം ഈ ചാറ്റിലൂടെ 24/7 ലഭ്യമാണ്. ഞങ്ങളുടെ ഫോൺ സപ്പോർട്ട് തിങ്കൾ-വെള്ളി രാവിലെ 9 മുതൽ വൈകുന്നേരം 6 വരെ ലഭ്യമാണ്.",
          default: [
            "നിങ്ങളുടെ സന്ദേശത്തിന് നന്ദി! സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്. നിങ്ങൾക്ക് എന്ത് തരത്തിലുള്ള സഹായം വേണമെന്ന് പറയാമോ?",
            "നിങ്ങൾ സഹായം തേടുകയാണെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയുമെന്ന് നോക്കാം.",
            "അതൊരു മികച്ച ചോദ്യമാണ്! നിങ്ങൾക്ക് ആവശ്യമായ വിവരങ്ങൾ നൽകാൻ എന്നെ അനുവദിക്കൂ.",
            "ഇത് പരിഹരിക്കാൻ നിങ്ങളെ സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്. നിർദ്ദിഷ്ട പ്രശ്നത്തെക്കുറിച്ച് കൂടുതൽ പറയാമോ?",
          ],
        },
        pa: {
          greeting:
            "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਇੱਥੇ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
          order:
            "ਮੈਂ ਤੁਹਾਡੇ ਆਰਡਰ ਨੂੰ ਟਰੈਕ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਆਰਡਰ ਨੰਬਰ ਦਿਓ ਅਤੇ ਮੈਂ ਇਸਨੂੰ ਦੇਖਾਂਗਾ।",
          payment:
            "ਅਸੀਂ ਸਾਰੇ ਮੁੱਖ ਕ੍ਰੈਡਿਟ ਕਾਰਡ, UPI, PayPal, ਅਤੇ ਬੈਂਕ ਟ੍ਰਾਂਸਫਰ ਸਵੀਕਾਰ ਕਰਦੇ ਹਾਂ। ਕੀ ਕੋਈ ਖਾਸ ਭੁਗਤਾਨ ਸਮੱਸਿਆ ਹੈ?",
          return:
            "ਸਾਡੀ ਰਿਟਰਨ ਨੀਤੀ ਖਰੀਦਦਾਰੀ ਦੇ 30 ਦਿਨਾਂ ਵਿੱਚ ਰਿਟਰਨ ਦੀ ਇਜਾਜ਼ਤ ਦਿੰਦੀ ਹੈ। ਕੀ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਮੈਂ ਤੁਹਾਡੇ ਲਈ ਰਿਟਰਨ ਪ੍ਰਕਿਰਿਆ ਸ਼ੁਰੂ ਕਰਾਂ?",
          shipping:
            "ਅਸੀਂ ਸਟੈਂਡਰਡ (5-7 ਦਿਨ) ਅਤੇ ਐਕਸਪ੍ਰੈਸ (2-3 ਦਿਨ) ਸ਼ਿਪਿੰਗ ਦੀ ਪੇਸ਼ਕਸ਼ ਕਰਦੇ ਹਾਂ। ਕੈਸ਼ ਆਨ ਡਿਲੀਵਰੀ ਵੀ ਉਪਲਬਧ ਹੈ।",
          hours:
            "ਸਾਡੀ ਗਾਹਕ ਸੇਵਾ ਇਸ ਚੈਟ ਰਾਹੀਂ 24/7 ਉਪਲਬਧ ਹੈ। ਸਾਡਾ ਫੋਨ ਸਪੋਰਟ ਸੋਮਵਾਰ-ਸ਼ੁੱਕਰਵਾਰ ਸਵੇਰੇ 9 ਤੋਂ ਸ਼ਾਮ 6 ਤੱਕ ਉਪਲਬਧ ਹੈ।",
          default: [
            "ਤੁਹਾਡੇ ਸੰਦੇਸ਼ ਲਈ ਧੰਨਵਾਦ! ਮੈਂ ਮਦਦ ਕਰਨ ਲਈ ਇੱਥੇ ਹਾਂ। ਤੁਸੀਂ ਦੱਸ ਸਕਦੇ ਹੋ ਕਿ ਤੁਹਾਨੂੰ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
            "ਮੈਂ ਸਮਝਦਾ ਹਾਂ ਕਿ ਤੁਸੀਂ ਮਦਦ ਦੀ ਤਲਾਸ਼ ਕਰ ਰਹੇ ਹੋ। ਦੇਖਦੇ ਹਾਂ ਕਿ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",
            "ਇਹ ਇੱਕ ਵਧੀਆ ਸਵਾਲ ਹੈ! ਮੈਨੂੰ ਤੁਹਾਨੂੰ ਲੋੜੀਂਦੀ ਜਾਣਕਾਰੀ ਦੇਣ ਦਿਓ।",
            "ਇਸਨੂੰ ਹੱਲ ਕਰਨ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਮੈਂ ਇੱਥੇ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਮੈਨੂੰ ਖਾਸ ਸਮੱਸਿਆ ਬਾਰੇ ਹੋਰ ਦੱਸ ਸਕਦੇ ਹੋ?",
          ],
        },
        or: {
          greeting:
            "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବା ପାଇଁ ଏଠାରେ ଅଛି। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
          order:
            "ମୁଁ ଆପଣଙ୍କର ଅର୍ଡର ଟ୍ରାକ କରିବାରେ ସାହାଯ୍ୟ କରିପାରିବି। ଦୟାକରି ଆପଣଙ୍କର ଅର୍ଡର ନମ୍ବର ଦିଅନ୍ତୁ ଏବଂ ମୁଁ ଏହାକୁ ଦେଖିବି।",
          payment:
            "ଆମେ ସମସ୍ତ ମୁଖ୍ୟ କ୍ରେଡିଟ କାର୍ଡ, UPI, PayPal, ଏବଂ ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର ଗ୍ରହଣ କରୁ। କୌଣସି ନିର୍ଦ୍ଦିଷ୍ଟ ପେମେଣ୍ଟ ସମସ୍ୟା ଅଛି କି?",
          return:
            "ଆମର ରିଟର୍ନ ନୀତି କ୍ରୟର 30 ଦିନ ମଧ୍ୟରେ ରିଟର୍ନକୁ ଅନୁମତି ଦିଏ। ଆପଣ ଚାହାଁନ୍ତି କି ମୁଁ ଆପଣଙ୍କ ପାଇଁ ରିଟର୍ନ ପ୍ରକ୍ରିୟା ଆରମ୍ଭ କରିବି?",
          shipping:
            "ଆମେ ଷ୍ଟାଣ୍ଡାର୍ଡ (5-7 ଦିନ) ଏବଂ ଏକ୍ସପ୍ରେସ (2-3 ଦିନ) ସିପିଂ ପ୍ରଦାନ କରୁ। କ୍ୟାସ ଅନ ଡେଲିଭରି ମଧ୍ୟ ଉପଲବ୍ଧ।",
          hours:
            "ଆମର କଷ୍ଟମର ସେବା ଏହି ଚାଟ ମାଧ୍ୟମରେ 24/7 ଉପଲବ୍ଧ। ଆମର ଫୋନ ସପୋର୍ଟ ସୋମବାର-ଶୁକ୍ରବାର ସକାଳ 9ଟାରୁ ସନ୍ଧ୍ୟା 6ଟା ପର୍ଯ୍ୟନ୍ତ ଉପଲବ୍ଧ।",
          default: [
            "ଆପଣଙ୍କର ବାର୍ତ୍ତା ପାଇଁ ଧନ୍ୟବାଦ! ମୁଁ ସାହାଯ୍ୟ କରିବା ପାଇଁ ଏଠାରେ ଅଛି। ଆପଣ କହିପାରିବେ କି ଆପଣଙ୍କୁ କେଉଁ ପ୍ରକାରର ସାହାଯ୍ୟ ଦରକାର?",
            "ମୁଁ ବୁଝିପାରୁଛି ଯେ ଆପଣ ସାହାଯ୍ୟ ଖୋଜୁଛନ୍ତି। ଦେଖନ୍ତୁ ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି।",
            "ଏହା ଏକ ଉତ୍ତମ ପ୍ରଶ୍ନ! ମୋତେ ଆପଣଙ୍କୁ ଆବଶ୍ୟକ ସୂଚନା ପ୍ରଦାନ କରିବାକୁ ଦିଅନ୍ତୁ।",
            "ଏହାକୁ ସମାଧାନ କରିବାରେ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବା ପାଇଁ ମୁଁ ଏଠାରେ ଅଛି। ଆପଣ ନିର୍ଦ୍ଦିଷ୍ଟ ସମସ୍ୟା ବିଷୟରେ ଅଧିକ କହିପାରିବେ କି?",
          ],
        },
        as: {
          greeting:
            "নমস্কাৰ! মই আপোনাক সহায় কৰিবলৈ ইয়াত আছো। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰো?",
          order:
            "মই আপোনাৰ অৰ্ডাৰ ট্ৰেক কৰাত সহায় কৰিব পাৰো। অনুগ্ৰহ কৰি আপোনাৰ অৰ্ডাৰ নম্বৰ দিয়ক আৰু মই ইয়াক চাম।",
          payment:
            "আমি সকলো মুখ্য ক্ৰেডিট কাৰ্ড, UPI, PayPal, আৰু বেংক ট্ৰান্সফাৰ গ্ৰহণ কৰো। কোনো নিৰ্দিষ্ট পেমেণ্ট সমস্যা আছে নেকি?",
          return:
            "আমাৰ ৰিটাৰ্ণ নীতিয়ে ক্ৰয়ৰ 30 দিনৰ ভিতৰত ৰিটাৰ্ণৰ অনুমতি দিয়ে। আপুনি বিচাৰে নেকি যে মই আপোনাৰ বাবে ৰিটাৰ্ণ প্ৰক্ৰিয়া আৰম্ভ কৰো?",
          shipping:
            "আমি ষ্টেণ্ডাৰ্ড (5-7 দিন) আৰু এক্সপ্ৰেছ (2-3 দিন) শ্বিপিং আগবঢ়াওঁ। কেশ্ব অন ডেলিভাৰীও উপলব্ধ।",
          hours:
            "আমাৰ কাষ্টমাৰ সেৱা এই চেটৰ জৰিয়তে 24/7 উপলব্ধ। আমাৰ ফোন সাপোৰ্ট সোমবাৰ-শুক্ৰবাৰ ৰাতিপুৱা 9 বজাৰ পৰা সন্ধিয়া 6 বজালৈ উপলব্ধ।",
          default: [
            "আপোনাৰ বাৰ্তাৰ বাবে ধন্যবাদ! মই সহায় কৰিবলৈ ইয়াত আছো। আপুনি ক'ব পাৰিবনে যে আপোনাৰ কি ধৰণৰ সহায়ৰ প্ৰয়োজন?",
            "মই বুজি পাইছো যে আপুনি সহায় বিচাৰিছে। চাওঁ মই আপোনাক কেনেকৈ সহায় কৰিব পাৰো।",
            "এইটো এটা উত্তম প্ৰশ্ন! মোক আপোনাক প্ৰয়োজনীয় তথ্য প্ৰদান কৰিবলৈ দিয়ক।",
            "ইয়াক সমাধান কৰাত আপোনাক সহায় কৰিবলৈ মই ইয়াত আছো। আপুনি নিৰ্দিষ্ট সমস্যাৰ বিষয়ে অধিক ক'ব পাৰিবনে?",
          ],
        },
      };

      const currentBotResponses =
        botResponses[
          chatState.currentLanguage.code as keyof typeof botResponses
        ] || botResponses.en;

      if (
        lowerMessage.includes("hello") ||
        lowerMessage.includes("hi") ||
        lowerMessage.includes("hey") ||
        lowerMessage.includes("नमस्ते") ||
        lowerMessage.includes("হ্যালো") ||
        lowerMessage.includes("హలో")
      ) {
        response = currentBotResponses.greeting;
      } else if (
        lowerMessage.includes("order") ||
        lowerMessage.includes("track") ||
        lowerMessage.includes("ऑर्डर") ||
        lowerMessage.includes("অর্ডার") ||
        lowerMessage.includes("ఆర్డర్")
      ) {
        response = currentBotResponses.order;
      } else if (
        lowerMessage.includes("payment") ||
        lowerMessage.includes("pay") ||
        lowerMessage.includes("भुगतान") ||
        lowerMessage.includes("পেমেন্ট") ||
        lowerMessage.includes("చెల్లింపు")
      ) {
        response = currentBotResponses.payment;
      } else if (
        lowerMessage.includes("return") ||
        lowerMessage.includes("refund") ||
        lowerMessage.includes("वापसी") ||
        lowerMessage.includes("ফেরত") ||
        lowerMessage.includes("తిరిగి")
      ) {
        response = currentBotResponses.return;
      } else if (
        lowerMessage.includes("shipping") ||
        lowerMessage.includes("delivery") ||
        lowerMessage.includes("शिपिंग") ||
        lowerMessage.includes("ডেলিভারি") ||
        lowerMessage.includes("డెలివరీ")
      ) {
        response = currentBotResponses.shipping;
      } else if (
        lowerMessage.includes("hours") ||
        lowerMessage.includes("time") ||
        lowerMessage.includes("समय") ||
        lowerMessage.includes("সময়") ||
        lowerMessage.includes("సమయం")
      ) {
        response = currentBotResponses.hours;
      } else {
        response =
          currentBotResponses.default[
            Math.floor(Math.random() * currentBotResponses.default.length)
          ];
      }
    }

    try {
      addMessage(response, "bot");
      setNetworkError(false);
    } catch (error) {
      setNetworkError(true);
      addMessage(currentTranslations.networkError, "bot");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Rate limiting
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

    // Update speech recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = language.code;
    }

    // Add confirmation message in the NEW language
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
        // Language selector is in header - just show a message
        addMessage(
          "You can change the language using the globe icon in the header above.",
          "bot"
        );
        break;
      case "human":
        setIsConnectedToHuman(true);
        addMessage(currentTranslations.connectingHuman, "bot");

        // Simulate connection delay
        setTimeout(() => {
          addMessage(currentTranslations.humanConnected, "bot");
        }, 2000);
        break;
    }
  };

  const handleQuestionSelect = (question: string) => {
    setShowQuestions(false);
    setInputValue(question);
    // Auto-send the selected question
    setTimeout(() => {
      addMessage(question, "user");
      simulateBotResponse(question);
    }, 100);
  };

  const handleFeedback = (rating: number, comment: string) => {
    console.log("Feedback submitted:", {
      rating,
      comment,
      language: chatState.currentLanguage.code,
    });
    setShowFeedback(false);
    addMessage(currentTranslations.thanksFeedback, "bot");

    // Show end chat options after feedback
    setTimeout(() => {
      addMessage("Is there anything else I can help you with today?", "bot");
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

      <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-4 duration-300 bg-transparent"  >
        <Card className="flex flex-col h-[600px] max-h-[80vh] shadow-none border-0 overflow-hidden rounded-xl ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-500 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
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

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 chat-messages">
            {chatState.messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Welcome to LinguaBot!
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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

          {/* Quick Actions */}
          <QuickActions
            onCommonQuestions={() => handleQuickAction("common")}
            onChangeLanguage={() => handleQuickAction("language")}
            onTalkToHuman={() => handleQuickAction("human")}
            translations={currentTranslations}
            showQuestions={showQuestions}
            questions={currentQuestions}
            onQuestionSelect={handleQuestionSelect}
          />

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
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
                  className="pr-10 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={isListening}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceInput}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isListening ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() || chatState.isTyping || isListening
                }
                className="bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 hover:rotate-12"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Feedback Section */}
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
