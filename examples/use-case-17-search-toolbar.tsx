type SearchToolbarProps = {
  query?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
};

export function SearchToolbar({ query = "", onSearch, onClear }: SearchToolbarProps) {
  return (
    <section className="search-toolbar" aria-label="Search toolbar">
      <input
        className="search-input"
        role="searchbox"
        name="query"
        value={query}
        aria-label="Search"
        placeholder="Search items"
      />
      <button className="search-button" name="search" onClick={() => onSearch?.(query)}>
        Search
      </button>
      {query ? (
        <button className="clear-button" name="clear" onClick={onClear}>
          Clear
        </button>
      ) : null}
    </section>
  );
}
