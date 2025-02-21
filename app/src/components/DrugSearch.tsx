import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface DrugSearchProps {
  onSelect: (drug: { name: string; smiles: string | null }) => void;
  selected: { name: string; smiles: string | null };
}

export function DrugSearch({ onSelect, selected }: DrugSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualSmiles, setManualSmiles] = useState('');
  const timeoutRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(searchQuery)}/json?limit=6`
      );
      const data = await response.json();
      setSuggestions(data.dictionary_terms?.compound || []);
    } catch (error) {
      console.error('Error fetching drug suggestions:', error);
      setSuggestions([]);
    }
  };

  const fetchSmiles = async (drugName: string) => {
    try {
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(drugName)}/property/CanonicalSMILES/TXT`
      );
      const smiles = await response.text();
      return smiles.trim();
    } catch (error) {
      console.error('Error fetching SMILES:', error);
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      fetchSuggestions(newQuery);
    }, 300);
  };

  const handleSelectDrug = async (drugName: string) => {
    setIsLoading(true);
    setShowSuggestions(false);
    setQuery(drugName);
    const smiles = await fetchSmiles(drugName);
    onSelect({ name: drugName, smiles });
    setIsLoading(false);
  };

  const handleManualSmilesSubmit = () => {
    if (manualSmiles.trim()) {
      onSelect({ name: 'Custom Compound', smiles: manualSmiles.trim() });
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">Drug Name</label>
        <button
          onClick={() => {
            setIsManualMode(!isManualMode);
            setQuery('');
            setManualSmiles('');
            setShowSuggestions(false);
            onSelect({ name: '', smiles: null });
          }}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          {isManualMode ? 'Search Database' : 'Enter SMILES Manually'}
        </button>
      </div>

      {!isManualMode ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter drug name..."
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
              <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectDrug(suggestion)}
                    className="cursor-pointer px-4 py-2 hover:bg-emerald-50 text-gray-900"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={manualSmiles}
            onChange={(e) => setManualSmiles(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-emerald-500 focus:border-transparent h-24 resize-none"
            placeholder="Enter SMILES notation..."
          />
          <button
            onClick={handleManualSmilesSubmit}
            className="mt-2 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-md 
                     hover:bg-emerald-200 transition-colors duration-200"
          >
            Submit SMILES
          </button>
        </div>
      )}

      {selected.smiles && (
        <div className="mt-2 text-sm text-gray-500">
          <p className="font-medium">Selected Drug: {selected.name}</p>
          <p className="truncate">SMILES: {selected.smiles}</p>
        </div>
      )}
    </div>
  );
}