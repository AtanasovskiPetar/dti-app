import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { DrugSearch } from './components/DrugSearch';
import { ProteinSearch } from './components/ProteinSearch';
import { ResultDisplay } from './components/ResultDisplay';

function App() {
  const [selectedDrug, setSelectedDrug] = useState<{name: string, smiles: string | null}>({ name: '', smiles: null });
  const [selectedProtein, setSelectedProtein] = useState<{name: string, id: string, sequence: string | null}>({ 
    name: '', 
    id: '', 
    sequence: null 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!selectedDrug.smiles || !selectedProtein.sequence) {
      return;
    }

    setLoading(true);
    // Here you would make the actual API call to get the IC50 prediction
    // For now, we'll simulate a response
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResult(`Predicted IC50: ${(Math.random() * 100).toFixed(2)} nM`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Drug-Protein Interaction Analysis</h1>
          <p className="text-lg text-gray-600">Predict drug-protein interactions and IC50 values</p>
        </header>

        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <DrugSearch 
              onSelect={setSelectedDrug}
              selected={selectedDrug}
            />
            <ProteinSearch
              onSelect={setSelectedProtein}
              selected={selectedProtein}
            />
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleAnalyze}
              disabled={!selectedDrug.smiles || !selectedProtein.sequence || loading}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold
                       hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Analyze Interaction
                </>
              )}
            </button>
          </div>

          <ResultDisplay result={result} />
        </div>
      </main>

      <footer className="py-4 text-center text-gray-600 border-t border-gray-200 bg-white mt-auto">
        Made by &copy; Petar Atanasovski
      </footer>
    </div>
  );
}

export default App;