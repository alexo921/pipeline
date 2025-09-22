"use client";

import React, { useMemo, useState } from "react";

function parseNumber(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(value))
  );
}

export default function Calculator() {
  const [staffCount, setStaffCount] = useState<string>("");
  const [turnoverRate, setTurnoverRate] = useState<string>("");
  const [costPerTurnover, setCostPerTurnover] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const canEstimate = useMemo(() => {
    return parseNumber(staffCount) > 0 && parseNumber(turnoverRate) > 0 && parseNumber(costPerTurnover) > 0;
  }, [staffCount, turnoverRate, costPerTurnover]);

  function onEstimate(): void {
    const staff = parseNumber(staffCount);
    const ratePct = parseNumber(turnoverRate);
    const cost = parseNumber(costPerTurnover);

    // Estimated number of annual exits
    const estimatedExits = staff * (ratePct / 100);

    // Savings formula: value of preventing up to 5 exits (capped by estimated exits)
    const preventedExits = Math.min(5, estimatedExits);
    const savings = preventedExits * cost;

    const turnoverValue = estimatedExits * cost;
    setResult(
      `${formatCurrency(savings)} estimated savings by preventing ${preventedExits.toFixed(0)} exit${preventedExits === 1 ? "" : "s"}. ` +
        `(Estimated annual turnover cost: ${formatCurrency(turnoverValue)}).`
    );
  }

  return (
    <div className="container">
      <div className="bg-white rounded-3xl shadow-[0px_2px_8px_rgba(36,102,208,0.15),0px_8px_24px_rgba(36,102,208,0.25)] px-6 md:px-12 py-10">
        <h2 className="text-4xl font-bold text-[#2466D0] font-baloo text-center mb-4">What Turnover Really Costs Your Facility</h2>
        <p className="text-center text-[#01253F] max-w-4xl mx-auto mb-10">
          A 106-bed nursing facility with ~100 nursing staff loses over $500,000 a <br /> year to turnover. Even preventing a handful of exits pays off.
        </p>
        <div className="grid grid-cols-3 gap-1 md:gap-2 items-start justify-items-center max-w-[680px] mx-auto">
          <div>
            <label className="block text-center text-[#01253F] font-semibold mb-2">Nursing Staff Count</label>
            <input
              type="number"
              inputMode="numeric"
              value={staffCount}
              onChange={(e) => setStaffCount(e.target.value)}
              placeholder="Number of employees"
              className="mx-auto block rounded-full bg-white border border-[#E5E7EB] px-6 py-3 placeholder:text-gray-400 shadow-inner w-[90%] md:w-[85%]"
            />
          </div>
          <div>
            <label className="block text-center text-[#01253F] font-semibold mb-2">Turnover Rate (%)</label>
            <input
              type="number"
              inputMode="numeric"
              step="0.1"
              value={turnoverRate}
              onChange={(e) => setTurnoverRate(e.target.value)}
              placeholder="Turnover Rate (%)"
              className="mx-auto block rounded-full bg-white border border-[#E5E7EB] px-6 py-3 placeholder:text-gray-400 shadow-inner w-[90%] md:w-[85%]"
            />
          </div>
          <div>
            <label className="block text-center text-[#01253F] font-semibold mb-2">Cost per Turnover</label>
            <input
              type="number"
              inputMode="numeric"
              value={costPerTurnover}
              onChange={(e) => setCostPerTurnover(e.target.value)}
              placeholder="Cost per Turnover"
              className="mx-auto block rounded-full bg-white border border-[#E5E7EB] px-6 py-3 placeholder:text-gray-400 shadow-inner w-[90%] md:w-[85%]"
            />
          </div>
        </div>
        <div className="flex flex-col items-center mt-10 gap-4">
          <button
            onClick={onEstimate}
            disabled={!canEstimate}
            className={`px-8 py-4 rounded-full shadow-md transition duration-200 ease-in-out font-bold ${
              canEstimate ? "bg-[#2CB3BF] text-white hover:bg-[#2499A4]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Estimate Savings
          </button>
          {result && <p className="text-center text-[#01253F] max-w-2xl">{result}</p>}
        </div>
      </div>
    </div>
  );
}


