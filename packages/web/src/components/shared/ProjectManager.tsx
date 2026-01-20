/**
 * ProjectManager component
 * Allows users to save, load, and manage multiple projects
 */

import { useState, useRef, useEffect } from 'react';
import { Folder, CaretDown, Plus, Trash, Check, FloppyDisk, PencilSimple } from '@phosphor-icons/react';
import { usePricing } from '../../context/PricingContext';

export function ProjectManager() {
  const {
    currentProjectName,
    listProjects,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
  } = usePricing();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentProjectName);
  const [showSaveNew, setShowSaveNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projects = listProjects();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSaveNew(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    saveProject(currentProjectName);
  };

  const handleRename = () => {
    if (editName.trim() && editName !== currentProjectName) {
      renameProject(editName.trim());
    }
    setIsEditing(false);
  };

  const handleSaveNew = () => {
    if (newProjectName.trim()) {
      saveProject(newProjectName.trim());
      setNewProjectName('');
      setShowSaveNew(false);
      setIsOpen(false);
    }
  };

  const handleLoadProject = (name: string) => {
    loadProject(name);
    setIsOpen(false);
  };

  const handleDeleteProject = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete project "${name}"?`)) {
      deleteProject(name);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Project Display */}
      <div className="flex items-center gap-1 sm:gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditName(currentProjectName);
                setIsEditing(false);
              }
            }}
            className="text-xs sm:text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#253ff6]/20 touch-manipulation"
          />
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 active:text-gray-900 transition-colors touch-manipulation"
          >
            <Folder size={14} weight="duotone" className="text-gray-400 sm:w-4 sm:h-4" />
            <span className="max-w-[100px] sm:max-w-[150px] truncate">{currentProjectName}</span>
            <CaretDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {!isEditing && (
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => {
                setEditName(currentProjectName);
                setIsEditing(true);
              }}
              className="p-2 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-100 rounded transition-colors touch-manipulation"
              title="Rename project"
            >
              <PencilSimple size={14} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 sm:p-1.5 text-gray-400 hover:text-[#253ff6] hover:bg-[rgba(37,63,246,0.08)] active:bg-[rgba(37,63,246,0.08)] rounded transition-colors touch-manipulation"
              title="Save project"
            >
              <FloppyDisk size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-0 right-0 sm:right-auto mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Save as New */}
          {!showSaveNew ? (
            <button
              onClick={() => setShowSaveNew(true)}
              className="w-full flex items-center gap-2 px-3 py-3 sm:py-2.5 text-sm text-[#253ff6] hover:bg-[rgba(37,63,246,0.04)] active:bg-[rgba(37,63,246,0.04)] border-b border-gray-100 touch-manipulation"
            >
              <Plus size={16} />
              Save as New Project
            </button>
          ) : (
            <div className="p-3 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-2 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-[#253ff6]/20 touch-manipulation"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNew();
                    if (e.key === 'Escape') {
                      setShowSaveNew(false);
                      setNewProjectName('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveNew}
                  disabled={!newProjectName.trim()}
                  className="px-3 py-2 sm:py-1.5 bg-[#253ff6] text-white text-sm rounded hover:bg-[#1d4ed8] active:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Saved Projects */}
          <div className="max-h-48 overflow-y-auto">
            {projects.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">No saved projects</p>
            ) : (
              projects.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-3 py-3 sm:py-2 hover:bg-gray-50 active:bg-gray-50 cursor-pointer group touch-manipulation"
                  onClick={() => handleLoadProject(name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadProject(name)}
                >
                  <span className="text-sm text-gray-700 truncate flex-1" title={name}>{name}</span>
                  <button
                    onClick={(e) => handleDeleteProject(name, e)}
                    className="p-2 sm:p-1 text-gray-300 hover:text-red-500 active:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all touch-manipulation"
                    title="Delete project"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Current Project Indicator */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Current: <span className="text-gray-600">{currentProjectName}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
