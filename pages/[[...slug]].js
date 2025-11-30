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


   // ←←← THESE TWO LINES ARE THE ONLY IMPORTANT PART ←←←
  if (!tool || !tool.Name) {
    return <div className="p-12 text-center text-3xl text-white">Tool not found</div>;
  }
  const inputs = JSON.parse(tool.Inputs || tool.inputs || tool["Inputs"] || '[]');
  // ←←← END ←←←


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-blue-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-10 drop-shadow-lg">
          {tool.Name}
        </h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 mb-12">
          {inputs.map((input, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-semibold mb-3">{input.label}</label>
              <select
                required={input.required}
                className="w-full p-4 rounded-xl bg-white/20 text-white border border-white/40 focus:outline-none focus:border-white"
                onChange={e => setFormData({ ...formData, [input.label]: e.target.value })}
              >
                <option value="">Select…</option>
                {input.options.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          ))}

          <div className="md:col-span-2 text-center mt-8">
            <button
              type="submit"
              disabled={loading}
              className="px-16 py-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-2xl font-bold rounded-full hover:scale-105 transition shadow-2xl"
            >
              {loading ? 'Generating…' : 'Get Recommendations'}
            </button>
          </div>
        </form>

        {output && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: marked(output) }} />
          </div>
        )}
      </div>
    </div>
  );
}
