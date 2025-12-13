import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface Props {
  chart: string;
  id?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#8B5CF6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#A78BFA',
    lineColor: '#6B7280',
    secondaryColor: '#3B82F6',
    tertiaryColor: '#1F2937',
    background: '#111827',
    mainBkg: '#1F2937',
    nodeBorder: '#A78BFA',
    clusterBkg: '#1F2937',
    titleColor: '#F9FAFB',
    edgeLabelBackground: '#1F2937',
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
  },
});

export function MermaidChart({ chart, id = 'mermaid-chart' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        try {
          const { svg } = await mermaid.render(id, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
        }
      }
    };

    renderChart();
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto bg-gray-900/50 rounded-2xl p-6"
    />
  );
}
