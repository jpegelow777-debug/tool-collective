import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import Head from 'next/head';

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

  // YOUR BRAND COLORS
  const primary = "#c96635";
  const primaryDark = "#551606";
  const secondary = "#42888f";

  return (
    <>
      <Head>
        <title>{tool.Name} | The Tool Collective</title>
        <meta name="description" content={tool.Description || `Find the perfect ${tool.Name.toLowerCase()} in seconds.`} />
      </Head>

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
              <div key={i} className="group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                <label className="block text-lg font-semibold mb-4 text-gray-800">
                  {input.label}
                </label>
                <select
                  required={input.required}
                  className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-gray-200 text-gray-900 text-lg font-medium
                             focus:outline-none focus:border-transparent focus:ring-4 focus:ring-orange-200 transition-all duration-300 appearance-none cursor-pointer shadow-lg hover:shadow-xl"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 1.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.2em",
                  }}
                  onChange={e => setFormData({ ...formData, [input.label]: e.target.value })}
                >
                  <option value="">Select {input.label.toLowerCase()}…</option>
                  {input.options.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="md:col-span-2 text-center mt-12">
              <button
                type="submit"
                disabled={loading}
                className="relative px-24 py-7 text-2xl font-bold text-white rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
              >
                <span className="relative z-10">
                  {loading ? "Generating…" : "Get My Recommendations"}
                </span>
                <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity" />
              </button>
            </div>
          </form>

          {output && (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 md:p-16 shadow-2xl border border-gray-100">
              <div className="prose prose-lg prose-slate max-w-none text-gray-800">
                <div dangerouslySetInnerHTML={{ __html: marked(output) }} />
              </div>
            </div>
          )}

          {/* STATIC AFFILIATE CARDS FROM BASEROW */}
          {tool["Affiliate Cards"] && (
            <div className="mt-20">
              <h2 className="text-3xl font-black text-center mb-10">Top Recommended Products</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {JSON.parse(tool["Affiliate Cards"] || '[]').map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="nofollow sponsored"
                    className="block bg-white rounded-2xl shadow-xl overflow-hidden hover:scale-105 transition-transform"
                  >
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                    <div className="p-6 text-center">
                      <p className="font-bold text-lg text-gray-900 line-clamp-2">{item.name}</p>
                      <p className="text-2xl font-black text-green-600 mt-2">{item.price}</p>
                      <span className="inline-block mt-4 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full">
                        Buy Now →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
