
import React, { useState, useRef } from 'react';
import { analyzeItem } from '../services/geminiService';
import { Item, ItemCategory, ItemCondition, DeliveryMethod } from '../types';

interface SellItemProps {
  onSuccess: (newItem: Partial<Item>) => void;
  onCancel: () => void;
}

const SellItem: React.FC<SellItemProps> = ({ onSuccess, onCancel }) => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [donationPercent, setDonationPercent] = useState(50);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.DIRECT);
  const [originAddress, setOriginAddress] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.A,
    price: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const b64 = image.split(',')[1];
      const result = await analyzeItem(b64, description);
      
      setFormData({
        title: result.title || '',
        category: (result.category as ItemCategory) || ItemCategory.ELECTRONICS,
        condition: (result.condition as ItemCondition) || ItemCondition.A,
        price: result.suggestedPrice || 0
      });
    } catch (error) {
      console.error("AI 분석 실패", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !image) return;
    if (deliveryMethod === DeliveryMethod.DELIVERY && !originAddress.trim()) {
      alert("택배 배송 시 출발지 주소를 입력해주세요.");
      return;
    }
    
    onSuccess({
      title: formData.title,
      description: description,
      price: formData.price,
      category: formData.category,
      condition: formData.condition,
      imageUrl: image,
      donationPercent: donationPercent,
      deliveryMethod: deliveryMethod,
      originAddress: deliveryMethod === DeliveryMethod.DELIVERY ? originAddress : undefined,
      seller: "나 (본인)",
      team: "플랫폼 개발팀"
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto border border-gray-100 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">물건 등록하기</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {image ? (
            <img src={image} alt="Preview" className="max-h-48 rounded-xl object-contain shadow-sm" />
          ) : (
            <div className="text-center py-8">
              <div className="bg-teal-100 text-teal-600 p-4 rounded-full inline-block mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <p className="text-sm font-medium text-gray-500">물건 사진을 업로드해 주세요</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">상세 설명 (선택)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            placeholder="AI가 물건을 더 잘 분석할 수 있게 도와주세요..."
            rows={3}
          />
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={!image || isAnalyzing}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-teal-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI가 분석 중입니다...
            </>
          ) : (
            "✨ AI 자동 분석"
          )}
        </button>

        {formData.title && (
          <div className="pt-4 border-t border-gray-100 space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">상품명</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full text-lg font-bold text-gray-800 focus:outline-none" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">카테고리</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as ItemCategory})}
                  className="w-full border-b border-gray-100 py-1 font-medium text-gray-700 outline-none"
                >
                  {Object.values(ItemCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">상태</label>
                <select 
                  value={formData.condition}
                  onChange={e => setFormData({...formData, condition: e.target.value as ItemCondition})}
                  className="w-full border-b border-gray-100 py-1 font-medium text-gray-700 outline-none"
                >
                  {Object.values(ItemCondition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">배송 방법</label>
                <div className="flex gap-2 mt-1">
                  {Object.values(DeliveryMethod).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDeliveryMethod(method)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                        deliveryMethod === method 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {deliveryMethod === DeliveryMethod.DELIVERY && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">출발지 주소 (택배 보낼 곳)</label>
                  <input 
                    type="text" 
                    value={originAddress} 
                    onChange={e => setOriginAddress(e.target.value)}
                    placeholder="예: 서울시 강남구 OO타워 15층"
                    className="w-full border-b border-gray-200 py-2 text-sm font-medium text-gray-800 focus:border-teal-500 outline-none transition-all" 
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">제안 판매가 (P)</label>
              <input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                className="w-full text-2xl font-bold text-teal-600 outline-none" 
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
               <label className="block text-sm font-bold text-emerald-800 mb-2 flex justify-between">
                <span>기부 비율 설정</span>
                <span className="text-emerald-600">{donationPercent}%</span>
               </label>
               <input 
                 type="range" 
                 min="10" max="100" step="10" 
                 value={donationPercent} 
                 onChange={e => setDonationPercent(parseInt(e.target.value))}
                 className="w-full accent-emerald-500 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
               />
               <p className="text-[11px] text-emerald-600 mt-2 font-medium">
                 {donationPercent === 100 
                  ? "😇 대단해요! 100% 기부 시 '기부 천사' 배지가 부여됩니다." 
                  : `판매 시 ₩ ${(formData.price * donationPercent / 100).toLocaleString()}이 선택한 자선 단체에 기부됩니다.`}
               </p>
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all mt-4"
            >
              장터에 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellItem;
