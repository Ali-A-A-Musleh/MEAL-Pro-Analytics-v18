import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal, Network, Target, Plus,
  Lightbulb, Lock, Trash2, Pencil,
  CheckCircle2, AlertTriangle, Settings, List, KeyRound, ArrowRight,
  ChevronDown, Check, Eye, EyeOff
} from 'lucide-react';

import SafeIcon from './SafeIcon';

import {
  DEFAULT_PASSWORD,
  loadSettings,
  saveSettings,
  ensureProject,
  ensureDesign,
  addOrUpdateSetting,
  deleteSetting,
  exportSettings,
  importSettingsFile
} from '../services/SettingsService';

export default function HierarchicalSettings({
  selectedProject = '',
  selectedDesign = '',
  onChangeProject,
  onChangeDesign
}) {
  // Sync state with localStorage through a reactive React state
  const [settings, setSettings] = useState(() => loadSettings());
  
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddDesign, setShowAddDesign] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newDesignName, setNewDesignName] = useState('');
  
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [settingDesc, setSettingDesc] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  
  const [settingsList, setSettingsList] = useState([]);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom dialogs states (Bypasses window.prompt and window.confirm block issues in iframes)
  const [dialogType, setDialogType] = useState(null); // 'export' | 'import' | 'delete_project' | 'delete_design' | null
  const [dialogPassword, setDialogPassword] = useState(DEFAULT_PASSWORD);
  const [dialogTarget, setDialogTarget] = useState(null); // holds project name, design name, or file object
  const [showPassword, setShowPassword] = useState(false);
  
  const fileInputRef = useRef(null);
  const projectInputRef = useRef(null);
  const designInputRef = useRef(null);
  const customizationFormRef = useRef(null);

  // Helper to re-read and broadcast settings update
  const triggerRefresh = () => {
    const current = loadSettings();
    setSettings(current);
    window.dispatchEvent(new window.Event('project-settings-updated'));
  };

  // Auto sync on selection change
  useEffect(() => {
    triggerRefresh();
  }, [selectedProject, selectedDesign]);

  // Focus effect for project input
  useEffect(() => {
    if (showAddProject && projectInputRef.current) {
      projectInputRef.current.focus();
    }
  }, [showAddProject]);

  // Focus effect for design input
  useEffect(() => {
    if (showAddDesign && designInputRef.current) {
      designInputRef.current.focus();
    }
  }, [showAddDesign]);

  // Compute lists reactively from settings state
  const projects = useMemo(() => Object.keys(settings), [settings]);
  
  const designs = useMemo(() => {
    if (!selectedProject || !settings[selectedProject]) return [];
    return Object.keys(settings[selectedProject]);
  }, [settings, selectedProject]);

  // Sync settingsList when active project and design selections change
  useEffect(() => {
    if (!selectedProject || !selectedDesign || !settings[selectedProject]?.[selectedDesign]) {
      setSettingsList([]);
      return;
    }
    const current = settings[selectedProject][selectedDesign];
    setSettingsList(Object.entries(current).map(([key, value]) => ({ key, ...value })));
  }, [selectedProject, selectedDesign, settings]);

  // Clear invalid design selection if project changes and the current design does not exist under it
  useEffect(() => {
    if (!selectedProject || !selectedDesign) return;
    if (!settings[selectedProject]?.[selectedDesign]) {
      onChangeDesign?.('');
    }
  }, [selectedProject, selectedDesign, settings, onChangeDesign]);

  function showAlert(msg, type = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  // ─── Project CRUD ─────────────────────────────────────────────────────────

  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) { showAlert('Project ID / Name is required.', 'warning'); return; }
    if (settings[name]) { showAlert('Project already exists.', 'warning'); return; }
    
    ensureProject(name);
    triggerRefresh();
    setNewProjectName('');
    setShowAddProject(false);
    
    // Instantly select the new project
    onChangeProject?.(name);
    onChangeDesign?.('');
    showAlert(`Project "${name}" created successfully.`);
  };

  const handleRequestDeleteProject = (name) => {
    setDialogTarget(name);
    setDialogType('delete_project');
  };

  const executeDeleteProject = (name) => {
    const currentSettings = { ...settings };
    delete currentSettings[name];
    saveSettings(currentSettings);
    triggerRefresh();
    
    if (selectedProject === name) {
      onChangeProject?.('');
      onChangeDesign?.('');
    }
    setDialogType(null);
    setDialogTarget(null);
    showAlert(`Project "${name}" deleted.`);
  };

  // ─── Design CRUD ──────────────────────────────────────────────────────────

  const handleCreateDesign = () => {
    const proj = selectedProject;
    const name = newDesignName.trim();
    if (!proj) { showAlert('Please select a project first.', 'warning'); return; }
    if (!name) { showAlert('Design name is required.', 'warning'); return; }
    
    if (settings[proj]?.[name]) { showAlert('Design already exists.', 'warning'); return; }
    
    ensureDesign(proj, name);
    triggerRefresh();
    setNewDesignName('');
    setShowAddDesign(false);
    
    // Instantly select the new design
    onChangeDesign?.(name);
    showAlert(`Design "${name}" added to "${proj}".`);
  };

  const handleRequestDeleteDesign = (name) => {
    setDialogTarget(name);
    setDialogType('delete_design');
  };

  const executeDeleteDesign = (name) => {
    const currentSettings = { ...settings };
    if (currentSettings[selectedProject]) {
      delete currentSettings[selectedProject][name];
      saveSettings(currentSettings);
    }
    triggerRefresh();
    
    if (selectedDesign === name) {
      onChangeDesign?.('');
    }
    setDialogType(null);
    setDialogTarget(null);
    showAlert(`Design "${name}" deleted.`);
  };

  // ─── Setting CRUD ─────────────────────────────────────────────────────────

  const handleSaveSetting = () => {
    if (!selectedProject || !selectedDesign) return;
    const key = settingKey.trim();
    if (!key) { showAlert('Setting key is required.', 'warning'); return; }
    
    // Support renaming of the setting key by deleting the old key if they named it differently
    if (editingKey && editingKey !== key) {
      deleteSetting(selectedProject, selectedDesign, editingKey);
    }
    
    addOrUpdateSetting(selectedProject, selectedDesign, key, settingValue, settingDesc);
    triggerRefresh();
    
    setSettingKey('');
    setSettingValue('');
    setSettingDesc('');
    setEditingKey(null);
    showAlert(`Setting "${key}" saved successfully.`);
  };

  const handleDeleteSetting = (key) => {
    deleteSetting(selectedProject, selectedDesign, key);
    triggerRefresh();
    showAlert(`Setting "${key}" deleted.`);
  };

  const handleEditSetting = (item) => {
    setEditingKey(item.key);
    setSettingKey(item.key);
    setSettingValue(String(item.value));
    setSettingDesc(item.description || '');
    
    // Smooth scroll customizable container into view instantly on edit click
    setTimeout(() => {
      customizationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleClearFields = () => {
    setSettingKey('');
    setSettingValue('');
    setSettingDesc('');
    setEditingKey(null);
  };

  // ─── Excel Export / Import Handlers ─────────────────────────────────────────────────

  const openExportDialog = () => {
    const fresh = loadSettings();
    if (!Object.keys(fresh).length) { showAlert('No project settings available to export.', 'warning'); return; }
    setDialogPassword(DEFAULT_PASSWORD);
    setDialogType('export');
  };

  const executeExport = async () => {
    setDialogType(null);
    setIsLoading(true);
    try {
      await exportSettings(dialogPassword);
      showAlert('Worksheet exported and protected successfully!');
    } catch (e) {
      showAlert('Export failed: ' + e.message, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDialogTarget(file);
    setDialogPassword(DEFAULT_PASSWORD);
    setDialogType('import');
  };

  const executeImport = async () => {
    const file = dialogTarget;
    if (!file) return;
    setDialogType(null);
    setIsLoading(true);
    try {
      await importSettingsFile(file, dialogPassword);
      setNewProjectName('');
      setNewDesignName('');
      setSettingKey('');
      setSettingValue('');
      setSettingDesc('');
      setEditingKey(null);
      
      triggerRefresh();
      showAlert('Excel settings imported and merged successfully!');
      if (selectedProject) onChangeDesign?.('');
    } catch (err) {
      showAlert('Import failed: ' + err.message, 'warning');
    } finally {
      setIsLoading(false);
      setDialogTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasSelection = selectedProject && selectedDesign;

  return (
    <div className="space-y-6 relative">

      {/* ── Main Panel Wrapper ── */}
      <div className="overflow-hidden bg-gradient-to-br from-white to-slate-50 border border-slate-100 shadow-sm rounded-3xl p-5 space-y-5">
        
        {/* Header Section */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50/70 text-indigo-600 rounded-xl">
              <SlidersHorizontal size={15} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-[14px] font-black text-slate-900 tracking-wide uppercase">
                Setup Matrix Studio
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">MEAL Framework Configurations</p>
            </div>
          </div>
        </div>

        {/* Current Active Selection Metrics */}
        <div className="bg-white/80 border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-1.5">
            <Target size={11} className="text-indigo-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Active Context
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 transition-colors">
              <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                Project ID
              </span>
              <span className="text-slate-800 font-bold truncate block">
                {selectedProject || <em className="text-slate-400 not-italic font-normal">Unassigned</em>}
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 transition-colors">
              <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                Design Select
              </span>
              <span className="text-slate-800 font-bold truncate block">
                {selectedDesign || <em className="text-slate-400 not-italic font-normal">Unassigned</em>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hierarchy Node Picker Section ── */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 space-y-5">
        
        {/* Project Selector Zone */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1 select-none">
            <Network size={12} className="text-indigo-500" />
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
              Select Project
            </label>
          </div>

          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500/50 focus-within:bg-white transition-all overflow-hidden shadow-sm h-11">
            <AnimatePresence mode="wait">
              {!showAddProject ? (
                <motion.div
                  key="project-select-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center w-full h-full animate-fade-in"
                >
                  <select
                    value={selectedProject}
                    onChange={e => {
                      onChangeProject?.(e.target.value);
                      onChangeDesign?.('');
                    }}
                    className="w-full h-full pl-3.5 pr-10 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer appearance-none"
                  >
                    <option value="">-- Choose Project ID --</option>
                    {projects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="absolute right-12 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                  <div className="h-5 w-px bg-slate-200"></div>
                  <button
                    type="button"
                    onClick={() => { setShowAddProject(true); setNewProjectName(''); }}
                    className="h-full px-4 text-indigo-600 hover:text-indigo-800 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer group"
                    title="Create New Project"
                  >
                    <Plus size={15} className="group-hover:scale-110 transition-transform stroke-[2.5px]" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="project-add-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center w-full h-full"
                >
                    <input
                      ref={projectInputRef}
                      type="text"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateProject();
                        if (e.key === 'Escape') { setShowAddProject(false); setNewProjectName(''); }
                      }}
                      placeholder="New Project Code..."
                      className="flex-1 h-full px-3.5 bg-transparent outline-none text-xs font-bold text-indigo-605 font-mono placeholder:text-slate-350"
                    />
                    <div className="flex items-center h-full pr-1.5 gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleCreateProject}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                        title="Create Project"
                      >
                        <Check size={14} className="stroke-[3px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddProject(false); setNewProjectName(''); }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider shadow-sm"
                        title="Cancel"
                      >
                        <SafeIcon name="X" size={10} className="stroke-[3px]" />
                        <span>Cancel</span>
                      </button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Project Node Quick Badges */}
          {projects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {projects.map(p => (
                <span
                  key={p}
                  className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold border shadow-sm transition-all cursor-pointer ${
                    p === selectedProject
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md animate-fade-in'
                      : 'bg-slate-50 text-slate-650 border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    onChangeProject?.(p);
                    onChangeDesign?.('');
                  }}
                >
                  {p}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRequestDeleteProject(p); }}
                    className={`p-0.5 rounded-md hover:bg-red-550 hover:text-white transition-colors ${p === selectedProject ? 'text-indigo-200 group-hover:text-red-200' : 'text-slate-450'}`}
                    title="Remove Project"
                  >
                    <SafeIcon name="X" size={10} className="stroke-[3px]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Divider */}
        <div className="relative flex py-1 items-center select-none">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-3 text-[8px] text-slate-300 font-extrabold uppercase tracking-widest">Subset Mapping</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Design Selector Zone */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1 select-none">
            <Settings size={12} className="text-sky-500" />
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
              Select Design Subset
            </label>
          </div>

          <div className={`relative flex items-center border rounded-2xl outline-none transition-all overflow-hidden h-11 text-xs font-bold shadow-sm ${
            selectedProject 
              ? 'border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500/50 focus-within:bg-white' 
              : 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed opacity-60'
          }`}>
            <AnimatePresence mode="wait">
              {!showAddDesign ? (
                <motion.div
                  key="design-select-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center w-full h-full animate-fade-in"
                >
                  <select
                    value={selectedDesign}
                    onChange={e => onChangeDesign?.(e.target.value)}
                    disabled={!selectedProject}
                    className="w-full h-full pl-3.5 pr-10 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer appearance-none disabled:cursor-not-allowed disabled:text-slate-450"
                  >
                    <option value="">{selectedProject ? '-- Choose Design Subset --' : 'Select a Project ID first'}</option>
                    {designs.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div className="absolute right-12 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                  <div className="h-5 w-px bg-slate-200"></div>
                  <button
                    type="button"
                    disabled={!selectedProject}
                    onClick={() => {
                      if (!selectedProject) return;
                      setShowAddDesign(true);
                      setNewDesignName('');
                    }}
                    className="h-full px-4 text-sky-600 hover:text-sky-800 disabled:text-slate-300 hover:bg-slate-100 disabled:hover:bg-transparent flex items-center justify-center transition-all cursor-pointer group disabled:cursor-not-allowed"
                    title="Create New Design Subset"
                  >
                    <Plus size={15} className="group-hover:scale-110 transition-transform stroke-[2.5px]" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="design-add-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center w-full h-full"
                >
                    <input
                      ref={designInputRef}
                      type="text"
                      value={newDesignName}
                      onChange={e => setNewDesignName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateDesign();
                        if (e.key === 'Escape') { setShowAddDesign(false); setNewDesignName(''); }
                      }}
                      placeholder="New Design Custom Code..."
                      className="flex-1 h-full px-3.5 bg-transparent outline-none text-xs font-bold text-sky-600 font-mono placeholder:text-slate-350"
                    />
                    <div className="flex items-center h-full pr-1.5 gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleCreateDesign}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                        title="Create Design Subset"
                      >
                        <Check size={14} className="stroke-[3px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddDesign(false); setNewDesignName(''); }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider shadow-sm"
                        title="Cancel"
                      >
                        <SafeIcon name="X" size={10} className="stroke-[3px]" />
                        <span>Cancel</span>
                      </button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Design Node Quick Badges */}
          {designs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {designs.map(d => (
                <span
                  key={d}
                  className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold border shadow-sm transition-all cursor-pointer ${
                    d === selectedDesign
                      ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-md animate-fade-in'
                      : 'bg-slate-50 text-slate-650 border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => onChangeDesign?.(d)}
                >
                  {d}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRequestDeleteDesign(d); }}
                    className={`p-0.5 rounded-md hover:bg-red-550 hover:text-white transition-colors ${d === selectedDesign ? 'text-sky-200 group-hover:text-red-200' : 'text-slate-450'}`}
                    title="Remove Design Subset"
                  >
                    <SafeIcon name="X" size={10} className="stroke-[3px]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Protected Excel Imports & Exports with Premium Modal UX ── */}
      <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Network size={14} className="stroke-[2.5px]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Encrypted Worksheet Pipeline
              </p>
              <p className="text-[9px] font-medium text-slate-400">Preserve nested matrix schemas in Excel</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={openExportDialog}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] rounded-xl text-[11px] font-black flex items-center justify-center gap-2.5 uppercase tracking-wider py-3 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
          >
            <SafeIcon name="Download" size={14} className="stroke-[2.5px] shrink-0" />
            <span>Compile & Export</span>
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] rounded-xl text-[11px] font-black flex items-center justify-center gap-2.5 uppercase tracking-wider py-3 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
          >
            <SafeIcon name="Upload" size={14} className="stroke-[2.5px] shrink-0" />
            <span>Inject & Sync</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Tip Box for clean user guidance */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl flex items-start gap-2.5 border border-amber-100/70 select-none">
          <Lightbulb size={13} className="text-amber-500 mt-0.5 shrink-0 animate-bounce" />
          <p className="text-[9px] font-semibold text-amber-800 leading-relaxed">
            Note: Avoid restructuring column headers. Excel is protected with safety rule macros. Simply modify the <strong className="text-amber-900 bg-amber-100/60 px-1 py-0.5 rounded">Value</strong> block row to apply parameters instantly.
          </p>
        </div>
      </div>

      {/* ── Matrix Parameters Configuration Dashboard ── */}
      <div 
        ref={customizationFormRef}
        className={`p-5 bg-white border shadow-sm rounded-3xl transition-all duration-300 space-y-4 ${
          editingKey 
            ? 'border-indigo-400 ring-4 ring-indigo-50/70 shadow-indigo-150/30' 
            : 'border-slate-100'
        }`}
      >
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-slate-700 animate-spin-slow" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
              Parameter Matrix Customization
            </span>
          </div>
          {editingKey && (
            <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border border-amber-200 animate-pulse">
              Active Edit
            </span>
          )}
        </div>

        {!hasSelection ? (
          /* Premium Locked State Card */
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 select-none">
            <Lock size={22} className="mx-auto text-slate-400 mb-2 animate-bounce" />
            <p className="text-[11px] font-black text-slate-700 uppercase mb-0.5">
              Active Context Locked
            </p>
            <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto font-medium">
              Please initialize or click an existing project code and design subset node above to manage key parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show dynamic active edit notification if editing */}
            {editingKey && (
              <div className="bg-amber-50/85 border border-amber-100 text-amber-900 rounded-2xl p-3 flex items-center justify-between shadow-sm select-none animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl">
                    <Pencil size={11} className="stroke-[2.5px]" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider leading-none mb-1">Active Rename mode</h4>
                    <p className="text-[9px] text-amber-705 font-medium">
                      Modifying key <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-800">{editingKey}</code>. Rename key to trigger save cloning.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFields}
                  className="text-[9px] bg-white border border-slate-200 hover:bg-slate-55 text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider shrink-0"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Row inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1 select-none">
                  Parameter Key (Unique Identifier)
                </label>
                <input
                  type="text"
                  value={settingKey}
                  onChange={e => setSettingKey(e.target.value)}
                  placeholder="e.g. TARGET_THRESHOLD"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-100 text-slate-805 outline-none uppercase font-mono transition-all focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1 select-none">
                  Parameter Value (System Variable)
                </label>
                <input
                  type="text"
                  value={settingValue}
                  onChange={e => setSettingValue(e.target.value)}
                  placeholder="e.g. 85 or true or #EE3311"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-100 text-slate-805 outline-none transition-all focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1 select-none">
                  Variable Scope / Description
                </label>
                <input
                  type="text"
                  value={settingDesc}
                  onChange={e => setSettingDesc(e.target.value)}
                  placeholder="Add scope details or contextual formula"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-100 text-slate-805 outline-none transition-all focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Action Buttons for Form */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveSetting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <SafeIcon name="Save" size={14} className="stroke-[2.5px] shrink-0" />
                <span>{editingKey ? 'Commit Update' : 'Publish Var'}</span>
              </button>
              
              <button
                type="button"
                onClick={handleClearFields}
                className="w-full bg-slate-50 text-slate-655 hover:bg-slate-100 active:scale-[0.98] py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <SafeIcon name="X" size={14} className="stroke-[2.5px] shrink-0" />
                <span>Reset Fields</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Active Matrix Settings Tabulation ── */}
      {hasSelection && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <div className="flex items-center gap-1.5">
              <List size={13} className="text-slate-600" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Variable Pool ({settingsList.length})
              </span>
            </div>
            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
              {selectedProject} / {selectedDesign}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5">
            {settingsList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[10px] font-bold flex flex-col items-center justify-center gap-2">
                <SlidersHorizontal size={18} className="opacity-40 animate-pulse" />
                <span>No custom matrix variables configured yet. Publish one above.</span>
              </div>
            ) : (
              settingsList.map((item) => (
                <div
                  key={item.key}
                  className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl hover:shadow-md hover:border-indigo-100 hover:bg-white transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-indigo-700 mb-1.5 truncate uppercase font-mono">{item.key}</p>
                      
                      <div className="inline-flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Value:</span>
                        <code className="text-[10px] text-slate-800 font-mono font-black bg-white px-2 py-0.5 rounded border border-slate-150 shadow-sm">
                          {String(item.value)}
                        </code>
                      </div>

                      {item.description && (
                        <p className="text-[10px] text-slate-400 italic mt-2 leading-relaxed bg-white/50 p-1.5 rounded-lg border border-slate-100/50">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditSetting(item)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit entry"
                      >
                        <Pencil size={11} className="stroke-[2.5px]" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteSetting(item.key)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Trash entry"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Built-in Visual Dialog Modals for Bypass confirmation blocking ── */}
      <AnimatePresence>
        {dialogType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md rounded-3xl flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xl max-w-sm w-full space-y-4 overflow-y-auto max-h-full"
            >
              {/* Export Modal Dialog */}
              {dialogType === 'export' && (
                <>
                  <div className="flex items-center gap-3 border-b pb-3 text-slate-900">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <KeyRound size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider">Export Protection Key</h3>
                      <p className="text-[9px] text-slate-400">Lock worksheet modification cells</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3.5">
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      Enter the worksheet protection password. This password locks cell hierarchies from unauthorized updates inside Excel. Users will only be allowed to update value fields.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Worksheet Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={dialogPassword}
                          onChange={e => setDialogPassword(e.target.value)}
                          placeholder="e.g. PASSWORD"
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-150 font-mono tracking-widest text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer focus:outline-none"
                          title={showPassword ? "Hide Password" : "Show Password"}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setDialogType(null); setShowPassword(false); }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeExport}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      Export <ArrowRight size={10} />
                    </button>
                  </div>
                </>
              )}

              {/* Import Password input Modal Dialog */}
              {dialogType === 'import' && (
                <>
                  <div className="flex items-center gap-3 border-b pb-3 text-slate-900">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <KeyRound size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider">Import Verification</h3>
                      <p className="text-[9px] text-slate-400">Validate sheet protection rule</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3.5">
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      To successfully parse and import parameters, please provide the worksheet validation password associated with the file.
                    </p>
                    
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-dashed flex items-center justify-between text-[10px] font-semibold text-slate-700">
                      <span>File targeted:</span>
                      <strong className="text-slate-900 truncate max-w-[150px]">{dialogTarget?.name}</strong>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Worksheet Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={dialogPassword}
                          onChange={e => setDialogPassword(e.target.value)}
                          placeholder="e.g. PASSWORD"
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-150 font-mono tracking-widest text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer focus:outline-none"
                          title={showPassword ? "Hide Password" : "Show Password"}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDialogType(null);
                        setDialogTarget(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeImport}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      Confirm Setup <ArrowRight size={10} />
                    </button>
                  </div>
                </>
              )}

              {/* Confirm Delete Project Dialog */}
              {dialogType === 'delete_project' && (
                <>
                  <div className="flex items-center gap-3 border-b pb-3 text-red-650">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl animate-pulse">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Purge Confirmation</h3>
                      <p className="text-[9px] text-red-500">Irreversible design matrix deletion</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      Are you absolutely sure you want to delete the project <strong className="text-red-600 font-mono bg-red-50 px-1 py-0.5 rounded border border-red-100">{dialogTarget}</strong>? This action will purge all associated design schemas and keys permanently.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setDialogType(null); setDialogTarget(null); }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-colors"
                    >
                      Hold On
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDeleteProject(dialogTarget)}
                      className="flex-1 bg-red-650 hover:bg-red-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all"
                    >
                      Yes, Purge Project
                    </button>
                  </div>
                </>
              )}

              {/* Confirm Delete Design Dialog */}
              {dialogType === 'delete_design' && (
                <>
                  <div className="flex items-center gap-3 border-b pb-3 text-red-650">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl animate-pulse">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Purge Design Node</h3>
                      <p className="text-[9px] text-red-500">Irreversible parameter key deletion</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      Are you sure you want to delete the design node <strong className="text-red-600 font-mono bg-red-50 px-1 py-0.5 rounded border border-red-100">{dialogTarget}</strong> inside project <strong className="text-slate-900">{selectedProject}</strong>? All configuration items inside will be lost.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setDialogType(null); setDialogTarget(null); }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-colors"
                    >
                      Hold On
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDeleteDesign(dialogTarget)}
                      className="flex-1 bg-red-650 hover:bg-red-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all"
                    >
                      Yes, Purge Node
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Alert Toast ── */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[1000000] bg-white rounded-2xl border border-slate-200 p-4 shadow-xl flex items-center gap-2.5 max-w-sm"
          >
            {alert.type === 'success'
              ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              : <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            }
            <p className="text-[11px] font-bold text-slate-700 leading-normal">{alert.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading Overlay ── */}
      {isLoading && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-2xl bg-slate-950 px-6 py-4.5 text-[11px] font-bold text-white uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            Processing Sheet File...
          </div>
        </div>
      )}
    </div>
  );
}
