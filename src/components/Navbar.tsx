


export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-orange-100 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center md:justify-start items-center h-20">
                    <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">

                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                            Fibroscan <span className="text-transparent bg-clip-text bg-orange-600">Reclassification by Horizon Family Medical Group</span>
                        </h1>
                    </div>
                </div>
            </div>
        </header>
    )
}