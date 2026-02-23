"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Twitter, Linkedin, Link2, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface SocialShareProps {
    slug: string;
    title: string;
}

export default function SocialShare({ slug, title }: SocialShareProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [canShare, setCanShare] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [url, setUrl] = useState("");

    useEffect(() => {
        setUrl(`${window.location.origin}/blog/${slug}`);
        setCanShare(typeof navigator !== "undefined" && !!navigator.share);
    }, [slug]);

    useEffect(() => {
        if (showQr && canvasRef.current && url) {
            QRCode.toCanvas(canvasRef.current, url, {
                width: 180,
                margin: 2,
                color: { dark: "#7C3AED", light: "#FFFFFF" },
            });
        }
    }, [showQr, url]);

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement("input");
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // User cancelled
            }
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-purple-500 dark:text-purple-400 font-semibold mr-1">
                <Share2 className="w-4 h-4 inline mr-1" />
                Share:
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 h-8 px-3"
                aria-label="Share on Twitter"
            >
                <Twitter className="w-3.5 h-3.5 mr-1.5" />
                Twitter
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={shareToLinkedIn}
                className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 h-8 px-3"
                aria-label="Share on LinkedIn"
            >
                <Linkedin className="w-3.5 h-3.5 mr-1.5" />
                LinkedIn
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 h-8 px-3"
                aria-label="Copy link"
            >
                {copied ? (
                    <>
                        <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                        Copied!
                    </>
                ) : (
                    <>
                        <Link2 className="w-3.5 h-3.5 mr-1.5" />
                        Copy Link
                    </>
                )}
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQr(!showQr)}
                className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 h-8 px-3"
                aria-label="Show QR code"
            >
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                QR
            </Button>

            {canShare && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={nativeShare}
                    className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 h-8 px-3 md:hidden"
                    aria-label="Share via device"
                >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    More
                </Button>
            )}

            {showQr && (
                <div className="w-full mt-3 flex justify-center">
                    <div className="bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-800 rounded-xl p-4 shadow-lg inline-block">
                        <p className="text-sm text-purple-600 dark:text-purple-300 font-semibold mb-2 text-center">
                            Scan to share! 📱
                        </p>
                        <canvas ref={canvasRef} className="rounded-lg mx-auto" />
                        <button
                            onClick={() => setShowQr(false)}
                            className="mt-2 text-xs text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 w-full text-center"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
