import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { Copy, ExternalLink, Trash2, Upload, FileCode2, Eye, LayoutDashboard, Server, Activity } from 'lucide-react';

interface Page {
  id: string;
  created_at: string;
  expires_at: string | null;
  views: number;
}

export default function App() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [htmlInput, setHtmlInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'edit' | 'guide'>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.pages);
      }
    } catch (error) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htmlInput.trim()) {
      toast.error('Please enter some HTML content');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          html: htmlInput,
          slug: slugInput.trim() || undefined
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Page uploaded successfully!');
        setHtmlInput('');
        setSlugInput('');
        setActiveTab('dashboard');
        fetchPages();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!htmlInput.trim()) {
      toast.error('Please enter some HTML content');
      return;
    }
    if (!slugInput.trim()) {
      toast.error('Please enter a slug (Page ID)');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch(`/api/pages/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newId: slugInput,
          html: htmlInput 
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Page updated successfully!');
        setHtmlInput('');
        setSlugInput('');
        setEditingId(null);
        setActiveTab('dashboard');
        fetchPages();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      toast.error('An error occurred during update');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = async (id: string) => {
    try {
      const res = await fetch(`/api/pages/${id}`);
      const data = await res.json();
      if (data.success) {
        setHtmlInput(data.page.html_content);
        setSlugInput(data.page.id);
        setEditingId(id);
        setActiveTab('edit');
      } else {
        toast.error('Failed to load page content');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Page deleted');
        setPages(pages.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      <Toaster theme="dark" richColors position="top-right" />
      
      {/* Header */}
      <header className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Server className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">FlowHost</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setEditingId(null);
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('upload');
                setEditingId(null);
                setHtmlInput('');
                setSlugInput('');
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('guide');
                setEditingId(null);
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${activeTab === 'guide' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <FileCode2 className="w-4 h-4" />
              <span className="hidden sm:inline">API Guide</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Hosted Pages</h2>
                <p className="text-zinc-500 text-sm mt-1">Manage and monitor your deployed HTML environments</p>
              </div>
              <button 
                onClick={() => setActiveTab('upload')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                Deploy New Page
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : pages.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-16 text-center backdrop-blur-sm">
                <div className="bg-zinc-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FileCode2 className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No active deployments</h3>
                <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Start hosting your static HTML content by uploading your first page.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-2.5 rounded-xl text-sm font-medium border border-zinc-700 transition-all active:scale-95"
                >
                  Upload HTML
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-800/50 border-b border-zinc-800 text-zinc-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Deployment ID / Slug</th>
                        <th className="px-6 py-4 font-semibold">Created At</th>
                        <th className="px-6 py-4 font-semibold">Hits</th>
                        <th className="px-6 py-4 font-semibold text-right">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-800 p-2 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                                <FileCode2 className="w-4 h-4 text-blue-400" />
                              </div>
                              <span className="font-mono font-medium text-zinc-200">{page.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-zinc-500">
                            {format(new Date(page.created_at), 'MMM d, yyyy · HH:mm')}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-zinc-400 bg-zinc-800/50 w-fit px-2 py-1 rounded-md border border-zinc-700">
                              <Eye className="w-4 h-4" />
                              <span className="font-mono">{page.views}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => copyToClipboard(page.id)}
                                className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-all"
                                title="Copy Public URL"
                              >
                                <Copy className="w-4.5 h-4.5" />
                              </button>
                              <a 
                                href={`/view/${page.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-all"
                                title="View Live Page"
                              >
                                <ExternalLink className="w-4.5 h-4.5" />
                              </a>
                              <button 
                                onClick={() => startEditing(page.id)}
                                className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-all"
                                title="Edit Content"
                              >
                                <FileCode2 className="w-4.5 h-4.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(page.id)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-all"
                                title="Purge Deployment"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'guide' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Manual de Integração API</h2>
              <p className="text-zinc-400">
                Aprenda a hospedar suas páginas dinamicamente através do nosso endpoint de alta performance. 
                Ideal para sistemas automáticos e integrações com FlowAI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="bg-blue-600/10 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Hospedagem de Point</h3>
                <p className="text-sm text-zinc-500">
                  Envie o conteúdo HTML bruto para nosso endpoint e receba instantaneamente uma URL pública.
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="bg-indigo-600/10 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-white">URL Personalizada</h3>
                <p className="text-sm text-zinc-500">
                  Defina um "slug" (nome do estabelecimento) para que o link gerado seja amigável e profissional.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-zinc-800/80 px-6 py-3 flex items-center justify-between border-b border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Exemplo de Requisição (Curl)</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                </div>
                <div className="p-6 overflow-x-auto bg-black/40">
                  <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
{`curl -X POST ${window.location.origin}/api/upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "nome-do-estabelecimento",
    "html": "<html><body><h1>Bem-vindo ao FlowHost</h1></body></html>"
  }'`}
                  </pre>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-zinc-400" />
                  Estrutura do JSON
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-4">
                    <code className="text-blue-400 font-bold shrink-0">slug</code>
                    <span className="text-zinc-400">Opcional. O nome do estabelecimento que servirá de ID da página. (Ex: "loja-do-joao")</span>
                  </li>
                  <li className="flex gap-4">
                    <code className="text-blue-400 font-bold shrink-0">html</code>
                    <span className="text-zinc-400 font-semibold">Obrigatório. O conteúdo HTML completo da página a ser hospedada.</span>
                  </li>
                  <li className="flex gap-4">
                    <code className="text-blue-400 font-bold shrink-0">expiresInDays</code>
                    <span className="text-zinc-400">Opcional. Número de dias até a página ser removida automaticamente.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl border-l-4 border-l-green-500/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Keep-Alive (Manutenção do Banco)
                </h3>
                <p className="text-sm text-zinc-400 mt-2">
                  Para manter seu banco de dados <strong>SQLiteCloud</strong> sempre ativo e evitar hibernação, 
                  configure um ping <code>GET</code> para o endpoint abaixo:
                </p>
                <div className="mt-3 bg-black/40 p-3 rounded-lg border border-zinc-800">
                  <code className="text-xs text-green-400 font-mono">{window.location.origin}/api/health</code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {activeTab === 'edit' ? 'Update Environment' : 'Prepare Deployment'}
              </h2>
              <p className="text-zinc-500 text-sm mt-2">
                {activeTab === 'edit' 
                  ? 'Refine your HTML source and adjust the hosting identifier.' 
                  : 'Host your HTML code instantly. Use a custom slug for a professional link.'}
              </p>
            </div>
            
            <form onSubmit={activeTab === 'edit' ? handleEdit : handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Slug / ID da Página (Nome do Estabelecimento)
                  </label>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <span className="text-zinc-600 text-xs font-mono pl-2 hidden lg:inline">{window.location.host}/view/</span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
                      placeholder={activeTab === 'edit' ? "current-slug" : "ex: nome-do-estabelecimento"}
                      className="flex-1 bg-transparent border-none text-sm font-mono focus:ring-0 outline-none text-zinc-100 placeholder:text-zinc-700"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Apenas letras, números e hifens permitidos.</p>
                </div>
                
                <div className="flex items-end pb-3">
                   <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-3 w-full flex items-center justify-between">
                      <span className="text-zinc-500 text-xs">Public link priority:</span>
                      <span className="text-blue-500 text-xs font-mono font-bold">
                        {slugInput || 'auto-generated-id'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl focus-within:border-blue-500/50 transition-all">
                <div className="bg-zinc-800 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    <FileCode2 className="w-4 h-4" />
                    Source Editor
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  </div>
                </div>
                <textarea
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>My Page</title>&#10;  </head>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                  className="w-full h-[450px] p-6 font-mono text-sm bg-transparent border-none focus:ring-0 resize-none text-blue-100/90 leading-relaxed placeholder:text-zinc-800"
                  spellCheck={false}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-xs text-zinc-500 font-medium tracking-wide">
                    Safe environment enabled. Max size: 5MB per deployment.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard');
                      setEditingId(null);
                    }}
                    className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl transition-all border border-transparent hover:border-zinc-800"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !htmlInput.trim()}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        {activeTab === 'edit' ? <FileCode2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        <span>{activeTab === 'edit' ? 'Execute Update' : 'Live Deploy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
