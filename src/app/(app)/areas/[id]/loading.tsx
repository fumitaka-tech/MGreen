export default function AreaDetailLoading() {
  return (
    <div className="page-stack animate-pulse">
      <div className="h-4 w-36 rounded bg-green-100" />
      <div className="mt-2 h-44 rounded-2xl bg-green-100" />
      <div className="space-y-3">
        <div className="h-6 w-20 rounded bg-green-100" />
        {[0, 1].map((item) => (
          <div key={item} className="h-16 rounded-2xl bg-green-100/80" />
        ))}
      </div>
    </div>
  );
}
