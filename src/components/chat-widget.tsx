"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat() as any;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 z-50 animate-bounce cursor-pointer border-none"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] shadow-2xl z-50 flex flex-col border-purple-200">
          <CardHeader className="bg-purple-600 text-white rounded-t-xl py-4 flex flex-row items-center justify-between shadow-sm">
            <CardTitle className="text-lg font-bold flex items-center gap-2 m-0 p-0 text-white">
              <Bot className="w-5 h-5 text-purple-200" />
              Ask About Nanu
            </CardTitle>
            <Button variant="ghost" size="icon" className="hover:bg-purple-700 text-white h-8 w-8 !mt-0 cursor-pointer" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-purple-50">
            {messages.length === 0 ? (
              <div className="text-center text-purple-400 mt-10 text-sm">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50 text-purple-600" />
                <p>Hi! I can answer questions about Nanu&apos;s World or pass a message to his Dad. What&apos;s on your mind?</p>
              </div>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-purple-200 text-purple-700' : 'bg-pink-100 text-pink-600'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none shadow-md' : 'bg-white text-purple-900 border border-purple-100 rounded-tl-none shadow-sm'}`}>
                      {m.role === 'assistant' && (m.toolInvocations && m.toolInvocations.length > 0) ? (
                        <div className="flex flex-col gap-1">
                          {m.toolInvocations.map((toolInvocation: any) => {
                             if (toolInvocation.state === 'result') {
                               return (
                                 <div key={toolInvocation.toolCallId} className="flex items-center gap-2 text-green-600 font-semibold text-xs italic">
                                   ✓ Message securely sent to {toolInvocation.toolName}!
                                 </div>
                               );
                             } else {
                               return (
                                 <div key={toolInvocation.toolCallId} className="flex items-center gap-2 text-pink-500 font-semibold text-xs italic">
                                   <Loader2 className="w-3 h-3 animate-spin" /> Transmitting data...
                                 </div>
                               );
                             }
                          })}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-purple-100 shadow-sm flex gap-1 items-center">
                        <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            )}
          </CardContent>

          <CardFooter className="p-3 bg-white border-t border-purple-100 rounded-b-xl border-x-0 border-b-0">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input 
                value={input} 
                onChange={handleInputChange} 
                placeholder="Type your message..." 
                className="flex-1 border-purple-200 focus-visible:ring-purple-400"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-purple-600 hover:bg-purple-700 shrink-0 cursor-pointer">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
