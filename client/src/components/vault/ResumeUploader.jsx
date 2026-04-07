import { useState, useRef } from 'react';
import { uploadResume, confirmResumeImport } from '../../api';

export default function ResumeUploader({ onImportComplete, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [selectedExperiences, setSelectedExperiences] = useState([]);
  const [error, setError] = useState(null);
  const [updateProfile, setUpdateProfile] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setParsedData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      setParsing(true);
      const data = await uploadResume(file);
      setParsedData(data);
      // Select all experiences by default
      setSelectedExperiences(data.experiences.map((_, i) => i));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse resume. Please try again.');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const toggleExperience = (index) => {
    setSelectedExperiences(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleConfirm = async () => {
    if (!parsedData || selectedExperiences.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const experiencesToImport = selectedExperiences.map(i => parsedData.experiences[i]);
      await confirmResumeImport(experiencesToImport, parsedData.personalInfo, updateProfile);
      onImportComplete?.(experiencesToImport.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import experiences. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'work': return 'work';
      case 'project': return 'code';
      case 'education': return 'school';
      case 'skill': return 'build';
      default: return 'description';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'work': return 'Work Experience';
      case 'project': return 'Project';
      case 'education': return 'Education';
      case 'skill': return 'Skills';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-scrim/30 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div>
            <h2 className="font-display text-lg font-semibold text-on-surface m-0">
              Import Resume
            </h2>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Upload your existing resume to auto-populate your vault
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm">
              {error}
            </div>
          )}

          {!parsedData ? (
            /* Upload Step */
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant hover:border-primary p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">
                  upload_file
                </span>
                <p className="font-body text-sm text-on-surface mb-1">
                  {file ? file.name : 'Click to select a PDF resume'}
                </p>
                <p className="font-body text-xs text-on-surface-variant">
                  Maximum file size: 5MB
                </p>
              </div>

              {file && (
                <div className="flex items-center gap-3 p-3 bg-surface-container">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1">
                    <p className="font-body text-sm text-on-surface m-0">{file.name}</p>
                    <p className="font-body text-xs text-on-surface-variant m-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}

              {parsing && (
                <div className="flex items-center justify-center gap-3 p-6">
                  <div className="animate-spin">
                    <span className="material-symbols-outlined text-primary">progress_activity</span>
                  </div>
                  <p className="font-body text-sm text-on-surface-variant">
                    Extracting and parsing your resume...
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Review Step */
            <div className="space-y-4">
              {/* Personal Info */}
              {parsedData.personalInfo?.name && (
                <div className="p-4 bg-surface-container">
                  <h3 className="font-display text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                    Detected Personal Info
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {parsedData.personalInfo.name && (
                      <div>
                        <span className="text-on-surface-variant">Name:</span>{' '}
                        <span className="text-on-surface">{parsedData.personalInfo.name}</span>
                      </div>
                    )}
                    {parsedData.personalInfo.email && (
                      <div>
                        <span className="text-on-surface-variant">Email:</span>{' '}
                        <span className="text-on-surface">{parsedData.personalInfo.email}</span>
                      </div>
                    )}
                    {parsedData.personalInfo.phone && (
                      <div>
                        <span className="text-on-surface-variant">Phone:</span>{' '}
                        <span className="text-on-surface">{parsedData.personalInfo.phone}</span>
                      </div>
                    )}
                    {parsedData.personalInfo.linkedinUrl && (
                      <div>
                        <span className="text-on-surface-variant">LinkedIn:</span>{' '}
                        <span className="text-on-surface truncate">{parsedData.personalInfo.linkedinUrl}</span>
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateProfile}
                      onChange={(e) => setUpdateProfile(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="font-body text-xs text-on-surface-variant">
                      Update my profile with this info
                    </span>
                  </label>
                </div>
              )}

              {/* Experiences */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
                    Parsed Experiences ({parsedData.experiences.length})
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedExperiences.length === parsedData.experiences.length) {
                        setSelectedExperiences([]);
                      } else {
                        setSelectedExperiences(parsedData.experiences.map((_, i) => i));
                      }
                    }}
                    className="font-body text-xs text-primary hover:underline cursor-pointer bg-transparent border-none"
                  >
                    {selectedExperiences.length === parsedData.experiences.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {parsedData.experiences.map((exp, index) => (
                    <div
                      key={index}
                      onClick={() => toggleExperience(index)}
                      className={`p-3 cursor-pointer border transition-colors ${
                        selectedExperiences.includes(index)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant bg-surface-container hover:border-outline'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExperiences.includes(index)}
                          onChange={() => toggleExperience(index)}
                          className="accent-primary mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-base text-on-surface-variant">
                              {getTypeIcon(exp.type)}
                            </span>
                            <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
                              {getTypeLabel(exp.type)}
                            </span>
                          </div>
                          <h4 className="font-body text-sm font-semibold text-on-surface m-0 truncate">
                            {exp.title}
                          </h4>
                          {exp.organization && (
                            <p className="font-body text-xs text-on-surface-variant mt-0.5">
                              {exp.organization}
                              {exp.startDate && ` • ${exp.startDate}`}
                              {exp.endDate && ` - ${exp.endDate}`}
                            </p>
                          )}
                          {exp.bullets && exp.bullets.length > 0 && (
                            <p className="font-body text-xs text-on-surface-variant mt-1 truncate">
                              {exp.bullets.length} bullet point{exp.bullets.length !== 1 ? 's' : ''}
                            </p>
                          )}
                          {exp.tags && exp.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exp.tags.slice(0, 5).map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-1.5 py-0.5 font-display text-[0.5rem] uppercase tracking-wider bg-surface-container-high text-on-surface-variant"
                                >
                                  {tag}
                                </span>
                              ))}
                              {exp.tags.length > 5 && (
                                <span className="font-body text-[0.5rem] text-on-surface-variant">
                                  +{exp.tags.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-outline-variant bg-surface-container">
          <button
            onClick={parsedData ? () => setParsedData(null) : onClose}
            className="px-4 py-2 font-display text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface cursor-pointer bg-transparent border border-outline-variant"
          >
            {parsedData ? 'Back' : 'Cancel'}
          </button>
          
          {!parsedData ? (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 font-display text-xs uppercase tracking-widest bg-primary text-on-primary hover:bg-primary/90 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing...' : 'Parse Resume'}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={selectedExperiences.length === 0 || uploading}
              className="px-6 py-2 font-display text-xs uppercase tracking-widest bg-primary text-on-primary hover:bg-primary/90 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Importing...' : `Import ${selectedExperiences.length} Experience${selectedExperiences.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
