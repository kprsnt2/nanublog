import Link from 'next/link';
import { getBlogPosts } from '@/lib/blogs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BlogList() {
    const blogs = getBlogPosts();

    return (
        <main className="min-h-screen px-6 py-12 md:py-24">
            <div className="max-w-3xl mx-auto space-y-12">
                <div>
                    <Button asChild variant="ghost" className="mb-8 -ml-4 text-purple-400 hover:text-purple-700 hover:bg-purple-50">
                        <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back home</Link>
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight mb-4 text-purple-800">
                        Nanu&apos;s Stories 📖
                    </h1>
                    <p className="text-xl text-purple-400">
                        All the funny, wild, and wonderful adventures — one story at a time! ✨
                    </p>
                </div>

                <div className="space-y-5">
                    {blogs.map((blog) => (
                        <Card key={blog.slug} className="card-bounce bg-white border-purple-100 shadow-sm">
                            <CardHeader>
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 md:gap-0 pb-2">
                                    <div className="flex items-center gap-3">
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
                                            {new Date(blog.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
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
                    {blogs.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📝</div>
                            <p className="text-purple-400 text-lg">No stories yet! Dad&apos;s working on it... 😄</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
