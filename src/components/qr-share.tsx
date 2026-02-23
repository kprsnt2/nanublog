"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

export default function QrShare({ slug }: { slug: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const url = typeof window !== "undefined" ? `${window.location.origin}/blog/${slug}` : `/blog/${slug}`;
            QRCode.toCanvas(canvasRef.current, url, {
                width: 200,
                margin: 2,
                color: { dark: "#7C3AED", light: "#FFFFFF" },
            });
        }
    }, [isOpen, slug]);

    return (
        <div className="relative inline-block">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
                <Share2 className="w-4 h-4 mr-2" /> Share Story
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-12 bg-white border border-purple-100 rounded-xl shadow-xl p-4 z-50">
                    <p className="text-sm text-purple-600 font-semibold mb-2 text-center">Scan to share! 📱</p>
                    <canvas ref={canvasRef} className="rounded-lg" />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-600 w-full text-center"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
