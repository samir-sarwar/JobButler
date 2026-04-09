export default function Pagination({ total, limit, offset, onPageChange }) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const displaying = Math.min(limit, total - offset);

  return (
    <div className="flex items-center justify-between py-4 mt-2">
      <p className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant m-0">
        Displaying {String(displaying).padStart(2, '0')} items of {total} total
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onPageChange?.(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant hover:text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed bg-transparent border-none"
        >
          &larr; Previous Page
        </button>
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
          {currentPage}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange?.(offset + limit)}
          disabled={offset + limit >= total}
          className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant hover:text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed bg-transparent border-none"
        >
          Next Page &rarr;
        </button>
      </div>
    </div>
  );
}
