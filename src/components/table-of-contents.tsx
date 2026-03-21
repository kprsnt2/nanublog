"use client";

import { useEffect, useState } from "react";
import { List, ChevronDown, ChevronUp } from "lucide-react";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

export default function TableOfContents({ htmlContent }: { htmlContent: string }) {
    const [headings, setHeadings] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Parse headings from the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        const elements = doc.querySelectorAll("h1, h2, h3");
        const items: TocItem[] = [];
        elements.forEach((el, index) => {
            const id = el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `heading-${index}`;
            items.push({
                id,
                text: el.textContent || "",
                level: parseInt(el.tagName[1]),
            });
        });
        setHeadings(items);
    }, [htmlContent]);

    useEffect(() => {
        if (headings.length === 0) return;

        // Add ids to actual DOM headings
        const articleEl = document.querySelector("article");
        if (!articleEl) return;
        const domHeadings = articleEl.querySelectorAll("h1, h2, h3");
        domHeadings.forEach((el, index) => {
            if (headings[index]) {
                el.id = headings[index].id;
            }
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-80px 0% -80% 0%" }
        );

        domHeadings.forEach((heading) => observer.observe(heading));
        return () => observer.disconnect();
    }, [headings]);

    if (headings.length < 2) return null;

    return (
        <>
            {/* Mobile: collapsible */}
            <div className="lg:hidden mb-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-700 dark:text-purple-300 font-semibold text-sm"
                >
                    <List className="w-4 h-4" />
                    Table of Contents
                    {isOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </button>
                {isOpen && (
                    <nav className="mt-2 px-4 py-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                        <ul className="space-y-1.5">
                            {headings.map((heading) => (
                                <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
                                    <a
                                        href={`#${heading.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className={`block text-sm py-0.5 transition-colors ${activeId === heading.id
                                            ? "text-purple-700 dark:text-purple-300 font-semibold"
                                            : "text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                            }`}
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>

            {/* Desktop: sticky sidebar */}
            <aside className="hidden lg:block fixed top-24 right-8 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-purple-100 dark:border-purple-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                        <List className="w-4 h-4" />
                        Contents
                    </div>
                    <nav>
                        <ul className="space-y-1">
                            {headings.map((heading) => (
                                <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 10}px` }}>
                                    <a
                                        href={`#${heading.id}`}
                                        className={`block text-xs py-0.5 transition-colors leading-snug ${activeId === heading.id
                                            ? "text-purple-700 dark:text-purple-300 font-semibold"
                                            : "text-purple-400 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-300"
                                            }`}
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </aside>
        </>
    );
}
