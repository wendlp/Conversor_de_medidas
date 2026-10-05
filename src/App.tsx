import { useEffect, useMemo, useState } from "react";

type Category = "length" | "weight" | "temperature";
type BaseKey = "dec" | "bin" | "oct" | "hex";

type Unit = {
  value: string;
  label: string;
  symbol: string;
  factor?: number;
};

const categories: Record<Category, { label: string; units: Unit[] }> = {
  length: {
    label: "Comprimento",
    units: [
      { value: "m", label: "Metro", symbol: "m", factor: 1 },
      { value: "km", label: "Quilômetro", symbol: "km", factor: 1000 },
      { value: "cm", label: "Centímetro", symbol: "cm", factor: 0.01 },
      { value: "mm", label: "Milímetro", symbol: "mm", factor: 0.001 },
      { value: "mi", label: "Milha", symbol: "mi", factor: 1609.344 },
      { value: "yd", label: "Jarda", symbol: "yd", factor: 0.9144 },
      { value: "ft", label: "Pé", symbol: "ft", factor: 0.3048 },
      { value: "in", label: "Polegada", symbol: "in", factor: 0.0254 },
    ],
  },
  weight: {
    label: "Peso / Massa",
    units: [
      { value: "g", label: "Grama", symbol: "g", factor: 1 },
      { value: "kg", label: "Quilograma", symbol: "kg", factor: 1000 },
      { value: "mg", label: "Miligrama", symbol: "mg", factor: 0.001 },
      { value: "t", label: "Tonelada", symbol: "t", factor: 1_000_000 },
      { value: "lb", label: "Libra", symbol: "lb", factor: 453.59237 },
      { value: "oz", label: "Onça", symbol: "oz", factor: 28.349523125 },
    ],
  },
  temperature: {
    label: "Temperatura",
    units: [
      { value: "C", label: "Celsius", symbol: "°C" },
      { value: "F", label: "Fahrenheit", symbol: "°F" },
      { value: "K", label: "Kelvin", symbol: "K" },
    ],
  },
};

const baseFields: { key: BaseKey; label: string; hint: string }[] = [
  { key: "dec", label: "Decimal", hint: "Base 10" },
  { key: "bin", label: "Binário", hint: "Base 2" },
  { key: "oct", label: "Octal", hint: "Base 8" },
  { key: "hex", label: "Hexadecimal", hint: "Base 16" },
];

function Icon({
  name,
  size = 20,
}: {
  name: "calculator" | "units" | "binary" | "swap" | "copy" | "trash" | "check";
  size?: number;
}) {
  const paths = {
    calculator: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="3" />
        <path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </>
    ),
    units: (
      <>
        <path d="M4 7h16M4 17h16M7 4v6M11 4v3M17 14v6M13 17v3" />
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </>
    ),
    binary: (
      <>
        <path d="M8 5a2 2 0 0 0-2 2v3a2 2 0 0 0 4 0V7a2 2 0 0 0-2-2ZM17 5v7M15 7l2-2M7 16v3M5 18l2-2M16 15a2 2 0 0 0-2 2v1a2 2 0 0 0 4 0v-1a2 2 0 0 0-2-2Z" />
      </>
    ),
    swap: <path d="m7 7-4 4 4 4M3 11h14M17 17l4-4-4-4M21 13H7" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function formatResult(value: number) {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-7)) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }
  return Number(value.toPrecision(10)).toString();
}

function convertTemperature(value: number, from: string, to: string) {
  if (from === to) return value;
  const celsius = from === "C" ? value : from === "F" ? ((value - 32) * 5) / 9 : value - 273.15;
  if (to === "C") return celsius;
  return to === "F" ? (celsius * 9) / 5 + 32 : celsius + 273.15;
}

function UnitsConverter() {
  const [category, setCategory] = useState<Category>("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const units = categories[category].units;
  const result = useMemo(() => {
    const number = Number(value.replace(",", "."));
    if (!value.trim() || Number.isNaN(number)) return "";
    if (category === "temperature") return formatResult(convertTemperature(number, from, to));
    const fromFactor = units.find((unit) => unit.value === from)?.factor;
    const toFactor = units.find((unit) => unit.value === to)?.factor;
    return fromFactor && toFactor ? formatResult((number * fromFactor) / toFactor) : "";
  }, [category, from, to, units, value]);

  function changeCategory(next: Category) {
    const nextUnits = categories[next].units;
    setCategory(next);
    setFrom(nextUnits[0].value);
    setTo(nextUnits[1].value);
    setValue("");
    setCopied(false);
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const fromUnit = units.find((unit) => unit.value === from);
  const toUnit = units.find((unit) => unit.value === to);

  return (
    <section className="converter-panel" aria-label="Conversor de unidades">
      <div className="field full-field">
        <label htmlFor="category">Categoria</label>
        <div className="select-wrap">
          <select id="category" value={category} onChange={(event) => changeCategory(event.target.value as Category)}>
            {Object.entries(categories).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="conversion-grid">
        <div className="unit-column">
          <div className="field">
            <label htmlFor="from-unit">De</label>
            <div className="select-wrap">
              <select id="from-unit" value={from} onChange={(event) => setFrom(event.target.value)}>
                {units.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="unit-value">Valor</label>
            <div className="input-with-suffix">
              <input
                id="unit-value"
                inputMode="decimal"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="0"
                autoFocus
              />
              <span>{fromUnit?.symbol}</span>
            </div>
          </div>
        </div>

        <button
          className="swap-button"
          type="button"
          aria-label="Inverter unidades"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <Icon name="swap" />
        </button>

        <div className="unit-column">
          <div className="field">
            <label htmlFor="to-unit">Para</label>
            <div className="select-wrap">
              <select id="to-unit" value={to} onChange={(event) => setTo(event.target.value)}>
                {units.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="unit-result">Resultado</label>
            <div className="input-with-suffix result-input">
              <input id="unit-result" value={result} placeholder="0" readOnly />
              <span>{toUnit?.symbol}</span>
              <button className="copy-button" type="button" onClick={copyResult} disabled={!result} aria-label="Copiar resultado">
                <Icon name={copied ? "check" : "copy"} size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <p>{copied ? "Resultado copiado para a área de transferência." : "Insira um valor para converter instantaneamente."}</p>
        <button className="clear-button" type="button" onClick={() => setValue("")} disabled={!value}>
          <Icon name="trash" size={17} />
          Limpar
        </button>
      </div>
    </section>
  );
}

function parseInteger(value: string, base: BaseKey) {
  const radix = { dec: 10, bin: 2, oct: 8, hex: 16 }[base];
  const sign = value.startsWith("-") ? -1n : 1n;
  const unsigned = value.replace(/^-/, "");
  if (!unsigned) return null;
  try {
    const prefix = base === "bin" ? "0b" : base === "oct" ? "0o" : base === "hex" ? "0x" : "";
    return sign * BigInt(prefix + unsigned);
  } catch {
    return null;
  }
}

function sanitizeBase(value: string, base: BaseKey) {
  const patterns = { dec: /[^0-9-]/g, bin: /[^01-]/g, oct: /[^0-7-]/g, hex: /[^0-9a-f-]/gi };
  const cleaned = value.replace(patterns[base], "");
  return (cleaned.startsWith("-") ? "-" : "") + cleaned.replace(/-/g, "");
}

function BaseConverter() {
  const [source, setSource] = useState<BaseKey>("dec");
  const [rawValue, setRawValue] = useState("");
  const [copied, setCopied] = useState<BaseKey | null>(null);
  const parsed = useMemo(() => parseInteger(rawValue, source), [rawValue, source]);

  const values = useMemo<Record<BaseKey, string>>(() => {
    if (parsed === null) return { dec: "", bin: "", oct: "", hex: "" };
    return {
      dec: parsed.toString(10),
      bin: parsed.toString(2),
      oct: parsed.toString(8),
      hex: parsed.toString(16).toUpperCase(),
    };
  }, [parsed]);

  function updateField(key: BaseKey, nextValue: string) {
    setSource(key);
    setRawValue(sanitizeBase(nextValue, key));
    setCopied(null);
  }

  async function copyValue(key: BaseKey) {
    if (!values[key]) return;
    await navigator.clipboard.writeText(values[key]);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <section className="converter-panel base-panel" aria-label="Conversor de bases numéricas">
      <div className="base-intro">
        <div>
          <h2>Conversão simultânea</h2>
          <p>Digite em qualquer campo e veja os demais valores.</p>
        </div>
        <span className="integer-badge">Números inteiros</span>
      </div>

      <div className="base-grid">
        {baseFields.map((field) => (
          <div className={`base-field ${source === field.key && rawValue ? "active" : ""}`} key={field.key}>
            <label htmlFor={`base-${field.key}`}>
              <span>{field.label}</span>
              <small>{field.hint}</small>
            </label>
            <div className="base-input-wrap">
              <input
                id={`base-${field.key}`}
                value={values[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                placeholder="0"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => copyValue(field.key)}
                disabled={!values[field.key]}
                aria-label={`Copiar valor ${field.label}`}
              >
                <Icon name={copied === field.key ? "check" : "copy"} size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-footer">
        <p>{copied ? `${baseFields.find((field) => field.key === copied)?.label} copiado.` : "Compatível com valores inteiros positivos e negativos."}</p>
        <button className="clear-button" type="button" onClick={() => setRawValue("")} disabled={!rawValue}>
          <Icon name="trash" size={17} />
          Limpar
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"units" | "bases">("units");

  useEffect(() => {
    document.title = "Conversor Utilitário";
  }, []);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="app-card">
        <header className="app-header">
          <div className="brand-mark">
            <Icon name="calculator" size={25} />
          </div>
          <div>
            <h1>Conversor Utilitário</h1>
            <p>Conversões rápidas, precisas e sem complicação.</p>
          </div>
        </header>

        <nav className="tabs" aria-label="Tipos de conversor">
          <button
            className={activeTab === "units" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("units")}
            aria-selected={activeTab === "units"}
          >
            <Icon name="units" size={19} />
            Unidades
          </button>
          <button
            className={activeTab === "bases" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("bases")}
            aria-selected={activeTab === "bases"}
          >
            <Icon name="binary" size={20} />
            Bases numéricas
          </button>
        </nav>

        {activeTab === "units" ? <UnitsConverter /> : <BaseConverter />}
      </div>
      <p className="app-caption">Conversões processadas localmente no seu navegador.</p>
    </main>
  );
}
