// src/components/TreeNotFound.js

import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

const TreeNotFound = () => {
  return (
    <div className="min-h-screen bg-[#fdfaf6] text-[#333] font-sans">
      {/* Header with Return Button and Search Bar */}
      <header className="p-4 sm:p-6 flex justify-between items-center">
        <button className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
          <ArrowLeft size={24} />
          <span className="hidden sm:inline">Return</span>
        </button>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={20} className="text-gray-400" />
          </span>
          <input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </header>

     
      <main className="flex flex-col items-center justify-center text-center px-4 pt-10 sm:pt-16">
        
        {/* Placeholder for the image/graphic */}
        <div className="w-full max-w-lg h-64 bg-[#a98f8f] rounded-lg mb-8"></div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          We couldn't find that tree...
        </h1>
        <p className="mt-3 text-gray-600 max-w-md">
          The link or code you used may be invalid, expired, or deleted.
        </p>

        <div className="mt-8 w-full max-w-sm flex flex-col gap-4">
          <input
            type="text"
            placeholder="Try different invite code"
            className="w-full px-4 py-3 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button className="w-full px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors">
            Scan another QR code
          </button>
          
          <a href="#" className="text-sm text-gray-500 underline hover:text-orange-600">
            Request link again from family admin
          </a>
          
          <button className="w-full mt-2 px-4 py-3 bg-[#f39c12] text-white font-bold rounded-md hover:bg-orange-600 transition-colors shadow-sm">
            Return to dashboard/home
          </button>
        </div>
      </main>
    </div>
  );
};

export default TreeNotFound;