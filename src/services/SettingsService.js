import ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as XLSX from 'xlsx';

export const STORAGE_KEY = 'projectSettings';
export const ACTIVE_SELECTION_KEY = 'meal_active_selection';
export const CHART_CONFIG_KEY = 'meal_chart_config';
export const CHART_VISUALS_KEY = 'meal_chart_visuals';
export const DEFAULT_PASSWORD = 'MEAL_STUDIO_2026';

export function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getProjectNames() {
  return Object.keys(loadSettings());
}

export function getAllSettings() {
  return loadSettings();
}

export function loadActiveSelection() {
  const raw = localStorage.getItem(ACTIVE_SELECTION_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSelection(selection) {
  try {
    localStorage.setItem(ACTIVE_SELECTION_KEY, JSON.stringify(selection));
  } catch {
    // ignore storage failures
  }
}

export function loadChartConfig() {
  const raw = localStorage.getItem(CHART_CONFIG_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChartConfig(config) {
  try {
    localStorage.setItem(CHART_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore storage failures
  }
}

export function loadChartVisuals() {
  const raw = localStorage.getItem(CHART_VISUALS_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChartVisuals(visuals) {
  try {
    localStorage.setItem(CHART_VISUALS_KEY, JSON.stringify(visuals));
  } catch {
    // ignore storage failures
  }
}

export function getDesignNames(projectName) {
  const settings = loadSettings();
  return settings[projectName] ? Object.keys(settings[projectName]) : [];
}

export function setDesignSettings(projectName, designName, settingsMap) {
  // Merge and persist multiple design settings at once
  if (!projectName || !designName || !settingsMap) return;
  const settings = loadSettings();
  if (!settings[projectName]) settings[projectName] = {};
  if (!settings[projectName][designName]) settings[projectName][designName] = {};

  Object.entries(settingsMap).forEach(([key, value]) => {
    settings[projectName][designName][key] = {
      value,
      description: (settings[projectName][designName][key] && settings[projectName][designName][key].description) || ''
    };
  });

  saveSettings(settings);
}

export function getDesignSettings(projectName, designName) {
  const settings = loadSettings();
  return settings[projectName]?.[designName] ?? {};
}

export function ensureProject(projectName) {
  if (!projectName) return;
  const settings = loadSettings();
  if (!settings[projectName]) {
    settings[projectName] = {};
    saveSettings(settings);
  }
}

export function ensureDesign(projectName, designName) {
  if (!projectName || !designName) return;
  const settings = loadSettings();
  if (!settings[projectName]) settings[projectName] = {};
  if (!settings[projectName][designName]) {
    settings[projectName][designName] = {};
    saveSettings(settings);
  }
}

export function addOrUpdateSetting(projectName, designName, settingKey, value, description = '') {
  if (!projectName || !designName || !settingKey) return;
  const settings = loadSettings();
  if (!settings[projectName]) settings[projectName] = {};
  if (!settings[projectName][designName]) settings[projectName][designName] = {};

  settings[projectName][designName][settingKey] = {
    value,
    description: description ?? '',
  };
  saveSettings(settings);
}

export function deleteSetting(projectName, designName, settingKey) {
  const settings = loadSettings();
  if (settings[projectName]?.[designName]?.[settingKey]) {
    delete settings[projectName][designName][settingKey];
    saveSettings(settings);
  }
}

export function mergeSettings(existingSettings, importedSettings) {
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

export function buildWorkbookRows(settings) {
  const rows = [['Project Name', 'Design Name', 'Setting Key', 'Value', 'Description']];

  Object.entries(settings).forEach(([projectName, designs]) => {
    Object.entries(designs).forEach(([designName, designSettings]) => {
      Object.entries(designSettings).forEach(([settingKey, { value, description }]) => {
        rows.push([projectName, designName, settingKey, value, description ?? '']);
      });
    });
  });

  return rows;
}

export async function createProtectedWorkbook(settings, password) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Settings');

  buildWorkbookRows(settings).forEach((row) => sheet.addRow(row));

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

export async function exportSettings(password = DEFAULT_PASSWORD) {
  const settings = loadSettings();
  if (!Object.keys(settings).length) {
    throw new Error('No project settings available to export.');
  }

  const workbook = await createProtectedWorkbook(settings, password);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meal-pro-settings.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function convertValue(value) {
  if (value === undefined || value === null) return '';
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

function normalizeImportedRow(row) {
  if (!row || row.length < 3) return null;

  const [projectName, designName, settingKey, rawValue, description] = row;
  if (!projectName || !designName || !settingKey) return null;

  return {
    projectName: String(projectName).trim(),
    designName: String(designName).trim(),
    settingKey: String(settingKey).trim(),
    value: convertValue(rawValue),
    description: description ?? '',
  };
}

export function validateImportHeaders(row) {
  if (!Array.isArray(row) || row.length < 5) return false;
  const expected = ['project name', 'design name', 'setting key', 'value', 'description'];
  return expected.every((name, index) => {
    const val = String(row[index] || '').trim().toLowerCase();
    return val === name;
  });
}

export async function importSettingsFile(file, password = DEFAULT_PASSWORD) {
  if (!password) {
    throw new Error('Import password is required.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });

  if (!rows.length || !validateImportHeaders(rows[0])) {
    throw new Error('Invalid Excel format. Expected headers: Project Name, Design Name, Setting Key, Value, Description.');
  }

  const [, ...dataRows] = rows;
  const imported = {};

  dataRows.forEach((row) => {
    const normalized = normalizeImportedRow(row);
    if (!normalized) return;

    const { projectName, designName, settingKey, value, description } = normalized;
    if (!imported[projectName]) imported[projectName] = {};
    if (!imported[projectName][designName]) imported[projectName][designName] = {};
    imported[projectName][designName][settingKey] = { value, description };
  });

  const existing = loadSettings();
  const merged = mergeSettings(existing, imported);
  saveSettings(merged);
  return merged;
}
