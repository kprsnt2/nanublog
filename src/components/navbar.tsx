"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";

const navLinks = [
    { href: "/", label: "Home", emoji: "🏠" },
    { href: "/blog", label: "Stories", emoji: "📖" },
    { href: "/timeline", label: "Timeline", emoji: "🌱" },
    { href: "/gallery", label: "Gallery", emoji: "📸" },
    { href: "/drawings", label: "Drawings", emoji: "🎨" },
    { href: "/ask-nanu", label: "Ask Nanu", emoji: "🗣️" },
    { href: "/tags", label: "Tags", emoji: "🏷️" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-purple-100 dark:border-purple-900 shadow-sm">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-14">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-black text-xl text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Nanu&apos;s World
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Button key={link.href} asChild variant="ghost" size="sm" className="text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                                <Link href={link.href}>
                                    <span className="mr-1">{link.emoji}</span> {link.label}
                                </Link>
                            </Button>
                        ))}
                        <ThemeToggle />
                    </div>

                    {/* Mobile buttons */}
                    <div className="flex items-center gap-1 md:hidden">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 dark:text-purple-300"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile nav */}
                {isOpen && (
                    <div className="md:hidden pb-4 border-t border-purple-100 dark:border-purple-800 mt-2 pt-2">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Button
                                    key={link.href}
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Link href={link.href}>
                                        <span className="mr-2">{link.emoji}</span> {link.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
