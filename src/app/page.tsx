import Link from "next/link";
import profile from "../../content/profile.json";
import { getBlogPosts, getNanuAge } from "@/lib/blogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, ArrowRight, Heart, Sparkles, Clock, Bot } from "lucide-react";
import OnThisDay from "@/components/on-this-day";
import NewsletterSignup from "@/components/newsletter-signup";

const sectionLinks = [
  { href: "/blog", emoji: "📖", label: "Stories", description: "Funny adventures & memories" },
  { href: "/timeline", emoji: "🌱", label: "Timeline", description: "Growth milestones" },
  { href: "/gallery", emoji: "📸", label: "Gallery", description: "Photo memories" },
  { href: "/drawings", emoji: "🎨", label: "Drawings", description: "Nanu's artwork" },
  { href: "/ask-nanu", emoji: "🗣️", label: "Ask Nanu", description: "Yearly Q&A tracker" },
  { href: "/tags", emoji: "🏷️", label: "Tags", description: "Browse by category" },
];

export default function Home() {
  const recentBlogs = getBlogPosts().slice(0, 3);
  const nanuAge = getNanuAge();

  return (
    <main className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-4xl mx-auto space-y-16">

        {/* Hero Section */}
        <section className="text-center space-y-6 py-4">
          <div className="text-6xl mb-4">🌟</div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight fun-gradient">
            Nanu&apos;s World
          </h1>
          <p className="text-xl md:text-2xl text-purple-600 dark:text-purple-300 font-semibold">
            {profile.tagline}
          </p>
          <p className="text-lg text-purple-600 dark:text-purple-400 max-w-2xl mx-auto leading-relaxed">
            {profile.about}
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Badge className="text-base px-4 py-2 bg-purple-200 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700">
              <Sparkles className="w-4 h-4 mr-2" /> {nanuAge} years old
            </Badge>
            <Badge className="text-base px-4 py-2 bg-pink-200 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-700">
              <Heart className="w-4 h-4 mr-2" /> Created by Dad with love
            </Badge>
          </div>

          {profile.socials.github && (
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                <Link href={profile.socials.github} target="_blank">
                  <Github className="w-4 h-4 mr-2" /> Dad&apos;s GitHub
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Nanu's Favorites */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-center text-purple-800 dark:text-purple-200">
            Nanu&apos;s Favorite Things ⭐
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.favorites.map((fav: { emoji: string; label: string }, i: number) => (
              <Card key={i} className="card-bounce bg-white dark:bg-gray-900 border-purple-100 dark:border-purple-800 text-center shadow-sm">
                <CardContent className="pt-6 pb-4">
                  <div className="text-4xl mb-2">{fav.emoji}</div>
                  <p className="font-bold text-purple-700 dark:text-purple-300">{fav.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Explore Sections */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-center text-purple-800 dark:text-purple-200">
            Explore Nanu&apos;s World 🗺️
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sectionLinks.map((section) => (
              <Link key={section.href} href={section.href}>
                <Card className="card-bounce bg-white dark:bg-gray-900 border-purple-100 dark:border-purple-800 shadow-sm h-full hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                  <CardContent className="pt-6 pb-4 text-center">
                    <div className="text-4xl mb-2">{section.emoji}</div>
                    <p className="font-bold text-purple-700 dark:text-purple-300">{section.label}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">{section.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* On This Day */}
        <OnThisDay />

        {/* Recent Stories */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-bold tracking-tight text-purple-800 dark:text-purple-200">
              Latest Stories 📖
            </h2>
            <Button asChild variant="ghost" className="text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-900/30">
              <Link href="/blog">View all <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="space-y-5">
            {recentBlogs.map((blog) => (
              <Card key={blog.slug} className="card-bounce bg-white dark:bg-gray-900 border-purple-100 dark:border-purple-800 shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 md:gap-0 pb-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl text-purple-800 dark:text-purple-200">
                        <Link href={`/blog/${blog.slug}`} className="hover:underline decoration-purple-300 dark:decoration-purple-600">
                          {blog.title}
                        </Link>
                      </CardTitle>
                      {blog.category && (
                        <Badge variant="secondary" className="text-xs">{blog.category}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {blog.readingTime && (
                        <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {blog.readingTime} min
                        </Badge>
                      )}
                      {blog.aiModel && (
                        <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                          <Bot className="w-3 h-3 mr-1" />
                          {blog.aiModel}
                        </Badge>
                      )}
                      <time className="text-sm text-purple-600 dark:text-purple-500 whitespace-nowrap">
                        {new Date(blog.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
                  <CardDescription className="text-purple-700 dark:text-purple-400 text-base">
                    {blog.excerpt}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            {recentBlogs.length === 0 && (
              <Card className="bg-white dark:bg-gray-900 border-purple-100 dark:border-purple-800 shadow-sm">
                <CardContent className="py-12 text-center">
                  <div className="text-4xl mb-4">✨</div>
                  <p className="text-purple-400 dark:text-purple-500 text-lg">No stories yet! Dad needs to write some adventures... 📝</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <NewsletterSignup />

        {/* Footer */}
        <footer className="text-center py-8 text-purple-400 dark:text-purple-500 text-sm">
          <p>Made with ❤️ by Dad for Nanu • Powered by AI magic ✨</p>
        </footer>
      </div>
    </main>
  );
}
