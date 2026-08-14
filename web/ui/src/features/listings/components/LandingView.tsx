import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Calendar, User, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  host: string;
  time: string;
  address: string;
  city: string;
  zipCode: string;
  images: string[];
}

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Vintage Furniture & Electronics Sale',
    description: 'Selling mid-century modern furniture, vintage stereos, speakers, record players, and assorted classic home decor. Everything must go!',
    host: 'Daniel Mejia',
    time: 'Saturday, August 22, 8:00 AM - 2:00 PM',
    address: '123 Pinecrest Lane',
    city: 'Seattle',
    zipCode: '98101',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: '2',
    title: 'Multi-Family Clothing & Toy Yard Sale',
    description: 'Huge collection of designer clothing, children\'s toys, board games, and outdoor equipment. Low prices and bundled deals available.',
    host: 'Sarah Jenkins',
    time: 'Sunday, August 23, 9:00 AM - 4:00 PM',
    address: '456 Oak Avenue',
    city: 'Portland',
    zipCode: '97201',
    images: [
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: '3',
    title: 'Tools, Books, and Collectibles Estate Sale',
    description: 'Professional power tools, gardening gear, thousands of science fiction books, vintage comics, and rare collectibles. Cash only.',
    host: 'Robert Chen',
    time: 'Saturday, August 22, 7:00 AM - 1:00 PM',
    address: '789 Maple Drive',
    city: 'Seattle',
    zipCode: '98103',
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&auto=format&fit=crop&q=80'
    ]
  }
];

const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  const { t } = useTranslation();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % listing.images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  return (
    <article className="group bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 flex flex-col h-full shadow-lg">
      {/* Image Carousel */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden group-hover:shadow-indigo-500/10">
        <img
          src={listing.images[currentImgIndex]}
          alt={`${listing.title} - ${currentImgIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />
        
        {/* Carousel Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

        {/* Carousel controls */}
        {listing.images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label={t('landing.carousel.prev')}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-white rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label={t('landing.carousel.next')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-white rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image count badge */}
        <span className="absolute bottom-2 right-2 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-md text-[10px] text-slate-300 font-medium">
          {t('landing.carousel.imageCounter', { current: currentImgIndex + 1, total: listing.images.length })}
        </span>
      </div>

      {/* Info Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
            {listing.title}
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-3">
            {listing.description}
          </p>
        </div>

        {/* Event Fields & Meta */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <User className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{t('landing.eventDetails.host', { host: listing.host })}</span>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{t('landing.eventDetails.time', { time: listing.time })}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{t('landing.eventDetails.address', { address: `${listing.address}, ${listing.city}, ${listing.zipCode}` })}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

const LandingView: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [hostFilter, setHostFilter] = useState('');

  // Filtering listings based on location search and host filter
  const filteredListings = mockListings.filter((listing) => {
    const query = searchTerm.toLowerCase();
    const locationMatch =
      listing.address.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query) ||
      listing.zipCode.toLowerCase().includes(query);

    const hostMatch = hostFilter
      ? listing.host.toLowerCase().includes(hostFilter.toLowerCase())
      : true;

    return locationMatch && hostMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setHostFilter('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Info */}
      <section className="text-center sm:text-left max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
          {t('landing.title')}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          {t('landing.subtitle')}
        </p>
      </section>

      {/* Filter / Search Dashboard Widget */}
      <section className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
        <div className="grid gap-4 md:grid-cols-3 items-end">
          {/* Location Search Input */}
          <div className="relative">
            <label htmlFor="location-search" className="sr-only">
              {t('landing.search.placeholder')}
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-500" />
              <input
                id="location-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('landing.search.placeholder')}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Host Filter Input */}
          <div className="relative flex items-center">
            <User className="absolute left-3 h-4 w-4 text-slate-500" />
            <input
              id="host-filter"
              type="text"
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
              placeholder={t('landing.search.filterHost')}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {hostFilter && (
              <button
                onClick={() => setHostFilter('')}
                className="absolute right-3 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear Filters Button */}
          <div>
            {(searchTerm || hostFilter) && (
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm transition-all cursor-pointer font-medium"
              >
                {t('landing.search.clear')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid of Listings */}
      <section>
        {filteredListings.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-500">{t('landing.search.noResults')}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingView;
