export default function PlantDetailLoading() {
  return (
    <div className="page-stack animate-pulse">
      <div className="h-4 w-40 rounded bg-green-100" />
      <div className="mt-2 space-y-3">
        <div className="h-9 w-48 rounded-lg bg-green-100" />
        <div className="h-4 w-32 rounded bg-green-100" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-36 rounded bg-green-100" />
        <div className="h-60 rounded-2xl bg-green-100" />
        <div className="h-40 rounded-2xl bg-green-100/80" />
      </div>
    </div>
  );
}
