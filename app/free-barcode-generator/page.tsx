"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Download, RefreshCw, Barcode, CheckCircle2 } from "lucide-react";

const categories = [
  "Tissue",
  "Grocery",
  "Personal Care",
  "Home Care",
  "Apparel",
  "Electronics",
  "Other",
];

type FormState = {
  productName: string;
  brand: string;
  category: string;
  mrp: string;
  manufacturer: string;
  gstin: string;
};

type GeneratedRecord = FormState & {
  barcodeNumber: string;
  createdAt: string;
};

const initialForm: FormState = {
  productName: "",
  brand: "",
  category: "",
  mrp: "",
  manufacturer: "",
  gstin: "",
};

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function calculateEAN13CheckDigit(base12: string): string {
  if (!/^\d{12}$/.test(base12)) {
    throw new Error("Base must be exactly 12 digits");
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(base12[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const remainder = sum % 10;
  return String(remainder === 0 ? 0 : 10 - remainder);
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000000000;
  }
  return String(hash).padStart(9, "0");
}

function generateUniqueEAN13(form: FormState): string {
  const seed = [
    form.productName.trim().toLowerCase(),
    form.brand.trim().toLowerCase(),
    form.category.trim().toLowerCase(),
    form.mrp.trim(),
    form.manufacturer.trim().toLowerCase(),
    form.gstin.trim().toUpperCase(),
    Date.now().toString(),
    Math.random().toString(),
  ].join("|");

  const unique9 = simpleHash(seed);
  const base12 = `890${unique9}`;
  const checkDigit = calculateEAN13CheckDigit(base12);
  return `${base12}${checkDigit}`;
}

function isValidGSTIN(value: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(
    value.trim().toUpperCase()
  );
}

export default function FreeBarcodeGeneratorByBaiko() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [generated, setGenerated] = useState<GeneratedRecord | null>(null);
  const [history, setHistory] = useState<GeneratedRecord[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("baiko-barcode-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("baiko-barcode-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!generated?.barcodeNumber || !canvasRef.current) return;

    JsBarcode(canvasRef.current, generated.barcodeNumber, {
      format: "EAN13",
      displayValue: true,
      fontSize: 18,
      margin: 18,
      width: 2,
      height: 100,
      background: "#ffffff",
    });
  }, [generated]);

  const isFormComplete = useMemo(() => {
    return Object.values(form).every((value) => value.trim() !== "");
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.productName.trim()) nextErrors.productName = "Product name is required";
    if (!form.brand.trim()) nextErrors.brand = "Brand is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";
    if (!form.mrp.trim()) nextErrors.mrp = "MRP is required";
    if (!form.manufacturer.trim()) nextErrors.manufacturer = "Manufacturer is required";
    if (!form.gstin.trim()) {
      nextErrors.gstin = "GSTIN is required";
    } else if (!isValidGSTIN(form.gstin)) {
      nextErrors.gstin = "Enter a valid GSTIN";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleGenerate() {
    if (!validateForm()) return;

    const barcodeNumber = generateUniqueEAN13(form);
    const record: GeneratedRecord = {
      ...form,
      gstin: form.gstin.trim().toUpperCase(),
      barcodeNumber,
      createdAt: new Date().toLocaleString(),
    };

    setGenerated(record);
    setHistory((prev) => [record, ...prev].slice(0, 10));
  }

  function handleReset() {
    setForm(initialForm);
    setErrors({});
    setGenerated(null);
  }

  function downloadJpg() {
    const canvas = canvasRef.current;
    if (!canvas || !generated) return;

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a");
    const safeName = `${generated.brand}-${generated.productName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    link.href = dataUrl;
    link.download = `${safeName || "barcode"}.jpg`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <Barcode className="h-3.5 w-3.5" />
                  Free Barcode Generator by Baiko
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Generate a valid 13-digit EAN barcode in seconds
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
                  Enter your product details, auto-generate a barcode number starting with 890,
                  preview the barcode instantly, and download it as a JPG.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Product Name"
                value={form.productName}
                onChange={(value) => updateField("productName", value)}
                placeholder="e.g. Bamboo Facial Tissue"
                error={errors.productName}
              />

              <Field
                label="Brand"
                value={form.brand}
                onChange={(value) => updateField("brand", value)}
                placeholder="e.g. Baiko"
                error={errors.brand}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-200">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-emerald-400/60"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-neutral-900">
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="mt-2 text-xs text-red-400">{errors.category}</p>
                ) : null}
              </div>

              <Field
                label="MRP (₹)"
                value={form.mrp}
                onChange={(value) => updateField("mrp", sanitizeDigits(value))}
                placeholder="e.g. 99"
                error={errors.mrp}
              />

              <Field
                label="Manufacturer"
                value={form.manufacturer}
                onChange={(value) => updateField("manufacturer", value)}
                placeholder="e.g. Baiko Life Pvt Ltd"
                error={errors.manufacturer}
              />

              <Field
                label="GSTIN"
                value={form.gstin}
                onChange={(value) => updateField("gstin", value.toUpperCase())}
                placeholder="e.g. 09ABCDE1234F1Z5"
                error={errors.gstin}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isFormComplete}
              >
                <Barcode className="h-4 w-4" />
                Generate Barcode
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Disclaimer</p>
              <p className="mt-2">
                Free Barcode Generator by Baiko creates valid barcode images and EAN-13 style numbers for demo,
                internal, testing, trial launch, inventory, local GT markets, and private-use purposes. Generated numbers are not guaranteed to be
                officially registered GS1 identifiers or globally unique retail GTINs.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white p-6 text-neutral-900 shadow-2xl md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">Preview</p>
                <h2 className="text-2xl font-semibold tracking-tight">Generated barcode</h2>
              </div>
              {generated ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to download
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              {generated ? (
                <>
                  <div className="grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                    <InfoRow label="Product" value={generated.productName} />
                    <InfoRow label="Brand" value={generated.brand} />
                    <InfoRow label="Category" value={generated.category} />
                    <InfoRow label="MRP" value={`₹${generated.mrp}`} />
                    <InfoRow label="Manufacturer" value={generated.manufacturer} />
                    <InfoRow label="GSTIN" value={generated.gstin} />
                  </div>

                  <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">EAN-13 Number</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[0.15em]">
                      {generated.barcodeNumber}
                    </p>

                    <div className="mt-5 overflow-x-auto rounded-2xl bg-white p-2">
                      <canvas ref={canvasRef} className="mx-auto max-w-full" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={downloadJpg}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    <Download className="h-4 w-4" />
                    Download JPG
                  </button>
                </>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 text-center">
                  <div className="rounded-2xl bg-neutral-100 p-4">
                    <Barcode className="h-8 w-8 text-neutral-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No barcode generated yet</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                    Fill the product form and click Generate Barcode to create a unique 13-digit
                    EAN code beginning with 890.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Recent history
                </h3>
                {history.length > 0 ? (
                  <span className="text-xs text-neutral-400">Stored locally in browser</span>
                ) : null}
              </div>

              <div className="space-y-3">
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <div
                      key={`${item.barcodeNumber}-${index}`}
                      className="rounded-2xl border border-neutral-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900">{item.productName}</p>
                          <p className="text-sm text-neutral-500">
                            {item.brand} • {item.category} • ₹{item.mrp}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tracking-[0.12em] text-neutral-700">
                          {item.barcodeNumber}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">No generated records yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-200">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-400/60"
      />
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      <p className="mt-1 font-medium text-neutral-900">{value}</p>
    </div>
  );
}
