export default function Loading() {
  return (
    <div className="w-[min(1180px,calc(100%-32px))] mx-auto py-14 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[#e5eadc] rounded-full" />
      <div className="h-12 w-3/4 max-w-xl bg-[#e5eadc] rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <div className="h-[320px] bg-white border border-pc-line rounded-[20px]" />
        <div className="h-[320px] bg-white border border-pc-line rounded-[20px]" />
        <div className="h-[320px] bg-white border border-pc-line rounded-[20px]" />
      </div>
    </div>
  );
}

