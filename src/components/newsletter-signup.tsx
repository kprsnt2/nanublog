"use client";

import { useState } from "react";
import { Mail, Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterSignup() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const buttondownUsername = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        if (!buttondownUsername) {
            // If no Buttondown username configured, show a friendly message
            setStatus("success");
            setMessage("Thanks! Newsletter coming soon 💌");
            setEmail("");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch(`https://api.buttondown.com/v1/subscribers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email_address: email }),
            });

            if (res.ok) {
                setStatus("success");
                setMessage("You're subscribed! 🎉");
                setEmail("");
            } else {
                setStatus("error");
                setMessage("Hmm, something went wrong. Try again?");
            }
        } catch {
            setStatus("error");
            setMessage("Couldn't connect. Please try again later.");
        }

        setTimeout(() => {
            setStatus("idle");
            setMessage("");
        }, 4000);
    };

    return (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-100 dark:border-purple-800 rounded-2xl p-6 md:p-8 text-center">
            <div className="text-3xl mb-2">💌</div>
            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                Get Nanu&apos;s Stories in Your Inbox!
            </h3>
            <p className="text-purple-500 dark:text-purple-400 text-sm mb-4 max-w-md mx-auto">
                Subscribe to get notified whenever Dad writes a new adventure about Nanu. No spam, just smiles! 😊
            </p>

            {status === "success" ? (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <Check className="w-5 h-5" />
                    {message}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300 dark:text-purple-500" />
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 border-purple-200 dark:border-purple-700 focus:border-purple-400 bg-white dark:bg-gray-900"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={status === "loading"}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {status === "loading" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-1.5" />
                                Subscribe
                            </>
                        )}
                    </Button>
                </form>
            )}

            {status === "error" && (
                <p className="text-red-500 text-sm mt-2">{message}</p>
            )}
        </div>
    );
}
