import { useState, useRef, useEffect, useMemo } from 'react';
import {
  MagnifyingGlass,
  SquaresFour,
  List,
  Lightning,
  CaretDown,
  Check,
  Plus,
  X,
  Code,
  PencilSimple,
  Trash,
  User,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { generateId } from '@basedpricer/core';
import { featureCategories, type FeatureCategory, type Feature } from '../data/features';
import { usePricing, type VariableCostItem } from '../context/PricingContext';
import { useDebouncedValue } from '../hooks/useDebounce';
import { SourceBadge, ConfirmationModal } from './shared';
import { FeatureStatsGrid } from './features';

type SourceFilter = 'all' | 'codebase' | 'manual';

export function FeatureInventory() {
  const { features, addFeature, updateFeature, removeFeature, variableCosts, showToast } = usePricing();

  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 200); // Debounce search for performance
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...Object.entries(featureCategories).map(([key, { name }]) => ({ value: key, label: name }))
  ];

  const selectedLabel = categoryOptions.find(opt => opt.value === selectedCategory)?.label || 'All Categories';

  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
      const matchesSource = sourceFilter === 'all' || feature.source === sourceFilter;
      const matchesSearch = feature.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        feature.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesCategory && matchesSource && matchesSearch;
    });
  }, [features, selectedCategory, sourceFilter, debouncedSearch]);

  const groupedFeatures = useMemo(() => {
    return filteredFeatures.reduce((acc, feature) => {
      if (!acc[feature.category]) acc[feature.category] = [];
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<FeatureCategory, Feature[]>);
  }, [filteredFeatures]);

  const stats = useMemo(() => ({
    total: features.length,
    codebase: features.filter(f => f.source === 'codebase').length,
    manual: features.filter(f => f.source === 'manual').length,
    categories: new Set(features.map(f => f.category)).size,
    withLimits: features.filter(f => f.hasLimit).length,
  }), [features]);

  const handleAddFeature = (newFeature: Omit<Feature, 'id' | 'source' | 'createdAt'>) => {
    const feature: Feature = {
      ...newFeature,
      id: generateId('manual'),
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    addFeature(feature);
    setShowAddModal(false);
  };

  const handleEditFeature = (updates: Partial<Feature>) => {
    if (editingFeature) {
      updateFeature(editingFeature.id, updates);
      setEditingFeature(null);
    }
  };

  const handleDeleteFeature = (featureId: string) => {
    setFeatureToDelete(featureId);
  };

  const confirmDeleteFeature = () => {
    if (featureToDelete) {
      const deletedName = features.find(f => f.id === featureToDelete)?.name ?? 'Feature';
      removeFeature(featureToDelete);
      setFeatureToDelete(null);
      showToast('info', `Deleted "${deletedName}"`);
    }
  };

  const featureToDeleteName = featureToDelete
    ? features.find(f => f.id === featureToDelete)?.name ?? 'this feature'
    : '';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Features</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">What does your product do? List everything here.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#253ff6] text-white rounded-[0.2rem] hover:bg-[#1e35d9] active:bg-[#1a2eb8] transition-colors text-sm font-medium touch-manipulation w-full sm:w-auto"
        >
          <Plus size={16} weight="bold" />
          Add Feature
        </button>
      </div>

      {/* Stats */}
      <FeatureStatsGrid stats={stats} />

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Source Filter Tabs - horizontal scroll on mobile */}
          <div className="flex border border-[#e4e4e4] rounded-[0.2rem] overflow-x-auto scrollbar-hide">
            {[
              { value: 'all' as const, label: 'All' },
              { value: 'codebase' as const, label: 'Codebase', icon: Code },
              { value: 'manual' as const, label: 'My Features', icon: User },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSourceFilter(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap touch-manipulation ${
                    sourceFilter === option.value
                      ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]'
                      : 'text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  {Icon && <Icon size={14} weight="duotone" />}
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" weight="duotone" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e4e4e4] rounded-[0.2rem] py-2.5 sm:py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#253ff6] focus:ring-2 focus:ring-[rgba(37,63,246,0.08)] transition-all"
              aria-label="Search features"
            />
          </div>

          {/* Category Dropdown & View Toggle row */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Category Dropdown */}
            <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between gap-2 w-full sm:w-48 bg-white border border-[#e4e4e4] rounded-[0.2rem] py-2.5 sm:py-2 px-3 text-sm text-left hover:border-gray-300 focus:outline-none focus:border-[#253ff6] focus:ring-2 focus:ring-[rgba(37,63,246,0.08)] transition-all touch-manipulation"
              >
                <span className="truncate text-gray-700 text-xs sm:text-sm">{selectedLabel}</span>
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-auto mt-1 sm:w-56 bg-white border border-[#e4e4e4] rounded-[0.2rem] shadow-lg shadow-black/5 z-50 py-1 max-h-80 overflow-y-auto">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedCategory(option.value as FeatureCategory | 'all');
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm text-left transition-colors touch-manipulation ${
                        selectedCategory === option.value
                          ? 'bg-[rgba(37,63,246,0.06)] text-[#253ff6]'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-[0.2rem] border flex items-center justify-center flex-shrink-0 ${
                        selectedCategory === option.value
                          ? 'bg-[#253ff6] border-[#253ff6]'
                          : 'border-gray-300'
                      }`}>
                        {selectedCategory === option.value && (
                          <Check size={10} weight="bold" className="text-white" />
                        )}
                      </div>
                      <span className={selectedCategory === option.value ? 'font-medium' : ''}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex border border-[#e4e4e4] rounded-[0.2rem] overflow-hidden flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 sm:px-3 py-2 transition-all duration-200 touch-manipulation ${
                  viewMode === 'grid' ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]' : 'text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <SquaresFour size={18} weight="duotone" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 sm:px-3 py-2 transition-all duration-200 touch-manipulation ${
                  viewMode === 'table' ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]' : 'text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <List size={18} weight="duotone" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
        <p>
          Showing {filteredFeatures.length} of {features.length} features
          {sourceFilter !== 'all' && (
            <span className="ml-1 hidden sm:inline">
              ({sourceFilter === 'codebase' ? 'from codebase' : 'user added'})
            </span>
          )}
        </p>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <h2 className="text-xs sm:text-sm font-semibold text-gray-900">
                  {featureCategories[category as FeatureCategory].name}
                </h2>
                <span className="text-[10px] sm:text-xs text-gray-500">({categoryFeatures.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categoryFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    variableCosts={variableCosts}
                    onEdit={() => setEditingFeature(feature)}
                    onDelete={() => handleDeleteFeature(feature.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedFeatures).length === 0 && (
            <div className="text-center py-10 sm:py-12 text-gray-400">
              <Lightning size={40} weight="duotone" className="mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-2">No features match your filters</p>
              <p className="text-xs text-gray-400 mb-3">Try adjusting your search or filters</p>
              <div className="flex flex-wrap justify-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#253ff6] hover:text-[#1a2eb8]"
                  >
                    Clear search
                  </button>
                )}
                {(sourceFilter !== 'all' || selectedCategory !== 'all') && (
                  <button
                    onClick={() => { setSourceFilter('all'); setSelectedCategory('all'); }}
                    className="text-xs text-[#253ff6] hover:text-[#1a2eb8]"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm">Feature</th>
                <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Description</th>
                <th className="text-center py-3 px-3 sm:px-4 text-xs sm:text-sm">Source</th>
                <th className="text-center py-3 px-3 sm:px-4 text-xs sm:text-sm">Complexity</th>
                <th className="text-center py-3 px-3 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Limit</th>
                <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature) => (
                <tr key={feature.id} className="table-row">
                  <td className="py-3 px-3 sm:px-4">
                    <p className="font-medium text-gray-900 text-sm sm:text-[15px]">{feature.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{featureCategories[feature.category].name}</p>
                  </td>
                  <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{feature.description}</p>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-center">
                    <SourceBadge source={feature.source} />
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-center">
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-[0.2rem] ${
                      feature.complexity === 'high' ? 'bg-red-50 text-red-600' :
                      feature.complexity === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {feature.complexity}
                    </span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-center hidden md:table-cell">
                    {feature.hasLimit ? (
                      <span className="text-[10px] sm:text-xs text-gray-500">{feature.limitUnit}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingFeature(feature)}
                        className="p-1.5 text-gray-400 hover:text-[#253ff6] active:text-[#1a2eb8] hover:bg-[rgba(37,63,246,0.08)] rounded-[0.2rem] transition-colors touch-manipulation"
                      >
                        <PencilSimple size={16} weight="duotone" />
                      </button>
                      {feature.source === 'manual' && (
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 active:text-red-700 hover:bg-red-50 rounded-[0.2rem] transition-colors touch-manipulation"
                        >
                          <Trash size={16} weight="duotone" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Feature Modal */}
      {showAddModal && (
        <FeatureModal
          variableCosts={variableCosts}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddFeature}
        />
      )}

      {/* Edit Feature Modal */}
      {editingFeature && (
        <FeatureModal
          feature={editingFeature}
          variableCosts={variableCosts}
          onClose={() => setEditingFeature(null)}
          onSave={(updates) => handleEditFeature(updates)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={featureToDelete !== null}
        onClose={() => setFeatureToDelete(null)}
        onConfirm={confirmDeleteFeature}
        title="Delete Feature"
        message={`Are you sure you want to delete "${featureToDeleteName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FeatureCard({
  feature,
  variableCosts,
  onEdit,
  onDelete,
}: {
  feature: Feature;
  variableCosts: VariableCostItem[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Find linked cost item if costDriver matches a variable cost ID
  const linkedCost = feature.costDriver
    ? variableCosts.find(c => c.id === feature.costDriver)
    : null;

  return (
    <div className="card p-4 sm:p-5 group relative">
      {/* Source Badge */}
      <div className="absolute top-3 right-3">
        <SourceBadge source={feature.source} />
      </div>

      {/* Content */}
      <div className="pr-16 sm:pr-20">
        <h3 className="font-medium text-gray-900 text-sm sm:text-[15px]">{feature.name}</h3>
        <span className={`inline-block mt-1.5 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-[0.2rem] ${
          feature.complexity === 'high' ? 'bg-red-50 text-red-600' :
          feature.complexity === 'medium' ? 'bg-amber-50 text-amber-600' :
          'bg-emerald-50 text-emerald-600'
        }`}>
          {feature.complexity}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mt-2.5 sm:mt-3 line-clamp-2">{feature.description}</p>

      <div className="pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-[#e4e4e4]">
        <p className="text-[10px] sm:text-xs text-[#253ff6] flex items-start gap-1.5">
          <Lightning size={14} weight="duotone" className="flex-shrink-0 mt-0.5" />
          <span>{feature.valueProposition}</span>
        </p>
      </div>

      {(feature.hasLimit || feature.costDriver) && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
          {feature.hasLimit && (
            <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded-[0.2rem]">
              {feature.limitUnit}
            </span>
          )}
          {linkedCost ? (
            <span className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded-[0.2rem] flex items-center gap-1">
              <CurrencyDollar size={12} weight="bold" />
              MYR {linkedCost.costPerUnit.toFixed(3)}/{linkedCost.unit}
            </span>
          ) : feature.costDriver ? (
            <span className="text-[10px] sm:text-xs bg-amber-50 text-amber-700 px-1.5 sm:px-2 py-0.5 rounded-[0.2rem]">
              ${feature.costDriver}
            </span>
          ) : null}
        </div>
      )}

      {/* Actions - always visible on mobile, hover on desktop */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-[#253ff6] active:text-[#1a2eb8] hover:bg-[rgba(37,63,246,0.08)] rounded-[0.2rem] transition-colors touch-manipulation"
        >
          <PencilSimple size={16} weight="duotone" />
        </button>
        {feature.source === 'manual' && (
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 active:text-red-700 hover:bg-red-50 rounded-[0.2rem] transition-colors touch-manipulation"
          >
            <Trash size={16} weight="duotone" />
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureModal({
  feature,
  variableCosts,
  onClose,
  onSave,
}: {
  feature?: Feature;
  variableCosts: VariableCostItem[];
  onClose: () => void;
  onSave: (data: Omit<Feature, 'id' | 'source' | 'createdAt'>) => void;
}) {
  const [formData, setFormData] = useState({
    name: feature?.name ?? '',
    description: feature?.description ?? '',
    category: feature?.category ?? 'invoicing' as FeatureCategory,
    complexity: feature?.complexity ?? 'medium' as 'low' | 'medium' | 'high',
    hasLimit: feature?.hasLimit ?? false,
    limitUnit: feature?.limitUnit ?? '',
    costDriver: feature?.costDriver ?? '',
    valueProposition: feature?.valueProposition ?? '',
  });

  // Find linked cost for display
  const linkedCost = formData.costDriver
    ? variableCosts.find(c => c.id === formData.costDriver)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-[0.2rem] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e4e4e4] sticky top-0 bg-white z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            {feature ? 'Edit Feature' : 'Add New Feature'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 active:text-gray-700 hover:bg-gray-100 rounded-[0.2rem] transition-colors touch-manipulation"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Feature Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field w-full py-2.5 sm:py-2"
              placeholder="e.g., Bulk Export"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field w-full resize-none py-2.5 sm:py-2"
              placeholder="What does this feature do?"
            />
          </div>

          {/* Category & Complexity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FeatureCategory }))}
                className="input-field w-full py-2.5 sm:py-2"
              >
                {Object.entries(featureCategories).map(([key, { name }]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Complexity</label>
              <select
                value={formData.complexity}
                onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value as 'low' | 'medium' | 'high' }))}
                className="input-field w-full py-2.5 sm:py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Value Proposition */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Value Proposition <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.valueProposition}
              onChange={(e) => setFormData(prev => ({ ...prev, valueProposition: e.target.value }))}
              className="input-field w-full py-2.5 sm:py-2"
              placeholder="Why is this valuable to customers?"
            />
          </div>

          {/* Has Limit */}
          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="hasLimit"
              checked={formData.hasLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, hasLimit: e.target.checked }))}
              className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-[#253ff6] focus:ring-[#253ff6]"
            />
            <label htmlFor="hasLimit" className="text-xs sm:text-sm text-gray-700">
              This feature has tier-based limits
            </label>
          </div>

          {/* Limit Unit (conditional) */}
          {formData.hasLimit && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Limit Unit</label>
              <input
                type="text"
                value={formData.limitUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, limitUnit: e.target.value }))}
                className="input-field w-full py-2.5 sm:py-2"
                placeholder="e.g., exports/month, GB, users"
              />
            </div>
          )}

          {/* Cost Driver */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cost Driver (optional)</label>
            <select
              value={formData.costDriver}
              onChange={(e) => setFormData(prev => ({ ...prev, costDriver: e.target.value }))}
              className="input-field w-full py-2.5 sm:py-2"
            >
              <option value="">No cost driver</option>
              <optgroup label="Variable Costs">
                {variableCosts.map(cost => (
                  <option key={cost.id} value={cost.id}>
                    {cost.name} - MYR {cost.costPerUnit.toFixed(3)}/{cost.unit}
                  </option>
                ))}
              </optgroup>
            </select>
            {linkedCost && (
              <div className="mt-2 p-2 bg-emerald-50 rounded-[0.2rem] border border-emerald-200">
                <p className="text-[10px] sm:text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CurrencyDollar size={12} weight="bold" />
                  Linked to: {linkedCost.name}
                </p>
                <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5">
                  MYR {linkedCost.costPerUnit.toFixed(3)} per {linkedCost.unit} × {linkedCost.usagePerCustomer} {linkedCost.unit}/customer
                </p>
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              Link this feature to a variable cost from the Cost Calculator
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-[#e4e4e4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-[0.2rem] transition-colors touch-manipulation w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 sm:py-2 bg-[#253ff6] text-white rounded-[0.2rem] hover:bg-[#1e35d9] active:bg-[#1a2eb8] transition-colors text-sm font-medium touch-manipulation w-full sm:w-auto"
            >
              {feature ? 'Save Changes' : 'Add Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
