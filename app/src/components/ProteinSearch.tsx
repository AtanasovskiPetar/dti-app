import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface ProteinSearchProps {
  onSelect: (protein: { name: string; id: string; sequence: string | null }) => void;
  selected: { name: string; id: string; sequence: string | null };
}

interface ProteinResult {
  primaryAccession: string;
  proteinDescription: {
    recommendedName: {
      fullName: {
        value: string;
      };
    };
  };
}

export function ProteinSearch({ onSelect, selected }: ProteinSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProteinResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualFasta, setManualFasta] = useState('');
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
        `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(searchQuery)}&fields=accession,protein_name&size=6`
      );
      const data = await response.json();
      setSuggestions(data.results || []);
    } catch (error) {
      console.error('Error fetching protein suggestions:', error);
      setSuggestions([]);
    }
  };

  const fetchSequence = async (proteinId: string) => {
    try {
      const response = await fetch(`https://rest.uniprot.org/uniprotkb/${proteinId}.fasta`);
      const fasta = await response.text();
      // Remove the header line and join the sequence lines
      const sequence = fasta.split('\n').slice(1).join('').trim();
      return sequence;
    } catch (error) {
      console.error('Error fetching protein sequence:', error);
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

  const handleSelectProtein = async (protein: ProteinResult) => {
    setIsLoading(true);
    setShowSuggestions(false);
    setQuery(protein.proteinDescription.recommendedName.fullName.value);
    const sequence = await fetchSequence(protein.primaryAccession);
    onSelect({
      name: protein.proteinDescription.recommendedName.fullName.value,
      id: protein.primaryAccession,
      sequence
    });
    setIsLoading(false);
  };

  const handleManualFastaSubmit = () => {
    if (manualFasta.trim()) {
      onSelect({
        name: 'Custom Protein',
        id: 'custom',
        sequence: manualFasta.trim()
      });
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">Protein Name</label>
        <button
          onClick={() => {
            setIsManualMode(!isManualMode);
            setQuery('');
            setManualFasta('');
            setShowSuggestions(false);
            onSelect({ name: '', id: '', sequence: null });
          }}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          {isManualMode ? 'Search Database' : 'Enter FASTA Manually'}
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
            placeholder="Enter protein name..."
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
              <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.primaryAccession}
                    onClick={() => handleSelectProtein(suggestion)}
                    className="cursor-pointer px-4 py-2 hover:bg-emerald-50 text-gray-900"
                  >
                    <div className="font-medium">
                      {suggestion.proteinDescription.recommendedName.fullName.value}
                    </div>
                    <div className="text-sm text-gray-500">
                      {suggestion.primaryAccession}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={manualFasta}
            onChange={(e) => setManualFasta(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-emerald-500 focus:border-transparent h-24 resize-none"
            placeholder="Enter FASTA sequence..."
          />
          <button
            onClick={handleManualFastaSubmit}
            className="mt-2 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-md 
                     hover:bg-emerald-200 transition-colors duration-200"
          >
            Submit FASTA
          </button>
        </div>
      )}

      {selected.sequence && (
        <div className="mt-2 text-sm text-gray-500">
          <p className="font-medium">Selected Protein: {selected.name}</p>
          <p>ID: {selected.id}</p>
          <p className="truncate">Sequence: {selected.sequence}</p>
        </div>
      )}
    </div>
  );
}