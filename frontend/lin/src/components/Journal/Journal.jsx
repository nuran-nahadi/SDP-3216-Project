import React, { useState, useEffect } from 'react';

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    weather: '',
    location: ''
  });

  const baseURL = "http://127.0.0.1:8000";

  const moodOptions = [
    { value: 'very_happy', label: '😄 Very Happy', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'happy', label: '😊 Happy', color: 'text-green-500', bg: 'bg-green-50' },
    { value: 'excited', label: '🤩 Excited', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'grateful', label: '🙏 Grateful', color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'neutral', label: '😐 Neutral', color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'anxious', label: '😰 Anxious', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'sad', label: '😢 Sad', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'very_sad', label: '😭 Very Sad', color: 'text-blue-700', bg: 'bg-blue-200' },
    { value: 'angry', label: '😠 Angry', color: 'text-red-600', bg: 'bg-red-100' },
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      console.log('Fetching journal entries from:', `${baseURL}/journal/`);
      const response = await fetch(`${baseURL}/journal/`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Journal data received:', data);
      
      if (data.success) {
        setEntries(data.data || []);
        setMessage('');
      } else {
        setMessage(`Error: ${data.message || 'Failed to fetch journal entries'}`);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setMessage(`Error fetching journal entries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      mood: '',
      weather: '',
      location: ''
    });
    setShowAddForm(false);
    setMessage('');
  };

  const handleAddEntry = async () => {
    if (!formData.content.trim()) {
      setMessage('Content is required');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim() || null,
        mood: formData.mood || null,
        weather: formData.weather.trim() || null,
        location: formData.location.trim() || null
      };

      console.log('Adding journal entry:', payload);

      const response = await fetch(`${baseURL}/journal/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Add entry response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Add entry result:', result);
      
      if (result.success) {
        setMessage('Journal entry added successfully!');
        resetForm();
        fetchEntries();
      } else {
        setMessage(result.message || 'Error adding journal entry');
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setMessage(`Error adding journal entry: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    
    setLoading(true);
    try {
      console.log('Deleting journal entry:', entryId);
      const response = await fetch(`${baseURL}/journal/${entryId}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);
      
      if (result.success) {
        setMessage('Journal entry deleted successfully!');
        fetchEntries();
        setSelectedEntry(null);
      } else {
        setMessage(result.message || 'Error deleting journal entry');
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      setMessage(`Error deleting journal entry: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodDisplay = (mood) => {
    const moodOption = moodOptions.find(option => option.value === mood);
    return moodOption ? moodOption.label : '😐 Unknown';
  };

  const getMoodColor = (mood) => {
    const moodOption = moodOptions.find(option => option.value === mood);
    return moodOption ? moodOption.color : 'text-gray-500';
  };

  const getMoodBg = (mood) => {
    const moodOption = moodOptions.find(option => option.value === mood);
    return moodOption ? moodOption.bg : 'bg-gray-100';
  };

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Journal</h1>
              <p className="text-gray-600 text-sm mt-1">Capture your thoughts and emotions</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                showAddForm 
                  ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
              }`}
            >
              {showAddForm ? '✕ Cancel' : '+ New Entry'}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {/* Message Display */}
          {message && (
            <div className="mx-6 mt-4 mb-4">
              <div className={`p-4 rounded-lg border ${
                message.includes('Error') || message.includes('error')
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">{message}</span>
                  <button 
                    onClick={() => setMessage('')}
                    className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Entry Form */}
          {showAddForm && (
            <div className="mx-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Write New Entry
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Title <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Give your entry a title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleFormChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="What's on your mind today..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Mood
                      </label>
                      <select
                        name="mood"
                        value={formData.mood}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="">Select mood...</option>
                        {moodOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Weather
                      </label>
                      <input
                        type="text"
                        name="weather"
                        value={formData.weather}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Sunny, Rainy, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Where are you writing from?"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddEntry}
                      disabled={loading || !formData.content.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Entry'
                      )}
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6">
            {/* Entries List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Entries</h2>
                <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center text-gray-500">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading entries...
                  </div>
                </div>
              )}

              {!loading && entries.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No journal entries yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start writing your first journal entry to capture your thoughts and feelings.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                  >
                    Write First Entry
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md group ${
                      selectedEntry?.id === entry.id 
                        ? 'ring-2 ring-blue-500 border-blue-200 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          {entry.title && (
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                              {entry.title}
                            </h3>
                          )}
                          <p className="text-sm text-gray-500 font-medium">{formatDate(entry.created_at)}</p>
                        </div>
                        {entry.mood && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.mood)} ${getMoodBg(entry.mood)}`}>
                            {getMoodDisplay(entry.mood)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 line-clamp-3 leading-relaxed mb-4">
                        {entry.content}
                      </p>

                      {(entry.weather || entry.location) && (
                        <div className="flex gap-4 pt-3 border-t border-gray-100">
                          {entry.weather && (
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              🌤️ {entry.weather}
                            </span>
                          )}
                          {entry.location && (
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              📍 {entry.location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Detail */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              {selectedEntry ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {selectedEntry.title && (
                          <h2 className="text-xl font-bold text-gray-900 mb-1">
                            {selectedEntry.title}
                          </h2>
                        )}
                        <p className="text-sm text-gray-600 font-medium">{formatDate(selectedEntry.created_at)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(selectedEntry.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete entry"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {selectedEntry.mood && (
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(selectedEntry.mood)} ${getMoodBg(selectedEntry.mood)}`}>
                          {getMoodDisplay(selectedEntry.mood)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="prose max-w-none mb-6">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                        {selectedEntry.content}
                      </p>
                    </div>

                    {(selectedEntry.weather || selectedEntry.location) && (
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex gap-4 text-sm">
                          {selectedEntry.weather && (
                            <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="mr-2">🌤️</span>
                              <span className="font-medium">Weather:</span>
                              <span className="ml-1">{selectedEntry.weather}</span>
                            </div>
                          )}
                          {selectedEntry.location && (
                            <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="mr-2">📍</span>
                              <span className="font-medium">Location:</span>
                              <span className="ml-1">{selectedEntry.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedEntry.keywords && selectedEntry.keywords.length > 0 && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEntry.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an entry</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Click on any journal entry to view its full content and details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;