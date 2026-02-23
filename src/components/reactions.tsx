"use client";

import reactionsData from "../../content/reactions.json";

const EMOJI_OPTIONS = ["❤️", "😂", "🥺", "🤩", "👏"];

export default function Reactions({ slug }: { slug: string }) {
    const allReactions = reactionsData as Record<string, Record<string, number>>;
    const postReactions = allReactions[slug] || {};

    return (
        <div className="flex flex-wrap gap-2 mt-6">
            {EMOJI_OPTIONS.map((emoji) => {
                const count = postReactions[emoji] || 0;
                return (
                    <div
                        key={emoji}
                        className="flex items-center gap-1 bg-purple-50 border border-purple-100 rounded-full px-3 py-1.5 text-sm hover:bg-purple-100 transition-colors cursor-default"
                    >
                        <span className="text-lg">{emoji}</span>
                        {count > 0 && <span className="text-purple-600 font-semibold">{count}</span>}
                    </div>
                );
            })}
        </div>
    );
}
