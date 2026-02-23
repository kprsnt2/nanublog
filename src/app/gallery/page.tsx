import galleryData from "../../../content/gallery.json";
import { Card, CardContent } from "@/components/ui/card";

interface Photo {
    src: string;
    caption: string;
    date: string;
    category: string;
}

export default function GalleryPage() {
    const photos: Photo[] = galleryData;

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
                </div>

                {photos.length > 0 ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                        {photos.map((photo, i) => (
                            <Card key={i} className="card-bounce bg-white border-purple-100 shadow-sm break-inside-avoid overflow-hidden">
                                <img
                                    src={photo.src}
                                    alt={photo.caption}
                                    className="w-full h-auto object-cover"
                                />
                                <CardContent className="pt-3 pb-3">
                                    <p className="font-semibold text-purple-800 text-sm">{photo.caption}</p>
                                    <p className="text-xs text-purple-400 mt-1">
                                        {new Date(photo.date).toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric",
                                        })}
                                        {photo.category && ` · ${photo.category}`}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">📷</div>
                        <h3 className="text-2xl font-bold text-purple-700 mb-2">No photos yet!</h3>
                        <p className="text-purple-400 max-w-lg mx-auto">
                            Dad will add photos here soon. To add photos, put images in the <code className="bg-purple-50 px-2 py-1 rounded text-sm">public/gallery/</code> folder
                            and add entries to <code className="bg-purple-50 px-2 py-1 rounded text-sm">content/gallery.json</code>
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
