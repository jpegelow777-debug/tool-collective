import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { marked } from 'marked';

export default function Tool() {
  const router = useRouter();
  const { slug } = router.query;
  const toolSlug = Array.isArray(slug) ? slug[0] : slug;

  const [tool, setTool] = useState(null);
  const [formData, setFormData] = useState({});
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (toolSlug) fetchTool();
  }, [toolSlug]);

  const fetchTool = async () => {
    const res = await fetch(`/api/tool?slug=${toolSlug}`);
    const data = await res.json();
    setTool(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOutput('');

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, formData })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            setOutput(prev => prev + (json.choices[0]?.delta?.content || ''));
          } catch (e) {}
        }
      });
    }
    setLoading(false);
  };

  if (!tool || !tool.Name) {
    return <div className="p-20 text-center text-4xl text-gray-700">Tool not found</div>;
  }

  const inputs = JSON.parse(tool.Inputs || tool.inputs || '[]');

  // —————— YOUR BRAND COLORS (never changes again) ——————
  const primary = "#c96635";
  const primaryDark = "#551606";
  const secondary = "#42888f";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl md:text-7xl font-black text-center mb-6 tracking-tight text-gray-900">
          {tool.Name}
        </h1>
        {tool.Description && (
          <p className="text-center text-xl md:text-2xl mb-16 text-gray-700 max-w-3xl mx-auto font-light">
            {tool.Description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 mb-20">
          {inputs.map((input, i) => (
            <div
              key={i}
              className="group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            >
              <label className="block text-lg font-semibold mb-4 text-gray-800
