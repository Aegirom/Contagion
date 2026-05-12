import React from "react";
import Dropdown from "./Dropdown";

function SearchBar({ filters, onFilterChange }) {
  const inputBaseStyles =
    "bg-void border border-phantom text-gray-900 py-2 px-4 focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/30 transition-all duration-200 placeholder:text-gray-500 font-mono text-sm";
  const selectBaseStyles =
    "bg-void border border-phantom text-gray-700 py-2 px-3 focus:outline-none focus:border-toxic cursor-pointer font-mono text-xs uppercase tracking-wider";

  // Helper to update specific filter keys
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-abyss border-b border-phantom">
      {/* Search Input */}
      <div className="relative flex-grow max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-toxic/50 font-mono pointer-events-none">
          {">"}
        </span>
        <input
          name="query"
          type="text"
          value={filters.query}
          onChange={handleChange}
          placeholder="Search Submissions..."
          className={`${inputBaseStyles} w-full pl-8`}
        />
      </div>

      {/* Status Filter */}
      <Dropdown
        options={[
          { value: "all", label: "All Status" },
          { value: "Draft", label: "Draft" },
          { value: "Pending", label: "Pending" },
          { value: "Published", label: "Published" },
          { value: "Archived", label: "Archived" },
        ]}
        onChange={handleChange}
        value={filters.status}
        name="status"
      />

      {/* Family Filter */}
      <Dropdown
        name="family"
        value={filters.family}
        onChange={handleChange}
        options={[
          { value: "all", label: "All Families" },
          { value: "Ransomware", label: "Ransomware" },
          { value: "Trojan", label: "Trojan" },
          { value: "Worm", label: "Worm" },
          { value: "APT", label: "APT" },
          { value: "Rootkit", label: "Rootkit" },
          { value: "Spyware", label: "Spyware" },
          { value: "Other", label: "Other" },
        ]}
      />

      {/* Terminal Pulse Indicator */}
      <div className="ml-auto flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-toxic animate-pulse shadow-[0_0_8px_#22C55E]"></div>
        <span className="text-[10px] text-toxic font-mono font-bold uppercase tracking-widest">
          Live Uplink
        </span>
      </div>
    </div>
  );
}

export default SearchBar;
