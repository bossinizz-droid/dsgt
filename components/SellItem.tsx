import React, { useState, useRef } from 'react';
import { analyzeItem } from '../services/geminiService';
import { Item, ItemCategory, ItemCondition, DeliveryMethod, User } from '../types';

interface SellItemProps {
  currentUser: User;
  onSuccess: (newItem: Partial<Item>) => void;
  onCancel: () => void;
}

const SellItem: React.FC<SellItemProps> = ({ currentUser, onSuccess, onCancel }) => {
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [donationPercent, setDonationPercent] = useState(50);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.DIRECT);
  const [originAddress, setOriginAddress] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.A,
    aiSuggestedPrice: 0,
    userPrice: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Added explicit File type to prevent 'unknown' type assignment error during image processing.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files = Array.from(fileList);
    if (images.length + files.length > 5) {
      alert("이미지는 최대 5장까지 업로드 가능합니다.");
      return;
    }

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    try {
      // Analyze the first image for pricing suggestions
      const b64 = images[0].split(',')[1];
      const result = await analyzeItem(b64, description);
      
      setFormData({
        title: result.title || '',
        category: (result.category as ItemCategory) || ItemCategory.ELECTRONICS,
        condition: (result.condition as ItemCondition) || ItemCondition.A,
        aiSuggestedPrice: result.suggestedPrice || 0,
        userPrice: result.suggestedPrice || 0
      });
    } catch (error) {
      console.error("AI 분석 실패", error);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || images.length === 0) {
      alert("상품명과 최소 1장의 사진이 필요합니다.");
      return;
    }
    if (deliveryMethod === DeliveryMethod.DELIVERY && !originAddress.trim()) {
      alert("택배 배송 시 출발지 주소를 입력해주세요.");
      return;
    }
    
    onSuccess({
      title: formData.title,
      description: description,
      price: formData.userPrice,
      aiSuggestedPrice: formData.aiSuggestedPrice,
      category: formData.category,
      condition: formData.condition,
      imageUrls: images,
      donationPercent: donationPercent,
      deliveryMethod: deliveryMethod,
      originAddress: deliveryMethod === DeliveryMethod.DELIVERY ? originAddress : undefined,
      seller: currentUser.name,
      team: currentUser.team
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full mx-auto border border-gray-100 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">새 상품 등록</h2>
          <p className="text-sm text-gray-500 mt-1">등록자: <span className="font-bold text-teal-600">{currentUser.name}</span> ({currentUser.team})</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Multi-image Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">이미지 (최대 5장)</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-gray-100 group">
                <img src={img} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-teal-50 hover:border-teal-200 transition-all"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span className="text-[10px] mt-1 text-gray-500">{images.length}/5</span>
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" multiple />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">상세 설명</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            placeholder="상품에 대한 설명을 적어주세요..."
            rows={3}
          />
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={images.length === 0 || isAnalyzing}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-teal-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? "AI 분석 중..." : "✨ AI 가격 분석 및 추천"}
        </button>

        {formData.title && (
          <div className="pt-4 border-t border-gray-100 space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">AI 추천 상품명</label>
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

            {/* Pricing Section */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">AI 추천 가격</label>
                <p className="text-lg font-bold text-teal-600">₩ {formData.aiSuggestedPrice.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">내 판매 희망가</label>
                <input 
                  type="number" 
                  value={formData.userPrice} 
                  onChange={e => setFormData({...formData, userPrice: parseInt(e.target.value) || 0})}
                  className="w-full text-lg font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none" 
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">배송 방법</label>
                <div className="flex gap-2">
                  {Object.values(DeliveryMethod).map(method => (
                    <button
                      key={method}
                      onClick={() => setDeliveryMethod(method)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        deliveryMethod === method ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {deliveryMethod === DeliveryMethod.DELIVERY && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">출발지 주소</label>
                  <input 
                    type="text" 
                    value={originAddress} 
                    onChange={e => setOriginAddress(e.target.value)}
                    placeholder="예: OO타워 3층 탕비실"
                    className="w-full border-b border-gray-200 py-1 text-sm outline-none focus:border-teal-500" 
                  />
                </div>
              )}
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
               <label className="block text-sm font-bold text-emerald-800 mb-2 flex justify-between">
                <span>수익금 기부 비율</span>
                <span className="text-emerald-600">{donationPercent}%</span>
               </label>
               <input 
                 type="range" 
                 min="10" max="100" step="10" 
                 value={donationPercent} 
                 onChange={e => setDonationPercent(parseInt(e.target.value))}
                 className="w-full accent-emerald-500 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
               />
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl"
            >
              상품 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellItem;
