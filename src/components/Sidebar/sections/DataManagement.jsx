import SafeIcon from '../../SafeIcon';

const DataManagement = ({ fileName, sheetNames, selectedSheet, onUpload, onSelectSheet }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <SafeIcon name="Database" size={12} /> Data Management
      </h3>
      <div
        role="button"
        tabIndex={0}
        onClick={() => document.getElementById('upload-input').click()}
        className={`p-4 lg:p-6 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group touch-target ${fileName ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
      >
        <div className={`p-3 rounded-full mb-3 transition-transform group-hover:scale-110 ${fileName ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
          <SafeIcon name={fileName ? 'FileCheck2' : 'UploadCloud'} size={24} />
        </div>
        <span className="text-[11px] font-black text-slate-600 block truncate w-full px-2">
          {fileName || 'Upload Excel / CSV File'}
        </span>
        <input 
          id="upload-input" 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          className="hidden" 
          onChange={(e) => onUpload(e.target.files?.[0])} 
        />
      </div>

      {sheetNames.length > 1 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Please Select the Sheet</label>
          <select
            value={selectedSheet}
            onChange={(e) => onSelectSheet(e.target.value)}
            className="w-full p-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
};

export default DataManagement;
