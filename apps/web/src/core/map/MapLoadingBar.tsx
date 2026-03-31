import { useIsFetching } from "@tanstack/react-query";

const MAP_QUERY_KEYS = [
  "youbike-stations",
  "parking-spaces",
  "bus-stations",
  "stops",
  "taipei-garbage-stops",
];

export default function MapLoadingBar() {
  const isFetching = useIsFetching({
    predicate: (query) =>
      MAP_QUERY_KEYS.includes(query.queryKey[0] as string),
  });

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 top-0 z-[1001] h-0.5 overflow-hidden transition-opacity duration-150 ${
        isFetching > 0 ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="progress-bar h-full w-full bg-primary" />
    </div>
  );
}
