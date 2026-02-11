import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrev = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    const handlePageClick = (page) => {
        onPageChange(page);
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        // Add first page and ellipsis if needed
        if (start > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageClick(1)}
                    aria-label={`Go to page 1`}
                    className="w-8 h-9 mx-1 rounded-full font-semibold inline-flex items-center justify-center select-none transition-all duration-300 ease-in-out border-0 text-gray-700 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md focus:outline-none"
                >
                    1
                </button>
            );
            if (start > 2) {
                pages.push(
                    <span key="start-ellipsis" className="mx-1 text-gray-500 select-none">
                        ...
                    </span>
                );
            }
        }

        // Add visible page numbers
        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageClick(i)}
                    aria-label={`Go to page ${i}`}
                    className={`w-8 h-9 mx-1 rounded-full font-semibold inline-flex items-center justify-center select-none transition-all duration-300 ease-in-out border-0 focus:outline-none
                    ${i === currentPage
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-700 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md'
                        }`}
                >
                    {i}
                </button>
            );
        }

        // Add last page and ellipsis if needed
        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push(
                    <span key="end-ellipsis" className="mx-1 text-gray-500 select-none">
                        ...
                    </span>
                );
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageClick(totalPages)}
                    aria-label={`Go to page ${totalPages}`}
                    className="w-8 h-9 mx-1 rounded-full font-semibold inline-flex items-center justify-center select-none transition-all duration-300 ease-in-out border-0 text-gray-700 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md focus:outline-none"
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center mt-10 space-x-2 flex-wrap">
            {/* Previous Icon */}
            <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
                className="p-3 rounded-full bg-white text-gray-700 hover:text-black hover:bg-gray-50 shadow-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
            >
                <ChevronLeft size={18} />
            </button>

            {renderPageNumbers()}

            {/* Next Icon */}
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
                className="p-3 rounded-full bg-white text-gray-700 hover:text-black hover:bg-gray-50 shadow-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
