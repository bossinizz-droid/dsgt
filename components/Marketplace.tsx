
import React, { useState } from 'react';
import { Item, ItemCategory } from '../types';

interface MarketplaceProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ items, onSelectItem }) => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | '전체'>('전체');

  const filteredItems = activeCategory === '전체' 
    ? items 
    : items.filter(i => i.category === activeCategory);

  const categories: (ItemCategory | '전체')[] = ['전체', ...Object.values(ItemCategory)];

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              activeCategory === cat 
                ? 'bg-teal-600 text-white shadow-md shadow-teal-200' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div 
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative"
          >
            <div className="aspect-square relative overflow-hidden">
              <img 
                src={item.imageUrls[0]} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.isAuction && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                  🔥 CEO 경매
                </div>
              )}
              {item.donationPercent === 100 && (
                <div className="absolute top-2 right-2 bg-teal-500/90 text-white p-1.5 rounded-full shadow-sm">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wide">{item.category}</span>
                <span className="text-[10px] font-medium text-gray-400">{item.team}</span>
              </div>
              <h4 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-teal-600 transition-colors">{item.title}</h4>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-gray-900">
                  {item.isAuction ? `₩ ${item.currentBid?.toLocaleString()}` : `₩ ${item.price.toLocaleString()}`}
                </span>
                <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-bold">
                   {item.condition.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
