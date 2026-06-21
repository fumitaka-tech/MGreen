export default function AppLoading() {
  return (
    <div className="page-stack animate-pulse">
      <div className="space-y-4">
        <div className="h-8 w-32 rounded-lg bg-green-100" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 rounded-2xl bg-green-100/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
