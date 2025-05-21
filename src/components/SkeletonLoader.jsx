const SkeletonLoader = ({ rows = 3, showButton = true }) => {
    return (
        <div className="animate-pulse space-y-4">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div> {/* Title */}
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div> {/* Subtitle */}
                        </div>
                        {showButton && <div className="h-8 bg-gray-200 rounded w-20"></div>} {/* Button */}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;