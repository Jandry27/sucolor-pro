export function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-transparent">
            {/* Header skeleton */}
            <div className="bg-white border-b border-[rgba(15,23,42,0.07)] h-14 flex items-center px-6">
                <div className="skeleton h-7 w-28 rounded-lg" />
                <div className="ml-auto flex gap-2">
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-7 w-24 rounded-lg" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
                {/* Order header card */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div className="flex justify-between mb-5">
                        <div>
                            <div className="skeleton h-3 w-24 rounded mb-2" />
                            <div className="skeleton h-7 w-28 rounded-lg" />
                            <div className="skeleton h-4 w-32 rounded mt-2" />
                        </div>
                        <div className="skeleton h-8 w-24 rounded-full" />
                    </div>
                    <div className="divider mb-5" />
                    <div className="grid grid-cols-5 gap-4 mb-5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i}>
                                <div className="skeleton h-2.5 w-10 rounded mb-2" />
                                <div className="skeleton h-4 w-14 rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="divider mb-5" />
                    <div className="flex gap-8">
                        <div className="skeleton h-4 w-28 rounded" />
                        <div className="skeleton h-4 w-28 rounded" />
                    </div>
                </div>

                {/* Progress card */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div className="flex justify-between mb-5">
                        <div className="skeleton h-4 w-36 rounded" />
                        <div className="skeleton h-4 w-8 rounded" />
                    </div>
                    <div className="skeleton h-1 w-full rounded-full mb-6" />
                    <div className="flex justify-between gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                <div className="skeleton w-8 h-8 rounded-full" />
                                <div className="skeleton h-2 w-8 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gallery card */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div className="skeleton h-4 w-32 rounded mb-4" />
                    <div className="skeleton h-8 w-48 rounded-lg mb-5" />
                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton aspect-square rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
