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
import { SourceBadge } from './shared';
import { FeatureStatsGrid } from './features';

type SourceFilter = 'all' | 'codebase' | 'manual';

export function FeatureInventory() {
  const { features, addFeature, updateFeature, removeFeature, variableCosts } = usePricing();

  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 200); // Debounce search for performance
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
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
    if (confirm('Are you sure you want to delete this feature?')) {
      removeFeature(featureId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Feature Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage features from your codebase and add planned features</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#253ff6] text-white rounded-[0.2rem] hover:bg-[#1e35d9] transition-colors text-sm font-medium"
        >
          <Plus size={16} weight="bold" />
          Add Feature
        </button>
      </div>

      {/* Stats */}
      <FeatureStatsGrid stats={stats} />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          {/* Source Filter Tabs */}
          <div className="flex border border-[#e4e4e4] rounded-[0.2rem] overflow-hidden">
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
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all ${
                    sourceFilter === option.value
                      ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon size={14} weight="duotone" />}
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" weight="duotone" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e4e4e4] rounded-[0.2rem] py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#253ff6] focus:ring-2 focus:ring-[rgba(37,63,246,0.08)] transition-all"
              aria-label="Search features"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between gap-2 w-48 bg-white border border-[#e4e4e4] rounded-[0.2rem] py-2 px-3 text-sm text-left hover:border-gray-300 focus:outline-none focus:border-[#253ff6] focus:ring-2 focus:ring-[rgba(37,63,246,0.08)] transition-all"
            >
              <span className="truncate text-gray-700">{selectedLabel}</span>
              <CaretDown
                size={14}
                weight="bold"
                className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#e4e4e4] rounded-[0.2rem] shadow-lg shadow-black/5 z-50 py-1 max-h-80 overflow-y-auto">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedCategory(option.value as FeatureCategory | 'all');
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                      selectedCategory === option.value
                        ? 'bg-[rgba(37,63,246,0.06)] text-[#253ff6]'
                        : 'text-gray-700 hover:bg-gray-50'
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex border border-[#e4e4e4] rounded-[0.2rem] overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-all duration-200 ${
                viewMode === 'grid' ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <SquaresFour size={18} weight="duotone" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 transition-all duration-200 ${
                viewMode === 'table' ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <List size={18} weight="duotone" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>
          Showing {filteredFeatures.length} of {features.length} features
          {sourceFilter !== 'all' && (
            <span className="ml-1">
              ({sourceFilter === 'codebase' ? 'from codebase' : 'user added'})
            </span>
          )}
        </p>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {featureCategories[category as FeatureCategory].name}
                </h2>
                <span className="text-xs text-gray-500">({categoryFeatures.length})</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
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
            <div className="text-center py-12 text-gray-400">
              <Lightning size={48} weight="duotone" className="mx-auto mb-3 opacity-50" />
              <p>No features match your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-center py-3 px-4">Source</th>
                <th className="text-center py-3 px-4">Complexity</th>
                <th className="text-center py-3 px-4">Limit</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature) => (
                <tr key={feature.id} className="table-row">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 text-[15px]">{feature.name}</p>
                    <p className="text-xs text-gray-500">{featureCategories[feature.category].name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{feature.description}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <SourceBadge source={feature.source} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-[0.2rem] ${
                      feature.complexity === 'high' ? 'bg-red-50 text-red-600' :
                      feature.complexity === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {feature.complexity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {feature.hasLimit ? (
                      <span className="text-xs text-gray-500">{feature.limitUnit}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingFeature(feature)}
                        className="p-1.5 text-gray-400 hover:text-[#253ff6] hover:bg-[rgba(37,63,246,0.08)] rounded-[0.2rem] transition-colors"
                      >
                        <PencilSimple size={16} weight="duotone" />
                      </button>
                      {feature.source === 'manual' && (
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[0.2rem] transition-colors"
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
    <div className="card p-5 group relative">
      {/* Source Badge */}
      <div className="absolute top-3 right-3">
        <SourceBadge source={feature.source} />
      </div>

      {/* Content */}
      <div className="pr-20">
        <h3 className="font-medium text-gray-900 text-[15px]">{feature.name}</h3>
        <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-[0.2rem] ${
          feature.complexity === 'high' ? 'bg-red-50 text-red-600' :
          feature.complexity === 'medium' ? 'bg-amber-50 text-amber-600' :
          'bg-emerald-50 text-emerald-600'
        }`}>
          {feature.complexity}
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{feature.description}</p>

      <div className="pt-3 mt-3 border-t border-[#e4e4e4]">
        <p className="text-xs text-[#253ff6] flex items-center gap-1.5">
          <Lightning size={14} weight="duotone" />
          {feature.valueProposition}
        </p>
      </div>

      {(feature.hasLimit || feature.costDriver) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {feature.hasLimit && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-[0.2rem]">
              {feature.limitUnit}
            </span>
          )}
          {linkedCost ? (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-[0.2rem] flex items-center gap-1">
              <CurrencyDollar size={12} weight="bold" />
              MYR {linkedCost.costPerUnit.toFixed(3)}/{linkedCost.unit}
            </span>
          ) : feature.costDriver ? (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-[0.2rem]">
              ${feature.costDriver}
            </span>
          ) : null}
        </div>
      )}

      {/* Hover Actions */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-[#253ff6] hover:bg-[rgba(37,63,246,0.08)] rounded-[0.2rem] transition-colors"
        >
          <PencilSimple size={16} weight="duotone" />
        </button>
        {feature.source === 'manual' && (
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[0.2rem] transition-colors"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[0.2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e4e4e4]">
          <h2 className="text-lg font-semibold text-gray-900">
            {feature ? 'Edit Feature' : 'Add New Feature'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.2rem] transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field w-full"
              placeholder="e.g., Bulk Export"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field w-full resize-none"
              placeholder="What does this feature do?"
            />
          </div>

          {/* Category & Complexity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FeatureCategory }))}
                className="input-field w-full"
              >
                {Object.entries(featureCategories).map(([key, { name }]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
              <select
                value={formData.complexity}
                onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value as 'low' | 'medium' | 'high' }))}
                className="input-field w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Value Proposition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value Proposition <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.valueProposition}
              onChange={(e) => setFormData(prev => ({ ...prev, valueProposition: e.target.value }))}
              className="input-field w-full"
              placeholder="Why is this valuable to customers?"
            />
          </div>

          {/* Has Limit */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasLimit"
              checked={formData.hasLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, hasLimit: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#253ff6] focus:ring-[#253ff6]"
            />
            <label htmlFor="hasLimit" className="text-sm text-gray-700">
              This feature has tier-based limits
            </label>
          </div>

          {/* Limit Unit (conditional) */}
          {formData.hasLimit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit Unit</label>
              <input
                type="text"
                value={formData.limitUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, limitUnit: e.target.value }))}
                className="input-field w-full"
                placeholder="e.g., exports/month, GB, users"
              />
            </div>
          )}

          {/* Cost Driver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Driver (optional)</label>
            <select
              value={formData.costDriver}
              onChange={(e) => setFormData(prev => ({ ...prev, costDriver: e.target.value }))}
              className="input-field w-full"
            >
              <option value="">No cost driver</option>
              <optgroup label="Variable Costs (from COGS)">
                {variableCosts.map(cost => (
                  <option key={cost.id} value={cost.id}>
                    {cost.name} - MYR {cost.costPerUnit.toFixed(3)}/{cost.unit}
                  </option>
                ))}
              </optgroup>
            </select>
            {linkedCost && (
              <div className="mt-2 p-2 bg-emerald-50 rounded-[0.2rem] border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CurrencyDollar size={12} weight="bold" />
                  Linked to: {linkedCost.name}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  MYR {linkedCost.costPerUnit.toFixed(3)} per {linkedCost.unit} × {linkedCost.usagePerCustomer} {linkedCost.unit}/customer
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Link this feature to a variable cost from the COGS calculator
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e4e4e4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-[0.2rem] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#253ff6] text-white rounded-[0.2rem] hover:bg-[#1e35d9] transition-colors text-sm font-medium"
            >
              {feature ? 'Save Changes' : 'Add Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
