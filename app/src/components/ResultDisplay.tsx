import React from 'react';

interface ResultDisplayProps {
  result: string | null;
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result) return null;

  return (
    <div className="mt-8 p-4 bg-emerald-50 rounded-lg">
      <h3 className="text-lg font-semibold text-emerald-900 mb-2">Analysis Result</h3>
      <p className="text-emerald-700">{result}</p>
    </div>
  );
}