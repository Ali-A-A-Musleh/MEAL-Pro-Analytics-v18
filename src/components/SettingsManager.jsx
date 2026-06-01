import React, { useCallback, useEffect, useRef, useState } from 'react';
// Use the browser-ready build of exceljs to avoid Rollup/Vite resolution issues
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'projectSettings';
const DEFAULT_PASSWORD = 'MEAL_STUDIO_2026';

function convertValue(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();

  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase() === 'true';
  }

  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function loadSettingsFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveSettingsToLocalStorage(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getProjectNames() {
  const projects = loadSettingsFromLocalStorage();
  return Object.keys(projects);
}

export function getDesignNames(projectName) {
  const projects = loadSettingsFromLocalStorage();
  return projects[projectName] ? Object.keys(projects[projectName]) : [];
}

export function getDesignSettings(projectName, designName) {
  const projects = loadSettingsFromLocalStorage();
  return projects[projectName]?.[designName] ?? {};
}

function buildWorkbookRows(settings) {
  const rows = [['Project Name', 'Design Name', 'Setting Name', 'Value', 'Description']];

  Object.entries(settings).forEach(([projectName, designs]) => {
    Object.entries(designs).forEach(([designName, designSettings]) => {
      Object.entries(designSettings).forEach(([settingName, { value, description }]) => {
        rows.push([projectName, designName, settingName, value, description ?? '']);
      });
    });
  });

  return rows;
}

async function buildSettingsWorkbook(settings, password) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Settings');

  const rows = buildWorkbookRows(settings);
  rows.forEach((row) => sheet.addRow(row));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        cell.protection = { locked: false };
      });
      return;
    }

    row.getCell(1).protection = { locked: true };
    row.getCell(2).protection = { locked: true };
    row.getCell(3).protection = { locked: true };
    row.getCell(4).protection = { locked: false };
    row.getCell(5).protection = { locked: false };
  });

  await sheet.protect(password, {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    deleteColumns: false,
    insertRows: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
  });

  return workbook;
}

function askProtectionPassword() {
  const value = window.prompt('Enter worksheet protection password', DEFAULT_PASSWORD);
  return value && value.trim() ? value.trim() : DEFAULT_PASSWORD;
}

async function downloadWorkbook(workbook, filename = 'project-settings.xlsx') {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function normalizeImportedRow(row) {
  if (!row) return null;
  const [projectName, designName, settingName, rawValue, description] = row;
  if (!projectName || !designName || !settingName) return null;

  return {
    projectName: String(projectName).trim(),
    designName: String(designName).trim(),
    settingName: String(settingName).trim(),
    value: convertValue(rawValue),
    description: description ?? '',
  };
}

function mergeSettings(existingSettings, importedSettings) {
  const next = { ...existingSettings };

  Object.entries(importedSettings).forEach(([projectName, designs]) => {
    if (!next[projectName]) {
      next[projectName] = designs;
      return;
    }

    Object.entries(designs).forEach(([designName, designSettings]) => {
      if (!next[projectName][designName]) {
        next[projectName][designName] = designSettings;
        return;
      }

      next[projectName][designName] = {
        ...next[projectName][designName],
        ...designSettings,
      };
    });
  });

  return next;
}

async function parseImportFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

  const [, ...dataRows] = rows;
  const imported = {};

  dataRows.forEach((row) => {
    const normalized = normalizeImportedRow(row);
    if (!normalized) return;

    const { projectName, designName, settingName, value, description } = normalized;

    if (!imported[projectName]) imported[projectName] = {};
    if (!imported[projectName][designName]) imported[projectName][designName] = {};

    imported[projectName][designName][settingName] = { value, description };
  });

  return imported;
}

export async function exportSettings() {
  const settings = loadSettingsFromLocalStorage();
  if (!Object.keys(settings).length) {
    alert('No project settings found to export. Please add at least one project/design setting first.');
    return;
  }

  const password = askProtectionPassword();
  const workbook = await buildSettingsWorkbook(settings, password);
  await downloadWorkbook(workbook);
}

export async function importSettings(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const imported = await parseImportFile(file);
  const existing = loadSettingsFromLocalStorage();
  const merged = mergeSettings(existing, imported);
  saveSettingsToLocalStorage(merged);
  alert('Settings imported and merged successfully.');
}

export default function SettingsManager({ onSelectProject, onSelectDesign }) {
  const [projects, setProjects] = useState(getProjectNames());
  const [designs, setDesigns] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newDesignName, setNewDesignName] = useState('');
  const fileInputRef = useRef(null);

  const refreshLists = useCallback(() => {
    const loadedProjects = getProjectNames();
    setProjects(loadedProjects);

    if (!selectedProject && loadedProjects.length) {
      setSelectedProject(loadedProjects[0]);
      return;
    }

    if (selectedProject && !loadedProjects.includes(selectedProject)) {
      setSelectedProject(loadedProjects[0] || '');
    }
  }, [selectedProject]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  useEffect(() => {
    setDesigns(getDesignNames(selectedProject));
  }, [selectedProject]);

  useEffect(() => {
    if (designs.length && !designs.includes(selectedDesign)) {
      setSelectedDesign(designs[0] || '');
    }
  }, [designs, selectedDesign]);

  useEffect(() => {
    if (selectedProject && selectedDesign) {
      onSelectProject?.(selectedProject);
      onSelectDesign?.(selectedDesign);
    }
  }, [selectedProject, selectedDesign, onSelectProject, onSelectDesign]);

  const createProject = () => {
    const name = newProjectName.trim();
    if (!name) {
      alert('Enter a project name before adding.');
      return;
    }

    const current = loadSettingsFromLocalStorage();
    if (!current[name]) {
      current[name] = {};
      saveSettingsToLocalStorage(current);
      setNewProjectName('');
      setSelectedProject(name);
      setSelectedDesign('');
      refreshLists();
      alert(`Project "${name}" created.`);
      return;
    }

    alert(`Project "${name}" already exists.`);
  };

  const createDesign = () => {
    const project = selectedProject.trim();
    const name = newDesignName.trim();

    if (!project) {
      alert('Please select a project first.');
      return;
    }

    if (!name) {
      alert('Enter a design name before adding.');
      return;
    }

    const current = loadSettingsFromLocalStorage();
    if (!current[project]) current[project] = {};
    if (!current[project][name]) {
      current[project][name] = {};
      saveSettingsToLocalStorage(current);
      setNewDesignName('');
      setSelectedDesign(name);
      setDesigns(getDesignNames(project));
      alert(`Design "${name}" added to project "${project}".`);
      return;
    }

    alert(`Design "${name}" already exists under project "${project}".`);
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    setSelectedDesign('');
  };

  const handleDesignChange = (event) => {
    setSelectedDesign(event.target.value);
  };

  const handleImportClick = useCallback(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  }, []);

  const handleImport = async (event) => {
    await importSettings(event);
    refreshLists();
  };

  return (
    <section className="p-4 bg-slate-50 rounded-xl shadow-inner border border-slate-200 space-y-4">
      <h2 className="text-xl font-bold text-slate-700">Project Settings</h2>

      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Project</label>
          <select
            value={selectedProject}
            onChange={handleProjectChange}
            className="w-full p-3 rounded-2xl border border-slate-200 bg-white text-sm"
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
              className="flex-1 p-3 rounded-2xl border border-slate-200 bg-white text-sm"
            />
            <button
              type="button"
              onClick={createProject}
              className="px-4 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 transition"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Design</label>
          <select
            value={selectedDesign}
            onChange={handleDesignChange}
            disabled={!selectedProject}
            className="w-full p-3 rounded-2xl border border-slate-200 bg-white text-sm"
          >
            <option value="">Select design</option>
            {designs.map((design) => (
              <option key={design} value={design}>{design}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDesignName}
              onChange={(e) => setNewDesignName(e.target.value)}
              placeholder="New design name"
              className="flex-1 p-3 rounded-2xl border border-slate-200 bg-white text-sm"
            />
            <button
              type="button"
              onClick={createDesign}
              className="px-4 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={exportSettings}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Export Settings (Excel)
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Import Settings (Excel)
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
    </section>
  );
}
