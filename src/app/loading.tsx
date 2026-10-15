export default function Loading() {
  return (
    <div className="container-x py-8">
      <div className="skeleton h-[360px] w-full rounded-3xl" />
      <div className="mt-8 grid grid-cols-4 gap-4 sm:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-full" />
        ))}
      </div>
    </div>
  );
}
