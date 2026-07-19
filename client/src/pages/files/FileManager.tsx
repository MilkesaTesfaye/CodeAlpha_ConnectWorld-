import { useState, useEffect } from 'react';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  meetingId?: string;
  uploader?: { id: string; displayName?: string | null };
}

export default function FileManager() {
  const [meetingFiles, setMeetingFiles] = useState<FileItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'images' | 'documents'>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadAllFiles();
  }, []);

  async function loadAllFiles() {
    setPageLoading(true);
    try {
      const { data: meetingsData } = await api.get('/meetings', { params: { limit: 20 } });
      const meetingIds = (meetingsData.data || []).map((m: any) => m.id);
      const allFiles: FileItem[] = [];

      // Load files from meetings in parallel
      const results = await Promise.allSettled(
        meetingIds.slice(0, 5).map((mid: string) => api.get(`/files/meeting/${mid}`))
      );
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data.data) {
          allFiles.push(...result.value.data.data);
        }
      });

      setMeetingFiles(allFiles);
    } catch {
      // Fall back to empty state
    } finally {
      setPageLoading(false);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
    return '📁';
  }

  const filteredFiles = meetingFiles.filter((f) => {
    if (activeTab === 'images') return f.mimeType.startsWith('image/');
    if (activeTab === 'documents') return f.mimeType.includes('pdf') || f.mimeType.includes('document') || f.mimeType.includes('word');
    return true;
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success('File uploaded!');
        loadAllFiles();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      toast.success('File deleted');
      setMeetingFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function getDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Files</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload, share, and manage files from your meetings
            </p>
          </div>
          <label className="relative cursor-pointer">
            <input
              type="file"
              onChange={handleUpload}
              className="sr-only"
              disabled={uploading}
            />
            <span className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload File
                </>
              )}
            </span>
          </label>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'all' as const, label: 'All Files', icon: '📁' },
            { key: 'recent' as const, label: 'Recent', icon: '🕐' },
            { key: 'images' as const, label: 'Images', icon: '🖼️' },
            { key: 'documents' as const, label: 'Documents', icon: '📄' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* File Grid */}
        {pageLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No files yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Upload files to share them with your meetings, or join a meeting with shared files
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
                         overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <div className="h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {file.mimeType.startsWith('image/') && file.thumbnailUrl ? (
                    <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : file.mimeType.startsWith('image/') && file.url ? (
                    <img src={file.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{getFileIcon(file.mimeType)}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{getDateLabel(file.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={file.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 
                               hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}>
                      <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                      className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 
                               hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Preview Modal */}
        {selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedFile(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{getFileIcon(selectedFile.mimeType)}</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{selectedFile.originalName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(selectedFile.size)} &bull; {selectedFile.mimeType}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedFile.mimeType.startsWith('image/') ? (
                  <img src={selectedFile.url} alt="" className="max-w-full max-h-[50vh] mx-auto rounded-lg" />
                ) : selectedFile.mimeType.includes('pdf') ? (
                  <iframe src={selectedFile.url} className="w-full h-[50vh] rounded-lg" title="PDF Preview" />
                ) : (
                  <div className="text-center py-12">
                    <span className="text-5xl mb-4 block">{getFileIcon(selectedFile.mimeType)}</span>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Preview not available for this file type</p>
                    <a href={selectedFile.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
