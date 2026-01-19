/**
 * Custom Provider Manager Component
 *
 * Allows users to add their own OpenAI-compatible AI providers.
 * This is useful for:
 * - Self-hosted LLMs (Ollama, vLLM, etc.)
 * - Private API endpoints
 * - New providers not yet in the default config
 * - Regional endpoints or proxies
 */

import { useState } from 'react';
import {
  getCustomProviders,
  saveCustomProvider,
  removeCustomProvider,
  type ProviderConfig,
  type ModelConfig,
} from '../../services/config-loader';

interface CustomProviderManagerProps {
  onProviderAdded?: (provider: ProviderConfig) => void;
  onProviderRemoved?: (providerId: string) => void;
}

export function CustomProviderManager({
  onProviderAdded,
  onProviderRemoved,
}: CustomProviderManagerProps) {
  // Initialize with loaded providers (avoids setState in useEffect)
  const [customProviders, setCustomProviders] = useState<ProviderConfig[]>(() => getCustomProviders());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = (provider: ProviderConfig) => {
    const result = saveCustomProvider(provider);
    if (result.success) {
      setCustomProviders(getCustomProviders());
      setIsAddingNew(false);
      setEditingId(null);
      onProviderAdded?.(provider);
    } else {
      alert(result.error ?? 'Failed to save provider');
    }
  };

  const handleRemove = (providerId: string) => {
    if (confirm('Remove this custom provider? Your API key for it will also be removed.')) {
      removeCustomProvider(providerId);
      setCustomProviders(getCustomProviders());
      onProviderRemoved?.(providerId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Custom Providers</h3>
          <p className="text-sm text-gray-500">
            Add OpenAI-compatible endpoints (self-hosted LLMs, proxies, etc.)
          </p>
        </div>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Provider
          </button>
        )}
      </div>

      {/* Existing custom providers */}
      {customProviders.length > 0 && (
        <div className="space-y-3">
          {customProviders.map(provider => (
            <div
              key={provider.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              {editingId === provider.id ? (
                <ProviderForm
                  initialProvider={provider}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-500">{provider.baseUrl}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {Object.keys(provider.models).length} model(s) · Default: {provider.defaultModel}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(provider.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemove(provider.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new provider form */}
      {isAddingNew && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-3 font-medium text-blue-900">Add Custom Provider</h4>
          <ProviderForm
            onSave={handleSave}
            onCancel={() => setIsAddingNew(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {customProviders.length === 0 && !isAddingNew && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <ServerIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No custom providers configured</p>
          <p className="mt-1 text-xs text-gray-500">
            Add your own OpenAI-compatible endpoints like Ollama, vLLM, or private APIs
          </p>
        </div>
      )}

      {/* Help text */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-medium">OpenAI-compatible API format:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>POST /chat/completions endpoint</li>
          <li>Authorization: Bearer {"<your-api-key>"}</li>
          <li>Standard messages array format</li>
        </ul>
        <p className="mt-2">
          Popular compatible providers: Ollama, vLLM, LM Studio, LocalAI, Together AI, Groq, Fireworks AI
        </p>
      </div>
    </div>
  );
}

/**
 * Provider Form Component
 */
interface ProviderFormProps {
  initialProvider?: ProviderConfig;
  onSave: (provider: ProviderConfig) => void;
  onCancel: () => void;
}

function ProviderForm({ initialProvider, onSave, onCancel }: ProviderFormProps) {
  const [name, setName] = useState(initialProvider?.name ?? '');
  const [baseUrl, setBaseUrl] = useState(initialProvider?.baseUrl ?? '');
  const [models, setModels] = useState<ModelConfig[]>(
    initialProvider ? Object.values(initialProvider.models) : []
  );
  const [defaultModel, setDefaultModel] = useState(initialProvider?.defaultModel ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate provider ID from name
  const providerId = initialProvider?.id ?? `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const addModel = () => {
    setModels([
      ...models,
      {
        id: '',
        name: '',
        inputPricePerMillion: 0,
        outputPricePerMillion: 0,
      },
    ]);
  };

  const updateModel = (index: number, updates: Partial<ModelConfig>) => {
    const newModels = [...models];
    newModels[index] = { ...newModels[index], ...updates };
    setModels(newModels);
  };

  const removeModel = (index: number) => {
    setModels(models.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!baseUrl.trim()) newErrors.baseUrl = 'Base URL is required';
    if (models.length === 0) newErrors.models = 'At least one model is required';
    if (!defaultModel && models.length > 0) newErrors.defaultModel = 'Select a default model';

    // Validate models
    models.forEach((model, i) => {
      if (!model.id.trim()) newErrors[`model_${i}_id`] = 'Model ID is required';
      if (!model.name.trim()) newErrors[`model_${i}_name`] = 'Model name is required';
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build provider config
    const modelsRecord: Record<string, ModelConfig> = {};
    models.forEach(model => {
      modelsRecord[model.id] = model;
    });

    const provider: ProviderConfig = {
      id: providerId,
      name: name.trim(),
      baseUrl: baseUrl.trim().replace(/\/$/, ''), // Remove trailing slash
      isOpenAICompatible: true,
      supportsStreaming: true,
      defaultModel: defaultModel || models[0]?.id,
      models: modelsRecord,
    };

    onSave(provider);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Provider Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., My Ollama Server"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Base URL
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="e.g., http://localhost:11434/v1"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
              errors.baseUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.baseUrl && <p className="mt-1 text-xs text-red-600">{errors.baseUrl}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Full URL to OpenAI-compatible API (should end with /v1 or similar)
          </p>
        </div>
      </div>

      {/* Models */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Models</label>
          <button
            type="button"
            onClick={addModel}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Model
          </button>
        </div>
        {errors.models && <p className="mt-1 text-xs text-red-600">{errors.models}</p>}

        <div className="mt-2 space-y-3">
          {models.map((model, index) => (
            <div key={index} className="rounded-md border border-gray-200 bg-white p-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <input
                    type="text"
                    value={model.id}
                    onChange={e => updateModel(index, { id: e.target.value })}
                    placeholder="Model ID"
                    className={`block w-full rounded border px-2 py-1 text-sm ${
                      errors[`model_${index}_id`] ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <span className="text-xs text-gray-500">ID (API)</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={model.name}
                    onChange={e => updateModel(index, { name: e.target.value })}
                    placeholder="Display Name"
                    className={`block w-full rounded border px-2 py-1 text-sm ${
                      errors[`model_${index}_name`] ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <span className="text-xs text-gray-500">Display name</span>
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={model.inputPricePerMillion}
                    onChange={e => updateModel(index, { inputPricePerMillion: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="block w-full rounded border border-gray-200 px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">$/1M input</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={model.outputPricePerMillion}
                      onChange={e => updateModel(index, { outputPricePerMillion: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="block w-full rounded border border-gray-200 px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-500">$/1M output</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModel(index)}
                    className="self-start p-1 text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default model selector */}
      {models.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Model
          </label>
          <select
            value={defaultModel}
            onChange={e => setDefaultModel(e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
              errors.defaultModel ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select default model</option>
            {models.filter(m => m.id).map(model => (
              <option key={model.id} value={model.id}>
                {model.name || model.id}
              </option>
            ))}
          </select>
          {errors.defaultModel && <p className="mt-1 text-xs text-red-600">{errors.defaultModel}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialProvider ? 'Save Changes' : 'Add Provider'}
        </button>
      </div>
    </form>
  );
}

/**
 * Quick-add presets for common providers
 */
export function QuickAddPresets({ onAdd }: { onAdd: (provider: ProviderConfig) => void }) {
  const presets: Array<{ name: string; provider: Partial<ProviderConfig> }> = [
    {
      name: 'Ollama (Local)',
      provider: {
        id: 'custom_ollama',
        name: 'Ollama',
        baseUrl: 'http://localhost:11434/v1',
        models: {
          'llama3.2': {
            id: 'llama3.2',
            name: 'Llama 3.2',
            inputPricePerMillion: 0,
            outputPricePerMillion: 0,
          },
          'mistral': {
            id: 'mistral',
            name: 'Mistral 7B',
            inputPricePerMillion: 0,
            outputPricePerMillion: 0,
          },
        },
        defaultModel: 'llama3.2',
      },
    },
    {
      name: 'Groq',
      provider: {
        id: 'custom_groq',
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        models: {
          'llama-3.3-70b-versatile': {
            id: 'llama-3.3-70b-versatile',
            name: 'Llama 3.3 70B',
            inputPricePerMillion: 0.59,
            outputPricePerMillion: 0.79,
          },
          'mixtral-8x7b-32768': {
            id: 'mixtral-8x7b-32768',
            name: 'Mixtral 8x7B',
            inputPricePerMillion: 0.24,
            outputPricePerMillion: 0.24,
          },
        },
        defaultModel: 'llama-3.3-70b-versatile',
      },
    },
    {
      name: 'Together AI',
      provider: {
        id: 'custom_together',
        name: 'Together AI',
        baseUrl: 'https://api.together.xyz/v1',
        models: {
          'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': {
            id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
            name: 'Llama 3.1 70B Turbo',
            inputPricePerMillion: 0.88,
            outputPricePerMillion: 0.88,
          },
        },
        defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      },
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(preset => (
        <button
          key={preset.name}
          onClick={() => onAdd(preset.provider as ProviderConfig)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50"
        >
          + {preset.name}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function ServerIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

function TrashIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
