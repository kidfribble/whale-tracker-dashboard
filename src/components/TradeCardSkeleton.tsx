const TradeCardSkeleton = () => {
  return (
    <div className="border p-4 rounded shadow bg-white">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"></div>
        <div className="h-4 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"></div>
        <div className="h-4 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"></div>
      </div>
    </div>
  );
};

export default TradeCardSkeleton;
