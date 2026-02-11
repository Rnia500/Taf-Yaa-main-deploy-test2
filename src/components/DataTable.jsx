// components/DataTable.jsx
import React, { useState, useMemo } from "react";
import Row from "../layout/containers/Row";
import Column from "../layout/containers/Column";
import Text from "./Text";
import Button from "./Button";
import SelectDropdown from "./SelectDropdown";
import { SearchInput } from "./Input";

const DataTable = ({
  columns,
  data,
  onRowClick,
  customSortOptions = [],
  customFilterOptions = [],
  enableSearch = true,
  enablePagination = false,
  initialPageSize = 10,
  showHeader = true,
  showControlsToggle = true,
  controlsInitiallyOpen = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");
  const [sortKey, setSortKey] = useState(null);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [controlsOpen, setControlsOpen] = useState(controlsInitiallyOpen);
  const [openFilter, setOpenFilter] = useState({});
  const [filterOrder, setFilterOrder] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  console.log("DataTable State:", { searchQuery, searchColumn });



  const handleRowClick = (row) => {
    if (onRowClick) onRowClick(row);
    setSelectedRow(row.id); // store person ID
  };

  const defaultSortOptions = useMemo(() => {
    return columns
      .filter((col) => col.sortable)
      .flatMap((col) => {
        if (col.type === "string") {
          return [
            {
              key: `${col.key}-asc`,
              label: `${col.header} (A → Z)`,
              fn: (a, b) =>
                (a[col.key] || "").localeCompare(b[col.key] || ""),
            },
            {
              key: `${col.key}-desc`,
              label: `${col.header} (Z → A)`,
              fn: (a, b) =>
                (b[col.key] || "").localeCompare(a[col.key] || ""),
            },
          ];
        }
        if (col.type === "number" || col.type === "date") {
          return [
            {
              key: `${col.key}-asc`,
              label: `${col.header} (Low → High)`,
              fn: (a, b) => (a[col.key] ?? 0) - (b[col.key] ?? 0),
            },
            {
              key: `${col.key}-desc`,
              label: `${col.header} (High → Low)`,
              fn: (a, b) => (b[col.key] ?? 0) - (a[col.key] ?? 0),
            },
          ];
        }
        return [];
      });
  }, [columns]);

  // 🔹 Process custom sort options to add fn if missing
  const processedCustomSortOptions = useMemo(() => {
    return customSortOptions.map((opt) => {
      if (opt.fn) return opt;
      const { key, dir, type } = opt;
      let fn;
      if (type === "string") {
        fn =
          dir === "asc"
            ? (a, b) => (a[key] || "").localeCompare(b[key] || "")
            : (a, b) => (b[key] || "").localeCompare(a[key] || "");
      } else if (type === "number" || type === "date") {
        fn =
          dir === "asc"
            ? (a, b) => (a[key] ?? 0) - (b[key] ?? 0)
            : (a, b) => (b[key] ?? 0) - (a[key] ?? 0);
      }
      return { key: opt.value || opt.key, label: opt.label, fn };
    });
  }, [customSortOptions]);

  const sortOptions = [...defaultSortOptions, ...processedCustomSortOptions];

  // 🔹 Generate default filter options from data
  const defaultFilterOptions = useMemo(() => {
    return columns
      .filter((col) => col.filterable)
      .map((col) => {
        const uniqueValues = [
          ...new Set(data.map((row) => row[col.key]).filter(Boolean)),
        ];
        return {
          key: col.key,
          label: col.header,
          options: uniqueValues.map((v) => ({ value: v, label: v })),
          fn: (row, value) => String(row[col.key]) === String(value), // default equality check
        };
      });
  }, [columns, data]);

  const filterOptions = [...defaultFilterOptions, ...customFilterOptions];

  // 🔹 Apply search, filters, and sorting
  const filteredData = useMemo(() => {
    let result = [...data];

    // search
    if (enableSearch && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) => {
        if (searchColumn === "all") {
          return columns.some(
            (col) =>
              col.searchable &&
              String(row[col.key] || "")
                .toLowerCase()
                .includes(q)
          );
        } else {
          return String(row[searchColumn] || "")
            .toLowerCase()
            .includes(q);
        }
      });
    }

    // filters (use fn if available, fallback otherwise)
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        const filterDef = filterOptions.find((f) => f.key === key);

        if (filterDef?.fn) {
          result = result.filter((row) => filterDef.fn(row, value));
        } else {
          result = result.filter(
            (row) => String(row[key]) === String(value)
          );
        }
      }
    }
    // sorting
    if (sortKey) {
      const sortFn = sortOptions.find((opt) => opt.key === sortKey)?.fn;
      if (sortFn) result.sort(sortFn);
    }

    return result;
  }, [data, searchQuery, searchColumn, filters, sortKey, columns, sortOptions, filterOptions]);

  // 🔹 Pagination
  const pageSize = initialPageSize;
  const totalPages = enablePagination
    ? Math.ceil(filteredData.length / pageSize)
    : 1;
  const pagedData = enablePagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  return (
    <Column gap="1rem">
      {showControlsToggle && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setControlsOpen((o) => !o)}
        >
          {controlsOpen ? "Hide Controls" : "Show Controls"}
        </Button>
      )}

      {controlsOpen && (
        <Column gap="0.5rem" fitContent alignItems="center" padding="0px" margin="0px">
          <Row gap="0.5rem" padding="0px" margin="1rem" fitContent alignItems="center" wrap>
            {/* search */}
            {enableSearch && (
              <Row gap="0.5rem" fitContent padding="5px" margin="0px">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search..."
                />
                <SelectDropdown
                  options={[
                    { value: "all", label: "All Columns" },
                    ...columns
                      .filter((c) => c.searchable)
                      .map((c) => ({ value: c.key, label: c.header }))
                  ]}
                  value={searchColumn}
                  onChange={(e) => setSearchColumn(e.target.value)}
                  placeholder="Search by"
                />
              </Row>
            )}

            {/* sorting */}
            {sortOptions.length > 0 && (
              <SelectDropdown
                options={[
                  ...sortOptions.map((opt) => ({
                    value: opt.key,
                    label: opt.label,
                  })),
                ]}
                value={sortKey || ""}
                onChange={(e) => setSortKey(e.target.value)}
                placeholder="Sort by."
              />
            )}
          </Row>
          {/* active filters sequence */}
          {filterOrder.length > 0 && (
            <Text style={{ fontSize: '0.9rem', color: 'var(--color-primary2)' }}>
              Filters sequence: {filterOrder.map((f, i) => (
                <span key={f.key}>
                  {columns.find(c => c.key === f.key)?.header}({f.label})
                  {i < filterOrder.length - 1 ? ' > ' : ''}
                </span>
              ))}
            </Text>
          )}
        </Column>
      )}

      {/* table */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--color-gray-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          {showHeader && (
            <thead>
              <tr style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary2)' }}>
                {columns.map((col) => (
                  <th key={col.key} style={{ padding: '12px 16px', textAlign: col.align || 'left', fontWeight: '600', borderBottom: '2px solid var(--color-primary)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                      {col.header}
                      {col.filterable && (
                        <button
                          onClick={() => setOpenFilter(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                          style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary2)', fontSize: '12px' }}
                        >
                          ▼
                        </button>
                      )}
                    </div>
                    {openFilter[col.key] && col.filterable && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'white', border: '1px solid var(--color-gray-light)', borderRadius: '4px', minWidth: '150px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <div
                          onClick={() => {
                            setFilters(prev => ({ ...prev, [col.key]: null }));
                            setFilterOrder(prev => prev.filter(f => f.key !== col.key));
                            setOpenFilter(prev => ({ ...prev, [col.key]: false }));
                          }}
                          style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--color-gray-light)', hover: { backgroundColor: 'var(--color-gray-lightest)' } }}
                        >
                          All
                        </div>
                        {(col.filterOptions || defaultFilterOptions.find(f => f.key === col.key)?.options || []).map(opt => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, [col.key]: opt.value }));
                              setFilterOrder(prev => {
                                const existing = prev.findIndex(f => f.key === col.key);
                                const newFilter = { key: col.key, value: opt.value, label: opt.label };
                                if (existing !== -1) {
                                  const updated = [...prev];
                                  updated[existing] = newFilter;
                                  return updated;
                                } else {
                                  return [...prev, newFilter];
                                }
                              });
                              setOpenFilter(prev => ({ ...prev, [col.key]: false }));
                            }}
                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--color-gray-light)', hover: { backgroundColor: 'var(--color-gray-lightest)' } }}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {pagedData.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                style={{
                  backgroundColor:
                    selectedRow === row.id
                      ? "var(--color-success-light)"
                      : i % 2 === 0
                        ? "var(--color-white)"
                        : "var(--color-gray-lightest)",
                  transition: "background-color 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  if (selectedRow !== row.id) {
                    e.currentTarget.style.backgroundColor = "var(--color-primary-lightest)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRow !== row.id) {
                    e.currentTarget.style.backgroundColor =
                      i % 2 === 0
                        ? "var(--color-white)"
                        : "var(--color-gray-lightest)";
                  }
                }}
              >


                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '12px 16px', textAlign: col.align || 'left', borderBottom: '1px solid var(--color-gray-light)' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {enablePagination && totalPages > 1 && (
        <Row gap="0.5rem" justifyContent="center">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Text>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </Row>
      )}
    </Column>
  );
};

export default DataTable;
