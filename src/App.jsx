import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Dog, 
  Activity, 
  Utensils, 
  Scale, 
  Info, 
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  ArrowRight,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Drumstick,
  Wheat,
  Droplet,
  Bone,
  Flame,
  Save
} from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * 專業犬隻營養需求與鮮食配方計算機 (v2.3 Persistence Edition)
 * ------------------------------------------------------------------
 * * Update Log:
 * 1. LocalStorage Integration: Saves user inputs automatically.
 * 2. State Initialization: Loads saved data on startup.
 * 3. Lifecycle Optimization: Prevents overriding saved custom DER on mount.
 */

const STORAGE_KEY = 'dog_nutrition_data_v1';

// Helper to safely parse local storage
const getStoredData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Error reading localStorage:', error);
    return null;
  }
};

const App = () => {
  // Load stored data once
  const storedData = getStoredData();

  // --- 1. 生理數據 State (With persistence fallback) ---
  const [weight, setWeight] = useState(storedData?.weight ?? 10.00); 
  const [lifeStage, setLifeStage] = useState(storedData?.lifeStage ?? 'neutered_adult'); 
  const [customDerMultiplier, setCustomDerMultiplier] = useState(storedData?.customDerMultiplier ?? 1.60); 
  
  // --- 2. 飼料資訊 State (With persistence fallback) ---
  const [dietEm, setDietEm] = useState(storedData?.dietEm ?? 3800); 
  const [actualFeed, setActualFeed] = useState(storedData?.actualFeed ?? ''); 

  // --- 3. 鮮食重量比例 State (With persistence fallback) ---
  const [ratios, setRatios] = useState(storedData?.ratios ?? {
    meat: 36,     
    grain: 25,    
    veg: 25,      
    organ: 8,     
    calcium: 5,   
    oil: 1        
  });

  const [showDetails, setShowDetails] = useState(false);
  
  // Ref to track first mount to prevent effect conflict
  const isFirstMount = useRef(true);

  // --- Configuration: Ratios Metadata ---
  const ratioConfig = {
    meat: { label: '肉類 (Meat)', icon: <Drumstick size={18} />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', accent: 'accent-red-500', suggest: '30-50%' },
    grain: { label: '五穀根莖 (Grains)', icon: <Wheat size={18} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', accent: 'accent-amber-500', suggest: '20-40%' },
    veg: { label: '蔬果 (Veg/Fruit)', icon: <Leaf size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'accent-emerald-500', suggest: '20-30%' },
    organ: { label: '內臟 (Organs)', icon: <HeartPulse size={18} />, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100', accent: 'accent-rose-500', suggest: '5-10%' },
    calcium: { label: '鈣質補充 (Calcium)', icon: <Bone size={18} />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'accent-slate-500', suggest: '1-5%' },
    oil: { label: '優質油脂 (Oils)', icon: <Droplet size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', accent: 'accent-yellow-500', suggest: '0-5%' },
  };

  // --- DER 因子資料庫 ---
  const derData = {
    puppy_intact: { label: '幼犬 (未結紮前)', min: 1.6, max: 3.0, default: 2.0, desc: '生長發育期 (4個月以下建議 3.0)' },
    adult_intact: { label: '成犬 (未結紮)', min: 1.6, max: 1.8, default: 1.6, desc: '代謝率正常之未絕育犬隻' },
    neutered_adult: { label: '成犬 (已結紮)', min: 1.4, max: 1.6, default: 1.4, desc: '絕育後代謝降低，需注意體重' },
    senior: { label: '高齡犬 (Senior)', min: 1.1, max: 1.4, default: 1.2, desc: '活動力下降，代謝減緩' },
    inactive_obese: { label: '不活躍 / 肥胖傾向', min: 1.0, max: 1.2, default: 1.0, desc: '請以「理想體重」計算' },
    weight_gain: { label: '過瘦 / 需增重', min: 1.2, max: 1.8, default: 1.4, desc: '恢復期營養補充' },
    pregnant: { label: '懷孕母犬 (中後期)', min: 1.6, max: 2.0, default: 1.8, desc: '懷孕最後 1/3 階段' },
    lactating: { label: '哺乳母犬', min: 2.0, max: 4.0, default: 3.0, desc: '依哺乳數量調整 (無上限)' }
  };

  // --- 食材熱量密度 (Kcal/g) ---
  const CALORIC_DENSITY = {
    meat: 1.5, grain: 1.1, veg: 0.35, organ: 1.5, calcium: 0.5, oil: 9.0
  };

  // --- Effects ---

  // 1. Persistence Effect: Auto-save when state changes
  useEffect(() => {
    const dataToSave = {
      weight,
      lifeStage,
      customDerMultiplier,
      dietEm,
      actualFeed,
      ratios
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [weight, lifeStage, customDerMultiplier, dietEm, actualFeed, ratios]);

  // 2. Logic Effect: Reset multiplier when Life Stage changes
  // Modified to skip the first run to avoid overwriting loaded customDerMultiplier
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return; 
    }
    const data = derData[lifeStage];
    if (data) {
      setCustomDerMultiplier(data.default);
    }
  }, [lifeStage]);

  // --- Calculation Logic ---
  const results = useMemo(() => {
    const rer = 70 * Math.pow(weight, 0.75);
    const der = rer * customDerMultiplier;
    const recommendedFeedAmount = (der / dietEm) * 1000;
    
    const actualFeedNum = actualFeed === '' ? 0 : parseFloat(actualFeed);
    const actualKcal = (actualFeedNum * dietEm) / 1000;
    
    const gap = der - actualKcal;
    const isSurplus = gap < -10;
    const isDeficit = gap > 10;
    
    let freshFoodRecipe = {};
    let mixTotalWeight = 0;
    let mixCaloricContribution = 0;
    
    const totalRatio = Object.values(ratios).reduce((a, b) => a + b, 0);

    if (isDeficit) {
      let weightedDensitySum = 0;
      Object.keys(ratios).forEach(key => {
        weightedDensitySum += (ratios[key] / 100) * CALORIC_DENSITY[key];
      });
      const compositeDensity = weightedDensitySum || 1;
      
      mixTotalWeight = gap / compositeDensity;
      mixCaloricContribution = mixTotalWeight * compositeDensity;

      freshFoodRecipe = {
        meat: mixTotalWeight * (ratios.meat / 100),
        grain: mixTotalWeight * (ratios.grain / 100),
        veg: mixTotalWeight * (ratios.veg / 100),
        organ: mixTotalWeight * (ratios.organ / 100),
        calcium: mixTotalWeight * (ratios.calcium / 100),
        oil: mixTotalWeight * (ratios.oil / 100),
      };
    }

    return {
      rer, der, recommendedFeedAmount, actualKcal, gap, isSurplus, isDeficit,
      mixTotalWeight, mixCaloricContribution, freshFoodRecipe, totalRatio,
      currentStageData: derData[lifeStage]
    };
  }, [weight, customDerMultiplier, dietEm, actualFeed, ratios, lifeStage]);

  // Handlers
  const handleRatioChange = (key, value) => {
    const intVal = parseInt(value, 10);
    setRatios(prev => ({ ...prev, [key]: isNaN(intVal) ? 0 : intVal }));
  };

  const handleFloatInput = (setter) => (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setter(val);
    else setter(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Dog size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">鮮食配方建議參考 <span className="text-slate-400 font-normal text-xs ml-1">20260112</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
             <Save size={12} className="text-indigo-400" />
             Auto-saved
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Card 1: Dog Profile */}
        <section className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
            <Settings className="text-indigo-500" size={18} />
            <h2 className="font-bold text-slate-800">基本參數設定</h2>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Weight Input Group */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-slate-700">犬隻體重 (Kg)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={weight} 
                    onChange={handleFloatInput(setWeight)}
                    className="w-24 text-right p-1.5 text-lg font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                  <span className="text-sm text-slate-400">kg</span>
                </div>
              </div>
              <input 
                type="range" min="1" max="60" step="0.01" 
                value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all"
              />
            </div>

            {/* Life Stage & DER Group */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">生理階段 (Life Stage)</label>
                <div className="relative">
                  <select 
                    value={lifeStage} 
                    onChange={(e) => setLifeStage(e.target.value)}
                    className="w-full p-3 pr-10 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl appearance-none focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm transition-all"
                  >
                    {Object.entries(derData).map(([key, data]) => (
                      <option key={key} value={key}>{data.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                </div>
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-400"/>
                  {results.currentStageData.desc}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex justify-between items-center mb-3">
                   <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Activity size={16} className="text-orange-500"/> 
                    DER 係數 (Multiplier)
                   </label>
                   <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.01"
                      min="1.0" max="5.0"
                      value={customDerMultiplier} 
                      onChange={handleFloatInput(setCustomDerMultiplier)}
                      className="w-20 text-right p-1.5 text-base font-bold text-orange-600 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                   </div>
                </div>
                <input 
                  type="range" 
                  min="1.0" max="4.0" step="0.01" 
                  value={customDerMultiplier} 
                  onChange={(e) => setCustomDerMultiplier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-600 transition-all"
                />
                 <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1.5 px-1">
                  <span>Min: {results.currentStageData.min}</span>
                  <span className="text-orange-400/80">建議調整範圍</span>
                  <span>Max: {results.currentStageData.max}</span>
                </div>
              </div>
            </div>

            {/* Total DER Display */}
            <div className="flex justify-between items-center bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-200">
              <span className="text-sm font-medium opacity-90">每日總熱量需求 (Target DER)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight">{Math.round(results.der)}</span>
                <span className="text-sm opacity-80">kcal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Feed Intake */}
        <section className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
            <Utensils className="text-emerald-500" size={18} />
            <h2 className="font-bold text-slate-800">目前飲食狀況</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">飼料代謝能 (ME)</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={dietEm}
                  onChange={(e) => setDietEm(parseFloat(e.target.value))}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all font-medium"
                />
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors"><Scale size={18}/></div>
                <span className="absolute right-3 top-3.5 text-xs text-slate-400">kcal/kg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">實際餵食量</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={actualFeed}
                  placeholder="0"
                  onChange={(e) => setActualFeed(e.target.value)}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all font-bold text-slate-800"
                />
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors"><Beaker size={18}/></div>
                <span className="absolute right-3 top-3.5 text-xs text-slate-400">g/day</span>
              </div>
            </div>
          </div>

          {/* Calorie Gap Indicator */}
          {actualFeed !== '' && (
            <div className={`mx-6 mb-6 p-4 rounded-xl flex items-center justify-between transition-colors ${results.isSurplus ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${results.isSurplus ? 'bg-white/60 text-red-500' : 'bg-white/60 text-blue-500'}`}>
                   {results.isSurplus ? <AlertTriangle size={20}/> : <ArrowRight size={20}/>}
                 </div>
                 <div>
                   <p className="text-xs font-bold opacity-80 uppercase tracking-wider">{results.isSurplus ? '熱量超標' : '熱量缺口'}</p>
                   <p className="text-sm font-medium">{results.isSurplus ? '需減少攝取' : '可透過鮮食補足'}</p>
                 </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black tracking-tight">{Math.abs(Math.round(results.gap))}</span>
                <span className="text-xs font-bold opacity-70 ml-1">kcal</span>
              </div>
            </div>
          )}
        </section>

        {/* Card 3: Recipe Generator (Only if deficit) */}
        {results.isDeficit && actualFeed !== '' && (
          <section className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="text-emerald-500" size={18} />
                <h2 className="font-bold text-slate-800">鮮食配方調配</h2>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${results.totalRatio === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                總比例: {results.totalRatio}%
              </span>
            </div>

            <div className="p-6">
              
              {/* Recipe Sliders (Vertical List) */}
              <div className="space-y-4 mb-8">
                {Object.entries(ratios).map(([key, val]) => {
                  const config = ratioConfig[key];
                  return (
                    <div key={key} className={`p-4 rounded-xl border ${config.border} ${config.bg} flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-sm`}>
                      {/* Icon & Label */}
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div className={`p-2 rounded-lg bg-white ${config.color} shadow-sm`}>
                          {config.icon}
                        </div>
                        <div>
                           <label className={`block text-sm font-bold ${config.color}`}>{config.label}</label>
                           <span className="text-[10px] text-slate-500 font-medium bg-white/50 px-1.5 py-0.5 rounded">建議: {config.suggest}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex-1 flex items-center gap-4">
                        <input 
                          type="range" min="0" max="100" step="1"
                          value={val}
                          onChange={(e) => handleRatioChange(key, e.target.value)}
                          className={`w-full h-2 bg-white rounded-lg appearance-none cursor-pointer ${config.accent}`}
                        />
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" max="100" step="1"
                            value={val}
                            onChange={(e) => handleRatioChange(key, e.target.value)}
                            className="w-16 text-center p-2 rounded-lg border-2 border-white shadow-sm focus:ring-2 focus:ring-slate-200 outline-none font-bold text-slate-700"
                          />
                          <span className="absolute right-1 top-2 text-[10px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Dashboard */}
              <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  
                  {/* Left: Weight */}
                  <div className="text-center md:text-left">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">建議添加鮮食總重</p>
                    <div className="flex items-baseline justify-center md:justify-start gap-2">
                      <span className="text-4xl font-black text-emerald-400">{Math.round(results.mixTotalWeight)}</span>
                      <span className="text-lg font-medium text-slate-400">g</span>
                    </div>
                  </div>

                  {/* Middle: Divider */}
                  <div className="hidden md:block w-px h-12 bg-slate-600"></div>

                  {/* Right: Caloric Contribution */}
                  <div className="flex-1 w-full md:w-auto bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-slate-300 flex items-center gap-1.5">
                         <Calculator size={14}/> 熱量貢獻 (Caloric Contribution)
                       </span>
                       <span className="text-xs font-bold text-emerald-400">{Math.round(results.mixCaloricContribution)} kcal</span>
                     </div>
                     <div className="w-full bg-slate-600 rounded-full h-1.5 mb-2 overflow-hidden">
                       <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
                     </div>
                     <div className="flex justify-between items-center text-[10px]">
                       <span className="text-slate-400">熱量缺口 (需補足)</span>
                       <span className="text-white font-medium">{Math.round(results.gap)} kcal</span>
                     </div>
                  </div>

                </div>

                {/* Recipe Breakdown Table - Modified to Vertical List with Kcal */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">
                    配方明細與熱量分析 (Ingredient Breakdown & Analysis)
                  </p>
                  
                  <div className="space-y-2">
                    {Object.entries(results.freshFoodRecipe).map(([key, weight], index) => {
                      // Skip displaying if weight is effectively 0
                      if (Math.round(weight) === 0 && weight < 0.1) return null;
                      
                      const kcal = weight * CALORIC_DENSITY[key];
                      const config = ratioConfig[key];

                      return (
                        <div key={key} className="bg-slate-700/30 rounded-lg p-3 flex items-center justify-between border border-slate-600/50 hover:bg-slate-700/50 transition-colors group">
                           {/* Left: Index & Name */}
                           <div className="flex items-center gap-3">
                              <span className="bg-slate-600/50 text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono border border-slate-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-all">
                                {index + 1}
                              </span>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                   {config.label}
                                 </span>
                                 <span className="text-[10px] text-slate-500 font-medium">
                                   Est. Density: {CALORIC_DENSITY[key]} kcal/g
                                 </span>
                              </div>
                           </div>

                           {/* Right: Weight & Kcal */}
                           <div className="text-right">
                              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                                {Math.round(weight)}g
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                                <Flame size={10} className="text-orange-400"/>
                                {Math.round(kcal)} kcal
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          </section>
        )}

        {/* Footer Info */}
        <div className="text-center py-6">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
          >
            {showDetails ? <ChevronUp size={14}/> : <Info size={14}/>}
            {showDetails ? '隱藏營養計算參數' : '查看營養計算參數'}
          </button>

          {showDetails && (
             <div className="mt-4 max-w-lg mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left animate-fade-in-up">
               <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider border-b border-slate-100 pb-2">Technical Data</h4>
               <ul className="space-y-1.5 text-xs font-mono text-slate-500">
                 <li className="flex justify-between"><span>RER:</span> <span>{results.rer.toFixed(2)} kcal</span></li>
                 <li className="flex justify-between"><span>DER:</span> <span>{results.der.toFixed(2)} kcal</span></li>
                 <li className="flex justify-between"><span>Dry Food Kcal:</span> <span>{results.actualKcal.toFixed(2)} kcal</span></li>
                 <li className="flex justify-between text-indigo-600 font-bold"><span>Target Deficit:</span> <span>{results.gap.toFixed(2)} kcal</span></li>
               </ul>
             </div>
          )}
          <p className="mt-4 text-[10px] text-slate-400">
            非專業獸醫營養工具，改變飲食習慣前請諮詢獸醫。
          </p>
        </div>

      </main>
    </div>
  );
};

export default App;