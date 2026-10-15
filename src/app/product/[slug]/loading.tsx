export default function Loading() {
  return (
    <div className="container-x pt-6">
      <div className="skeleton h-3 w-64" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-9 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton mt-6 h-10 w-40" />
          <div className="skeleton h-12 w-full rounded-full" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
