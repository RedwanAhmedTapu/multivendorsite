import React from "react";

type Spec = {
  id: string;
  name: string;
  type: string;
  options: string[];
  unit?: string | null;
};

type SpecFieldProps = {
  spec: Spec;
  value: any;
  onChange: (val: any) => void;
};

const SpecFieldRenderer: React.FC<SpecFieldProps> = ({ spec, value, onChange }) => {
  switch (spec.type) {
    case "TEXT":
      return (
        <input
          type="text"
          placeholder={spec.name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="border p-2 rounded w-full"
        />
      );

    case "NUMBER":
      return (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder={spec.name}
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
          {spec.unit && <span>{spec.unit}</span>}
        </div>
      );

    case "SELECT":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select {spec.name}</option>
          {spec.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "MULTISELECT":
      return (
        <select
          multiple
          value={value || []}
          onChange={(e) =>
            onChange(Array.from(e.target.selectedOptions, (opt) => opt.value))
          }
          className="border p-2 rounded w-full"
        >
          {spec.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "BOOLEAN":
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          {spec.name}
        </label>
      );

    default:
      return <p>Unsupported field type: {spec.type}</p>;
  }
};

export default SpecFieldRenderer;
