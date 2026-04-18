import { scanImagesFromFolder, groupImagesByMonth } from "@/lib/gallery";
import { getNanuAge } from "@/lib/blogs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Calculate Nanu's age at a given date */
function nanuAgeAt(date: Date): number {
    const birthday = new Date(2019, 2, 25); // March 25, 2019
    let age = date.getFullYear() - birthday.getFullYear();
    const monthDiff = date.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && date.getDate() < birthday.getDate())) {
        age--;
    }
    return Math.max(0, age);
}

export default function DrawingsPage() {
    const drawings = scanImagesFromFolder("drawings");
    const groupedDrawings = groupImagesByMonth(drawings);

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
                    {drawings.length > 0 && (
                        <Badge className="mt-3 text-sm px-3 py-1 bg-purple-100 text-purple-700 border-purple-200">
                            {drawings.length} drawing{drawings.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>

                {drawings.length > 0 ? (
                    <div className="space-y-12">
                        {Array.from(groupedDrawings.entries()).map(([monthYear, monthDrawings]) => (
                            <section key={monthYear}>
                                <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                                    <span className="text-xl">🖌️</span> {monthYear}
                                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-500 ml-2">
                                        {monthDrawings.length}
                                    </Badge>
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {monthDrawings.map((drawing, i) => (
                                        <Card key={i} className="card-bounce bg-white border-purple-100 shadow-sm overflow-hidden">
                                            <img
                                                src={drawing.src}
                                                alt={drawing.filename}
                                                className="w-full h-64 object-cover bg-yellow-50"
                                                loading="lazy"
                                            />
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-center justify-between">
                                                    {drawing.dateFormatted && (
                                                        <p className="text-xs text-purple-400">
                                                            {drawing.dateFormatted}
                                                        </p>
                                                    )}
                                                    {drawing.date && (
                                                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-500">
                                                            Age {nanuAgeAt(drawing.date)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">🎨</div>
                        <h3 className="text-2xl font-bold text-purple-700 mb-2">No drawings yet!</h3>
                        <p className="text-purple-400 max-w-lg mx-auto">
                            Drop Nanu&apos;s artwork into the <code className="bg-purple-50 px-2 py-1 rounded text-sm">public/drawings/</code> folder.
                            Name them like <code className="bg-purple-50 px-2 py-1 rounded text-sm">IMG_20190614_220013.jpg</code> and
                            dates will be extracted automatically!
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
