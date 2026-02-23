"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    category?: string;
    nanuAge?: number;
}

const CATEGORIES = ["All", "Funny Moments", "School Adventures", "Big Questions", "Family Fun", "Discoveries"];

export default function BlogListClient({ blogs }: { blogs: BlogPost[] }) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredBlogs = useMemo(() => {
        return blogs.filter((blog) => {
            const matchesSearch =
                search === "" ||
                blog.title.toLowerCase().includes(search.toLowerCase()) ||
                blog.excerpt.toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                activeCategory === "All" ||
                (blog.category && blog.category.toLowerCase() === activeCategory.toLowerCase());
            return matchesSearch && matchesCategory;
        });
    }, [blogs, search, activeCategory]);

    // Get unique categories from actual blog posts
    const allCategories = useMemo(() => {
        const cats = new Set<string>();
        blogs.forEach((b) => {
            if (b.category) cats.add(b.category);
        });
        return ["All", ...Array.from(cats)];
    }, [blogs]);

    const categoriesToShow = allCategories.length > 1 ? allCategories : CATEGORIES;

    return (
        <main className="min-h-screen px-6 py-12 md:py-20">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <Button asChild variant="ghost" className="mb-6 -ml-4 text-purple-400 hover:text-purple-700 hover:bg-purple-50">
                        <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back home</Link>
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight mb-4 text-purple-800">
                        Nanu&apos;s Stories 📖
                    </h1>
                    <p className="text-xl text-purple-400 mb-6">
                        All the funny, wild, and wonderful adventures — one story at a time! ✨
                    </p>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                        <Input
                            placeholder="Search stories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 border-purple-200 focus:border-purple-400 bg-white"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="flex flex-wrap gap-2">
                        {categoriesToShow.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${activeCategory === cat
                                        ? "bg-purple-600 text-white shadow-md"
                                        : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-5">
                    {filteredBlogs.map((blog) => (
                        <Card key={blog.slug} className="card-bounce bg-white border-purple-100 shadow-sm">
                            <CardHeader>
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 md:gap-0 pb-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <CardTitle className="text-2xl text-purple-800">
                                            <Link href={`/blog/${blog.slug}`} className="hover:underline decoration-purple-300">
                                                {blog.title}
                                            </Link>
                                        </CardTitle>
                                        {blog.category && (
                                            <Badge variant="secondary" className="text-xs">
                                                {blog.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {blog.nanuAge && (
                                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-500">
                                                Age {blog.nanuAge}
                                            </Badge>
                                        )}
                                        <time className="text-sm text-purple-400 whitespace-nowrap">
                                            {new Date(blog.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </time>
                                    </div>
                                </div>
                                <CardDescription className="text-purple-500 text-base">
                                    {blog.excerpt}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                    {filteredBlogs.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">🔍</div>
                            <p className="text-purple-400 text-lg">
                                {search ? `No stories found for "${search}"` : "No stories in this category yet!"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
