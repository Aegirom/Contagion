function Dropdown({ options = [], value, onChange, name }) {
  const selectBaseStyles =
    "bg-void border border-phantom text-gray-700 py-2 px-3 focus:outline-none focus:border-toxic cursor-pointer font-mono text-xs uppercase tracking-wider";

  return (
    <div className="flex flex-col">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={selectBaseStyles}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Dropdown;
