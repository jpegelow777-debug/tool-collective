// components/DynamicInput.js
export default function DynamicInput({ input, value, onChange }) {
  const baseClasses = 
    "w-full px-6 py-5 rounded-2xl bg-white border-2 border-gray-200 text-gray-900 text-lg font-medium " +
    "focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200 " +
    "transition-all duration-300 shadow-lg hover:shadow-xl";

  switch (input.type?.toLowerCase()) {
    case "text":
      return (
        <input
          type="text"
          required={input.required}
          value={value || ""}
          maxLength={input.maxLength || 500}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${input.label.toLowerCase()}...`}
          className={baseClasses}
        />
      );

    case "number":
      return (
        <input
          type="number"
          required={input.required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter number..."
          className={baseClasses}
        />
      );

    case "textarea":
      return (
        <textarea
          required={input.required}
          value={value || ""}
          maxLength={input.maxLength || 2000}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder={`Describe ${input.label.toLowerCase()}...`}
          className={`${baseClasses} resize-y min-h-[140px]`}
        />
      );

    case "radio":
      return (
        <div className="space-y-4 pt-2">
          {input.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group/label">
              <input
                type="radio"
                name={input.label}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
                className="w-5 h-5 accent-orange-500"
              />
              <span className="text-lg text-gray-800 group-hover/label:text-gray-900 transition-colors">
                {opt}
              </span>
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-4 pt-2">
          {input.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group/label">
              <input
                type="checkbox"
                value={opt}
                checked={value ? value.split(',').includes(opt) : false}
                onChange={(e) => {
                  const current = value ? value.split(',') : [];
                  const updated = e.target.checked 
                    ? [...current, opt] 
                    : current.filter(v => v !== opt);
                  onChange(updated.join(','));
                }}
                className="w-5 h-5 accent-orange-500 rounded"
              />
              <span className="text-lg text-gray-800 group-hover/label:text-gray-900 transition-colors">
                {opt}
              </span>
            </label>
          ))}
        </div>
      );

    case "select":
    default:
      return (
        <select
          required={input.required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} appearance-none cursor-pointer`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 1.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.2em",
          }}
        >
          <option value="">Select {input.label.toLowerCase()}…</option>
          {input.options?.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
  }
}
