import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import {
  Sparkles,
  Camera,
  Image as ImageIcon,
  Download,
  Check,
  RefreshCw,
  Wand2,
  Sliders,
  Copy,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface GeminiStudioProps {
  products: Product[];
  initialProductId?: string;
  onUpdateProductImage: (productId: string, imageUrl: string) => void;
}

const PRESET_PROMPTS = [
  {
    label: 'হোয়াইট স্টুডিও (Clean White Studio)',
    prompt:
      'Professional ecommerce product photography on a clean seamless pure white studio backdrop, soft diffused studio light, subtle realistic contact shadow, 8k resolution, crisp commercial catalog look.',
  },
  {
    label: 'কাঠের টেবিল (Warm Wooden Table)',
    prompt:
      'A warm rustic wooden kitchen tabletop, soft natural morning sunlight streaming from the window, cozy ambient shadows, commercial lifestyle product photography.',
  },
  {
    label: 'মার্বেল কাউন্টার (Marble Counter)',
    prompt:
      'Set on a polished white Carrara marble kitchen countertop, soft golden hour lighting, clean aesthetic, high-end culinary and grocery advertising photography.',
  },
  {
    label: 'ঈদ উৎসব স্পেশাল (Festive Eid Special)',
    prompt:
      'Festive Bangladeshi celebration backdrop with warm hanging fairy lights, brass lanterns, crescent moon motifs, elegant decorative flowers and silk cloth, luxury promotional staging.',
  },
  {
    label: 'বাঙালি বাজার (Bengali Marketplace)',
    prompt:
      'Displayed in a traditional clean Bengali grocery shop market stall with woven jute sacks of rice and grains in the background, warm natural lighting, authentic local feel.',
  },
  {
    label: 'মডার্ন মিনিমালিস্ট (Modern Minimalist)',
    prompt:
      'Modern minimalist studio staging with pastel geometric pedestals, soft directional rim lighting, clean negative space, premium packaging presentation.',
  },
];

export const GeminiStudio: React.FC<GeminiStudioProps> = ({
  products,
  initialProductId,
  onUpdateProductImage,
}) => {
  const [activeMode, setActiveMode] = useState<'gemini' | 'canvas'>('gemini');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');

  // Gemini Generator & Editor State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [uploadedReference, setUploadedReference] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [marketingCopy, setMarketingCopy] = useState<string>('');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Canvas Studio State
  const [canvasScene, setCanvasScene] = useState<string>('white');
  const [canvasColor, setCanvasColor] = useState<string>('#dfe7f2');
  const [canvasShape, setCanvasShape] = useState<string>('1');
  const [canvasZoom, setCanvasZoom] = useState<number>(68);
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [edgeSensitivity, setEdgeSensitivity] = useState<number>(38);
  const [softShadow, setSoftShadow] = useState<boolean>(true);
  const [reflection, setReflection] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cutCanvas, setCutCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rawImageCanvas, setRawImageCanvas] = useState<HTMLCanvasElement | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // If initialProductId changes from props, update
  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  // When selected product changes, load its image as reference if available
  useEffect(() => {
    if (selectedProduct?.img) {
      setUploadedReference(selectedProduct.img);
      loadCanvasImage(selectedProduct.img);
    }
  }, [selectedProductId]);

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedReference(result);
      loadCanvasImage(result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Gemini Image Generator / Editor API Call using gemini-nano-banana-2.1
   */
  const handleGenerateGemini = async () => {
    if (!prompt.trim()) {
      setErrorText('অনুগ্রহ করে প্রম্পট বা দৃশ্য বর্ণনা লিখুন।');
      return;
    }

    setIsGenerating(true);
    setErrorText('');
    setStatusMessage('জেমিনি ন্যানো ব্যানানা ২.১ ছবি তৈরি করছে (১০-২৫ সেকেন্ড সময় লাগতে পারে)...');

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          imageSize,
          image: uploadedReference || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ছবি জেনারেট করা সম্ভব হয়নি।');
      }

      setGeneratedImage(data.image);
      setStatusMessage('ছবি সফলভাবে তৈরি হয়েছে!');
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'নেটওয়ার্ক বা সার্ভার সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate Social Media / Marketing Copy with gemini-3.8-flash
   */
  const handleGenerateCopy = async () => {
    if (!selectedProduct && !prompt) return;
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedProduct?.name || prompt.slice(0, 40),
          category: selectedProduct?.cat || 'সাধারণ',
          buy: selectedProduct?.buy || 0,
          sell: selectedProduct?.sell || 0,
          ws: selectedProduct?.ws || 0,
        }),
      });
      const data = await res.json();
      if (data.description) {
        setMarketingCopy(data.description);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  /**
   * AI Photography advice for Canvas studio
   */
  const handleGetAiAdvice = async () => {
    if (!uploadedReference && !selectedProduct?.img) {
      alert('প্রথমে পণ্যের ছবি সিলেক্ট বা আপলোড করুন।');
      return;
    }

    setIsLoadingAdvice(true);
    try {
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedProduct?.name || 'মুদি পণ্য',
          category: selectedProduct?.cat || 'মুদি',
          image: uploadedReference,
        }),
      });
      const data = await res.json();
      setAiAdvice(data);
      if (data.scene) {
        setCanvasScene(data.scene);
      }
      if (data.color) {
        setCanvasColor(data.color);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  /**
   * Canvas Image Loading & Edge-cut Algorithm
   */
  const loadCanvasImage = (srcUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, c.width, c.height);
        setRawImageCanvas(c);
        processCut(c, removeBg, edgeSensitivity);
      }
    };
    img.src = srcUrl;
  };

  const processCut = (sourceCanvas: HTMLCanvasElement, shouldRemoveBg: boolean, tol: number) => {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    if (shouldRemoveBg) {
      // Calculate background border average color
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      const sample = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
        count++;
      };

      for (let x = 0; x < w; x++) {
        sample(x, 0);
        sample(x, h - 1);
      }
      for (let y = 1; y < h - 1; y++) {
        sample(0, y);
        sample(w - 1, y);
      }

      r /= count;
      g /= count;
      b /= count;

      const bg = new Uint8Array(w * h);
      const stack = new Int32Array(w * h);
      let sp = 0;

      const push = (i: number) => {
        if (bg[i]) return;
        const j = i * 4;
        const dr = d[j] - r;
        const dg = d[j + 1] - g;
        const db = d[j + 2] - b;
        if (dr * dr + dg * dg + db * db <= tol * tol * 3) {
          bg[i] = 1;
          stack[sp++] = i;
        }
      };

      for (let x = 0; x < w; x++) {
        push(x);
        push((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        push(y * w);
        push(y * w + w - 1);
      }

      while (sp > 0) {
        const i = stack[--sp];
        const x = i % w;
        if (x > 0) push(i - 1);
        if (x < w - 1) push(i + 1);
        if (i >= w) push(i - w);
        if (i < w * h - w) push(i + w);
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bg[y * w + x]) {
            d[(y * w + x) * 4 + 3] = 0;
          }
        }
      }
    }

    // Crop bounding box of product
    let minX = w,
      minY = h,
      maxX = -1,
      maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) {
      setCutCanvas(sourceCanvas);
      return;
    }

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = maxX - minX + 1;
    trimmedCanvas.height = maxY - minY + 1;
    const tCtx = trimmedCanvas.getContext('2d');
    if (tCtx) {
      const tempC = document.createElement('canvas');
      tempC.width = w;
      tempC.height = h;
      tempC.getContext('2d')?.putImageData(imgData, 0, 0);
      tCtx.drawImage(
        tempC,
        minX,
        minY,
        trimmedCanvas.width,
        trimmedCanvas.height,
        0,
        0,
        trimmedCanvas.width,
        trimmedCanvas.height
      );
      setCutCanvas(trimmedCanvas);
    }
  };

  // Draw scene onto canvas
  useEffect(() => {
    if (!cutCanvas || !canvasRef.current) return;
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const ratio = parseFloat(canvasShape) || 1;
    const W = ratio >= 1 ? 1600 : Math.round(1600 * ratio);
    const H = ratio >= 1 ? Math.round(1600 / ratio) : 1600;

    cv.width = W;
    cv.height = H;

    const horizon = H * 0.65;
    const baseY = horizon + H * 0.08;

    // Draw background scene
    if (canvasScene === 'white') {
      const grad = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, W * 0.85);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#dfe5ec');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (canvasScene === 'gray') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#eceff3');
      grad.addColorStop(1, '#adb7c2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (canvasScene === 'wood') {
      // Wall
      const wallGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      wallGrad.addColorStop(0, '#f2ece4');
      wallGrad.addColorStop(1, '#dfd6c8');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, horizon);

      // Wood table
      const woodGrad = ctx.createLinearGradient(0, horizon, 0, H);
      woodGrad.addColorStop(0, '#c79766');
      woodGrad.addColorStop(1, '#82542a');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, horizon, W, H - horizon);

      // Planks texture
      ctx.strokeStyle = 'rgba(60, 30, 10, 0.15)';
      ctx.lineWidth = 2;
      for (let y = horizon + 30; y < H; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    } else if (canvasScene === 'marble') {
      const wallGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      wallGrad.addColorStop(0, '#f0f2f5');
      wallGrad.addColorStop(1, '#dce0e5');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, horizon);

      const tableGrad = ctx.createLinearGradient(0, horizon, 0, H);
      tableGrad.addColorStop(0, '#ffffff');
      tableGrad.addColorStop(1, '#eceef1');
      ctx.fillStyle = tableGrad;
      ctx.fillRect(0, horizon, W, H - horizon);

      // Veins
      ctx.strokeStyle = 'rgba(120, 130, 145, 0.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo((i * W) / 5, horizon);
        ctx.bezierCurveTo(
          (i * W) / 5 + 60,
          horizon + 60,
          (i * W) / 5 - 40,
          horizon + 140,
          (i * W) / 5 + 80,
          H
        );
        ctx.stroke();
      }
    } else if (canvasScene === 'dark') {
      ctx.fillStyle = '#0f141a';
      ctx.fillRect(0, 0, W, H);
      const spot = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.75);
      spot.addColorStop(0, 'rgba(55, 70, 90, 0.6)');
      spot.addColorStop(1, 'rgba(15, 20, 26, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Custom color
      ctx.fillStyle = canvasColor;
      ctx.fillRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(255,255,255,0.25)');
      grad.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Product positioning
    const z = canvasZoom / 100;
    const scale = Math.min((W * z) / cutCanvas.width, ((H * z) / cutCanvas.height) * 0.85);
    const pw = cutCanvas.width * scale;
    const ph = cutCanvas.height * scale;
    const px = (W - pw) / 2;
    const py = Math.max(H * 0.05, baseY - ph);

    // Soft Shadow
    if (softShadow) {
      const rx = pw * 0.52;
      const ry = Math.max(12, pw * 0.07);
      ctx.save();
      ctx.translate(W / 2, baseY);
      ctx.scale(1, ry / rx);
      const sGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      sGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Glossy Reflection
    if (reflection) {
      const refC = document.createElement('canvas');
      refC.width = Math.round(pw);
      refC.height = Math.round(ph);
      const rCtx = refC.getContext('2d');
      if (rCtx) {
        rCtx.translate(0, refC.height);
        rCtx.scale(1, -1);
        rCtx.drawImage(cutCanvas, 0, 0, refC.width, refC.height);
        rCtx.setTransform(1, 0, 0, 1, 0, 0);

        rCtx.globalCompositeOperation = 'destination-in';
        const mask = rCtx.createLinearGradient(0, 0, 0, refC.height * 0.5);
        mask.addColorStop(0, 'rgba(0,0,0,0.3)');
        mask.addColorStop(1, 'rgba(0,0,0,0)');
        rCtx.fillStyle = mask;
        rCtx.fillRect(0, 0, refC.width, refC.height);

        ctx.drawImage(refC, px, baseY);
      }
    }

    // Draw main product image
    ctx.drawImage(cutCanvas, px, py, pw, ph);
  }, [cutCanvas, canvasScene, canvasColor, canvasShape, canvasZoom, softShadow, reflection]);

  const handleDownloadCanvas = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-studio-${selectedProduct ? selectedProduct.name : 'photo'}.png`;
    a.click();
  };

  const handleUseCanvasAsProduct = () => {
    if (!canvasRef.current || !selectedProductId) return;
    const url = canvasRef.current.toDataURL('image/jpeg', 0.85);
    onUpdateProductImage(selectedProductId, url);
    alert('ছবিটি পণ্যের প্রধান ছবি হিসেবে সেট করা হয়েছে!');
  };

  const handleUseGeminiAsProduct = () => {
    if (!generatedImage || !selectedProductId) return;
    onUpdateProductImage(selectedProductId, generatedImage);
    alert('জেমিনি ছবি পণ্যের প্রধান ছবি হিসেবে সংরক্ষণ করা হয়েছে!');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              জেমিনি AI প্রডাক্ট ফটো স্টুডিও{' '}
              <span className="text-amber-600 font-semibold text-xs px-2 py-0.5 bg-amber-50 rounded-full">
                Powered by gemini-nano-banana-2.1
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            টেক্সট প্রম্পটের মাধ্যমে নতুন পণ্যের ছবি তৈরি করুন, ব্যাকগ্রাউন্ড পরিবর্তন করুন বা লাইফস্টাইল ফটোশুট স্টেজ তৈরি করুন।
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMode('gemini')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'gemini'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>জেমিনি AI ছবি মেকার</span>
          </button>
          <button
            onClick={() => setActiveMode('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'canvas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>ক্যানভাস স্টুডিও (Backdrops)</span>
          </button>
        </div>
      </div>

      {/* Target Product Selection Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <label className="text-xs font-bold text-slate-700 shrink-0">
          দোকানের পণ্য নির্বাচন করুন:
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="">-- কোনো পণ্য ছাড়া নতুন ছবি বানান --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.cat || 'সাধারণ'})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>রেফারেন্স ছবি আপলোড</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
            />
          </label>
          {uploadedReference && (
            <button
              onClick={() => {
                setUploadedReference('');
                setRawImageCanvas(null);
                setCutCanvas(null);
              }}
              className="text-xs text-rose-600 hover:underline px-1"
            >
              সরান
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: GEMINI NANO BANANA 2.1 GENERATOR & EDITOR */}
      {activeMode === 'gemini' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Controls */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                ছবি বর্ণনা ও স্টাইল (Prompt & Settings)
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                gemini-nano-banana-2.1
              </span>
            </div>

            {/* Reference Image preview */}
            {uploadedReference && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <img
                  src={uploadedReference}
                  alt="Reference"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-300"
                />
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-slate-800">রেফারেন্স প্রডাক্ট ছবি যুক্ত আছে</div>
                  <div className="text-slate-500 text-[11px]">
                    মডেল এই পণ্যের অবয়ব রেখে নির্দেশিত ব্যাকগ্রাউন্ড ও সিনারি তৈরি করবে।
                  </div>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                রেডিমেড সিনারি প্রিসেট (Click to Apply):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map((pr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const prefix = selectedProduct ? `${selectedProduct.name}, ` : '';
                      setPrompt(prefix + pr.prompt);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer text-left"
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ছবি তৈরির বিস্তারিত বর্ণনা (Prompt in English or বাংলা) *
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="যেমন: A 5L soybean oil bottle displayed on a polished wooden counter with golden wheat stalks, soft sunlight, highly detailed commercial grocery photo..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Config: Aspect Ratio & Size */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ছবির অনুপাত (Shape)</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="1:1">বর্গাকার স্কয়ার (1:1 Square)</option>
                  <option value="4:5">প্রোডাক্ট পোর্ট্রেট (4:5 / 3:4)</option>
                  <option value="9:16">স্টোরি / রিলস (9:16 Story)</option>
                  <option value="16:9">ওয়াইড ল্যান্ডস্কেপ (16:9 Wide)</option>
                  <option value="4:1">শপ ব্যানার (4:1 Banner)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">রেজোলিউশন (Resolution)</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="1K">1K স্ট্যান্ডার্ড এইচডি (1K HD)</option>
                  <option value="2K">2K আল্ট্রা ক্লিয়ার (2K QHD)</option>
                  <option value="4K">4K স্টুডিও মাস্টার (4K UHD)</option>
                </select>
              </div>
            </div>

            {errorText && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorText}
              </div>
            )}

            {statusMessage && !errorText && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            <button
              disabled={isGenerating || !prompt.trim()}
              onClick={handleGenerateGemini}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'ছবি জেনারেট হচ্ছে (দয়া করে অপেক্ষা করুন)...'
                  : 'জেমিনি AI ছবি তৈরি করুন'}
              </span>
            </button>
          </div>

          {/* Right Preview & Results */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-900 text-sm">তৈরিকৃত ছবির ফলাফল (AI Result)</h3>
                {generatedImage && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> রেডি
                  </span>
                )}
              </div>

              {/* Main Image Frame */}
              <div className="w-full min-h-[380px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {isGenerating ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="font-bold text-sm text-slate-800">
                      জেমিনি আপনার ছবির আলো, শ্যাডো ও ব্যাকগ্রাউন্ড পেইন্ট করছে...
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm">
                      উচ্চমানের রেজোলিউশন তৈরি হতে ১৫-২৫ সেকেন্ড সময় লাগে।
                    </p>
                  </div>
                ) : generatedImage ? (
                  <div className="relative group max-h-[500px] w-full flex items-center justify-center">
                    <img
                      src={generatedImage}
                      alt="AI Generated Product"
                      className="max-h-[480px] max-w-full rounded-xl object-contain shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-16 space-y-2">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-300" />
                    <div className="font-semibold text-sm text-slate-600">
                      কোনো ছবি এখনো জেনারেট করা হয়নি
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      বামে প্রম্পট লিখে "জেমিনি AI ছবি তৈরি করুন" চাপুন।
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Generated Image */}
              {generatedImage && (
                <div className="flex flex-wrap gap-2.5 mt-4">
                  <a
                    href={generatedImage}
                    download={`gemini-${selectedProduct ? selectedProduct.name : 'product'}.png`}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> ডাউনলোড PNG
                  </a>

                  {selectedProductId && (
                    <button
                      onClick={handleUseGeminiAsProduct}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> এই পণ্যের প্রোফাইল ছবি করুন
                    </button>
                  )}

                  <button
                    onClick={handleGenerateCopy}
                    disabled={isGeneratingCopy}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {isGeneratingCopy ? 'লেখা তৈরি হচ্ছে...' : 'সোশ্যাল মিডিয়া ক্যাপশন লিখুন'}
                    </span>
                  </button>
                </div>
              )}

              {/* Marketing Copy Box */}
              {marketingCopy && (
                <div className="mt-4 p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-amber-900">
                    <span>✨ ফেসবুক/হোয়াটসঅ্যাপ বিজ্ঞাপনের পোস্ট কপি:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(marketingCopy);
                        setCopiedNotice(true);
                        setTimeout(() => setCopiedNotice(false), 2000);
                      }}
                      className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedNotice ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-slate-800 text-xs font-normal bg-white p-3 rounded-lg border border-amber-100">
                    {marketingCopy}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: INTERACTIVE CANVAS STUDIO */}
      {activeMode === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">স্টুডিও ব্যাকড্রপ ও লাইটিং</h3>
              <button
                onClick={handleGetAiAdvice}
                disabled={isLoadingAdvice}
                className="px-2.5 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{isLoadingAdvice ? 'AI ভাবছে...' : '✨ AI সিন টিপ'}</span>
              </button>
            </div>

            {aiAdvice && (
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>AI পরামর্শ:</span>
                  <span className="font-semibold text-slate-700">{aiAdvice.reason}</span>
                </div>
                <div className="text-slate-600">
                  ক্যাপশন: <b>{aiAdvice.caption_bn}</b>
                </div>
                {aiAdvice.tips && <div className="text-[11px] text-slate-500">টিপ: {aiAdvice.tips}</div>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ব্যাকড্রপ সিন (Scene)</label>
                <select
                  value={canvasScene}
                  onChange={(e) => setCanvasScene(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value="white">সাদা স্টুডিও (Clean White)</option>
                  <option value="gray">সফট গ্রে গ্রেডিয়েন্ট (Soft Gray)</option>
                  <option value="wood">উষ্ণ কাঠের টেবিল (Wooden Table)</option>
                  <option value="marble">সাদা মার্বেল কাউন্টার (Marble)</option>
                  <option value="dark">ডার্ক প্রিমিয়াম স্পটলাইট (Dark Luxury)</option>
                  <option value="color">কাস্টম কালার (Custom Color)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">কাস্টম ব্যাকগ্রাউন্ড রং</label>
                <input
                  type="color"
                  value={canvasColor}
                  onChange={(e) => {
                    setCanvasColor(e.target.value);
                    setCanvasScene('color');
                  }}
                  className="w-full h-9 p-0.5 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ছবির অনুপাত (Shape)</label>
                <select
                  value={canvasShape}
                  onChange={(e) => setCanvasShape(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value="1">বর্গাকার (Square 1:1)</option>
                  <option value="0.8">পোর্ট্রেট (Portrait 4:5)</option>
                  <option value="1.7778">ওয়াইড (Wide 16:9)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  পণ্যের সাইজ: {canvasZoom}%
                </label>
                <input
                  type="range"
                  min="40"
                  max="95"
                  value={canvasZoom}
                  onChange={(e) => setCanvasZoom(parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeBg}
                  onChange={(e) => {
                    setRemoveBg(e.target.checked);
                    if (rawImageCanvas) {
                      processCut(rawImageCanvas, e.target.checked, edgeSensitivity);
                    }
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">
                  পুরোনো ব্যাকগ্রাউন্ড স্বয়ংক্রিয়ভাবে রিমুভ করুন
                </span>
              </label>

              {removeBg && (
                <div className="pl-6 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>এজ সেনসিটিভিটি (Edge Sensitivity)</span>
                    <span>{edgeSensitivity}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={edgeSensitivity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setEdgeSensitivity(v);
                      if (rawImageCanvas) {
                        processCut(rawImageCanvas, removeBg, v);
                      }
                    }}
                    className="w-full mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={softShadow}
                    onChange={(e) => setSoftShadow(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700">বাস্তব ছায়া (Soft Shadow)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reflection}
                    onChange={(e) => setReflection(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700">কাচের রিফ্লেকশন</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={handleDownloadCanvas}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> ডাউনলোড PNG
              </button>
              {selectedProductId && (
                <button
                  onClick={handleUseCanvasAsProduct}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> পণ্য ছবিতে সেভ
                </button>
              )}
            </div>
          </div>

          {/* Canvas Rendering Preview */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center items-center">
            <div className="w-full flex items-center justify-center bg-slate-100 rounded-2xl p-4 min-h-[420px] overflow-hidden">
              {uploadedReference ? (
                <canvas
                  ref={canvasRef}
                  className="max-h-[440px] max-w-full rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center text-slate-400 py-16 space-y-2">
                  <Camera className="w-12 h-12 mx-auto text-slate-300" />
                  <div className="font-semibold text-sm text-slate-600">
                    কোনো পণ্যের ছবি সিলেক্ট বা আপলোড করা নেই
                  </div>
                  <p className="text-xs text-slate-400">
                    উপরে দোকান থেকে পণ্য সিলেক্ট করুন অথবা "রেফারেন্স ছবি আপলোড" বাটনে চাপুন।
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
