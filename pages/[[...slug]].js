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

      <div class
