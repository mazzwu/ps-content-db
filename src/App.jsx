import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

const ContentDatabaseViewer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content');
      const items = await response.json();
      setData(items);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const contentTypes = ['All', ...new Set(data.map(item => item.contentType))];
  const sources = ['All', ...new Set(data.map(item => item.sourceName))];
  const categories = [...new Set(data.flatMap(item => (item.contentCategory || '').split(',').map(c => c.trim()).filter(Boolean)))];

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.contentSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || item.contentType === selectedType;
    const matchesSource = selectedSource === 'All' || item.sourceName === selectedSource;
    const itemCategories = (item.contentCategory || '').split(',').map(c => c.trim()).filter(Boolean);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(cat => itemCategories.includes(cat));
    return matchesSearch && matchesType && matchesSource && matchesCategory;
  }).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    }
    return new Date(a.dateAdded) - new Date(b.dateAdded);
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-light text-gray-900">Content Database</h1>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {contentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {sources.map(source => <option key={source} value={source}>{source}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category {selectedCategories.length > 0 && <button onClick={() => setSelectedCategories([])} className="text-xs text-blue-600 hover:text-blue-700 ml-2">Clear</button>}</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${selectedCategories.includes(category) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading content...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">{filteredData.length} {filteredData.length === 1 ? 'item' : 'items'} found</div>
            <div className="space-y-4">
              {filteredData.map(item => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{item.contentType}</span>
                        {(item.contentCategory || '').split(',').map(c => c.trim()).filter(Boolean).map(cat => <span key={cat} className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{cat}</span>)}
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{item.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(item.dateAdded)}
                        </span>
                        <span>{item.sourceName}</span>
                      </div>
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                      <span>View</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-gray-700 mb-3">{item.excerpt}</p>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{item.contentSummary}</p>
                  </div>
                </div>
              ))}
              {filteredData.length === 0 && (
                <div className="text-center py-12 text-gray-500">No content found matching your criteria.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContentDatabaseViewer;