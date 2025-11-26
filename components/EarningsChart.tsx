"use client";

import { useEffect, useRef } from 'react';

interface EarningsChartProps {
  data: { month: string; earnings: number }[];
}

export default function EarningsChart({ data }: EarningsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find max value for scaling
    const maxEarnings = Math.max(...data.map(d => d.earnings), 1);
    const scale = chartHeight / maxEarnings;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Draw line chart
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pointSpacing = chartWidth / (data.length - 1 || 1);

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - (point.earnings * scale);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#10b981';
    data.forEach((point, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - (point.earnings * scale);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw month labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    data.forEach((point, index) => {
      const x = padding + index * pointSpacing;
      ctx.fillText(point.month, x, rect.height - 10);
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '120px' }}
    />
  );
}
