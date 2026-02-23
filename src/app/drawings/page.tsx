import drawingsData from "../../../content/drawings.json";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Drawing {
    src: string;
    title: string;
    date: string;
    nanuAge: number;
}

export default function DrawingsPage() {
    const drawings: Drawing[] = drawingsData;

    return (
        <main className="min-h-screen px-6 py-12 md:py-20">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-purple-800 mb-4">
                        Nanu&apos;s Drawings 🎨
                    </h1>
                    <p className="text-xl text-purple-400">
                        Masterpieces by the one and only artist — Nanu! 🖌️
                    </p>
                </div>

                {drawings.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {drawings.map((drawing, i) => (
                            <Card key={i} className="card-bounce bg-white border-purple-100 shadow-sm overflow-hidden">
                                <img
                                    src={drawing.src}
                                    alt={drawing.title}
                                    className="w-full h-64 object-cover bg-yellow-50"
                                />
                                <CardContent className="pt-3 pb-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-purple-800">{drawing.title}</p>
                                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-500">
                                            Age {drawing.nanuAge}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-purple-400 mt-1">
                                        {new Date(drawing.date).toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">🎨</div>
                        <h3 className="text-2xl font-bold text-purple-700 mb-2">No drawings yet!</h3>
                        <p className="text-purple-400 max-w-lg mx-auto">
                            Nanu&apos;s artwork will appear here. Add drawings to <code className="bg-purple-50 px-2 py-1 rounded text-sm">public/drawings/</code> folder
                            and add entries to <code className="bg-purple-50 px-2 py-1 rounded text-sm">content/drawings.json</code>
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
