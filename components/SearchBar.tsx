
import React, { useState } from 'react';
import SearchIcon from './icons/SearchIcon';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    onSearch(event.target.value); 
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(inputValue);
  };

  return (
    <form onSubmit={handleSubmit} className="relative shadow-xl rounded-lg">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="어떤 마사지를 찾으시나요? (예: 강남 타이마사지)"
        className="w-full pl-14 pr-12 py-4 border-2 border-transparent rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all text-gray-700 placeholder-gray-400 text-base"
      />
       {inputValue && (
         <button
            type="button"
            onClick={() => {
              setInputValue('');
              onSearch('');
            }}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
       )}
    </form>
  );
};

export default SearchBar;