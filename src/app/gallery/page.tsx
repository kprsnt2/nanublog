import { scanImagesFromFolder, groupImagesByMonth } from "@/lib/gallery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GalleryPage() {
    const photos = scanImagesFromFolder("gallery");
    const groupedPhotos = groupImagesByMonth(photos);

    return (
        <main className="min-h-screen px-6 py-12 md:py-20">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-purple-800 mb-4">
                        Photo Gallery 📸
                    </h1>
                    <p className="text-xl text-purple-400">
                        Snapshots of Nanu&apos;s adventures, smiles, and everything in between!
                    </p>
                    {photos.length > 0 && (
                        <Badge className="mt-3 text-sm px-3 py-1 bg-purple-100 text-purple-700 border-purple-200">
                            {photos.length} photo{photos.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>

                {photos.length > 0 ? (
                    <div className="space-y-12">
                        {Array.from(groupedPhotos.entries()).map(([monthYear, monthPhotos]) => (
                            <section key={monthYear}>
                                <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                                    <span className="text-xl">📅</span> {monthYear}
                                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-500 ml-2">
                                        {monthPhotos.length}
                                    </Badge>
                                </h2>
                                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                                    {monthPhotos.map((photo, i) => (
                                        <Card key={i} className="card-bounce bg-white border-purple-100 shadow-sm break-inside-avoid overflow-hidden">
                                            <img
                                                src={photo.src}
                                                alt={photo.filename}
                                                className="w-full h-auto object-cover"
                                                loading="lazy"
                                            />
                                            <CardContent className="pt-3 pb-3">
                                                {photo.dateFormatted && (
                                                    <p className="text-xs text-purple-400">
                                                        {photo.dateFormatted}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">📷</div>
                        <h3 className="text-2xl font-bold text-purple-700 mb-2">No photos yet!</h3>
                        <p className="text-purple-400 max-w-lg mx-auto">
                            Drop photos into the <code className="bg-purple-50 px-2 py-1 rounded text-sm">public/gallery/</code> folder.
                            Name them like <code className="bg-purple-50 px-2 py-1 rounded text-sm">IMG_20190614_220013.jpg</code> and
                            dates will be extracted automatically!
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
