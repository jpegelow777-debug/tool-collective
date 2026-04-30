import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import Head from 'next/head';
import DynamicInput from '../components/DynamicInput';   // ← New Import

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
          } catch {}
        }
      });
    }
    setLoading(false);
  };

  if (!tool || !tool.Name) {
    return <div className="p-20 text-center text-4xl text-gray-700">Tool not found</div>;
  }

  const inputs = JSON.parse(tool.Inputs || tool.inputs || '[]');

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

          {/* Updated Form */}
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 mb-20">
            {inputs.map((input, i) => (
              <div key={i} className="group transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-lg font-semibold mb-4 text-gray-800">
                  {input.label}
                  {input.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                <DynamicInput
                  input={input}
                  value={formData[input.label]}
                  onChange={(newValue) => 
                    setFormData(prev => ({ ...prev, [input.label]: newValue }))
                  }
                />
              </div>
            ))}

            <div className="md:col-span-2 text-center mt-12">
              <button
                type="submit"
                disabled={loading}
                className="relative px-24 py-7 text-2xl font-bold text-white rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl overflow-hidden"
                style={{ background: `linear-gradient(135deg, #c96635 0%, #42888f 100%)` }}
              >
                <span className="relative z-10">
                  {loading ? "Generating…" : "Get My Recommendations"}
                </span>
              </button>
            </div>
          </form>

          {output && (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 md:p-16 shadow-2xl border border-gray-100 mb-20">
              <div className="prose prose-lg prose-slate max-w-none text-gray-800">
                <div dangerouslySetInnerHTML={{ __html: marked(output) }} />
              </div>
            </div>
          )}

          {/* Affiliate Cards - Unchanged */}
          {tool["Affiliate Cards"] && (
            <div className="mt-20 pb-20">
              <h2 className="text-3xl font-black text-center mb-12 text-gray-900">
                Some of The Most Popular Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
                {JSON.parse(tool["Affiliate Cards"] || "[]").map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="nofollow sponsored"
                    className="group block bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="h-80 bg-gray-50 flex items-center justify-center p-10">
                      <img
                        src={item.image || "https://via.placeholder.com/500x500.png?text=No+Image"}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain rounded-xl"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-8 text-center">
                      <p className="font-bold text-xl text-gray-900 leading-tight line-clamp-3 mb-4">
                        {item.name}
                      </p>
                      <p className="text-4xl font-black text-green-600 mb-6">
                        {item.price}
                      </p>
                      <span className="inline-block px-12 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xl rounded-full hover:from-orange-600 hover:to-red-700 transition-all">
                        View on Amazon →
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
