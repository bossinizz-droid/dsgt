
import React, { useState, useEffect } from 'react';
import { Item, ItemCategory, ItemCondition, DeliveryMethod, DonationStats, User } from './types';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import SellItem from './components/SellItem';
import Auth from './components/Auth';

const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    title: '빈티지 캠핑 의자',
    description: '거의 새것, 가볍고 튼튼합니다',
    price: 45000,
    category: ItemCategory.CAMPING,
    condition: ItemCondition.A,
    deliveryMethod: DeliveryMethod.DIRECT,
    seller: '김철수',
    team: '마케팅팀',
    imageUrls: ['https://picsum.photos/seed/camping/600/600'],
    donationPercent: 100
  },
  {
    id: '2',
    title: '로지텍 G913 무선 키보드',
    description: '코딩용으로 최고입니다. 청축 모델입니다.',
    price: 120000,
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.S,
    deliveryMethod: DeliveryMethod.DELIVERY,
    originAddress: '경기도 성남시 분당구 판교역로 100',
    seller: '이영희',
    team: '플랫폼 개발팀',
    imageUrls: ['https://picsum.photos/seed/keyboard/600/600'],
    donationPercent: 50
  },
  {
    id: '3',
    title: 'CEO 특별 소장 골프채 세트',
    description: '프로 골퍼 사인 소장용 모델',
    price: 500000,
    category: ItemCategory.CEO_TREASURE,
    condition: ItemCondition.S,
    deliveryMethod: DeliveryMethod.DIRECT,
    seller: '대표이사 J. Doe',
    team: '경영지원',
    imageUrls: ['https://picsum.photos/seed/golf/600/600'],
    donationPercent: 100,
    isAuction: true,
    currentBid: 520000,
    endsAt: new Date(Date.now() + 86400000)
  }
];

const MOCK_STATS: DonationStats = {
  totalAmount: 12450000,
  treeEquivalents: 342,
  beneficiariesCount: 128,
  teamRankings: [
    { team: '플랫폼 개발팀', amount: 3500000 },
    { team: '마케팅팀', amount: 2800000 },
    { team: '영업팀', amount: 2100000 },
    { team: '인사팀', amount: 1500000 },
    { team: '재무팀', amount: 1200000 }
  ]
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'stats'>('market');
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [isSelling, setIsSelling] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('gnt_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gnt_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gnt_session');
  };

  const handlePurchase = (item: Item) => {
    if (!currentUser) return;
    if (currentUser.points < item.price) {
      alert('복지 포인트가 부족합니다.');
      return;
    }

    const donationAmount = Math.floor(item.price * item.donationPercent / 100);
    alert(`'${item.title}' 구매가 완료되었습니다!\n₩${donationAmount.toLocaleString()}이 기부됩니다.`);
    
    const updatedUser = { ...currentUser, points: currentUser.points - item.price };
    setCurrentUser(updatedUser);
    localStorage.setItem('gnt_session', JSON.stringify(updatedUser));
    
    setItems(items.filter(i => i.id !== item.id));
    setSelectedItem(null);
  };

  const handleAddItem = (newItem: Partial<Item>) => {
    if (!currentUser) return;
    
    const itemToAdd: Item = {
      id: Date.now().toString(),
      title: newItem.title || '제목 없음',
      description: newItem.description || '',
      price: newItem.price || 0,
      aiSuggestedPrice: newItem.aiSuggestedPrice,
      category: newItem.category || ItemCategory.ELECTRONICS,
      condition: newItem.condition || ItemCondition.A,
      deliveryMethod: newItem.deliveryMethod || DeliveryMethod.DIRECT,
      originAddress: newItem.originAddress,
      seller: currentUser.name,
      team: currentUser.team,
      imageUrls: newItem.imageUrls || ['https://via.placeholder.com/600'],
      donationPercent: newItem.donationPercent || 50,
    };
    
    setItems(prev => [itemToAdd, ...prev]);
    setIsSelling(false);
    setActiveTab('market');
  };

  const openItemDetail = (item: Item) => {
    setSelectedItem(item);
    setCurrentImageIdx(0);
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-200">D</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">DS플리마켓</h1>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">따뜻한 나눔 장터</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('market')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>사내 장터</button>
            <button onClick={() => setActiveTab('stats')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>기부 현황</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-500 font-medium">{currentUser.name} 님의 포인트</p>
              <p className="text-sm font-bold text-gray-800">₩ {currentUser.points.toLocaleString()}</p>
            </div>
            <button onClick={() => setIsSelling(true)} className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>물건 올리기</span>
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {activeTab === 'market' ? (
          <Marketplace items={items} onSelectItem={openItemDetail} />
        ) : (
          <Dashboard stats={MOCK_STATS} />
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slideUp">
            <div className="relative group">
              <img src={selectedItem.imageUrls[currentImageIdx]} className="w-full aspect-square object-cover" />
              {selectedItem.imageUrls.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImageIdx(prev => (prev === 0 ? selectedItem.imageUrls.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button 
                    onClick={() => setCurrentImageIdx(prev => (prev === selectedItem.imageUrls.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {selectedItem.imageUrls.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentImageIdx ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedItem.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedItem.seller} • {selectedItem.team}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-teal-600">₩ {selectedItem.price.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-gray-400">{selectedItem.condition}</p>
                </div>
              </div>
              
              {selectedItem.description && <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{selectedItem.description}</p>}

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">배송 방법</p>
                    <p className="text-sm font-semibold text-gray-700">{selectedItem.deliveryMethod}</p>
                 </div>
                 {selectedItem.deliveryMethod === DeliveryMethod.DELIVERY && (
                   <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">출발지 주소</p>
                      <p className="text-[11px] font-semibold text-gray-700 line-clamp-2">{selectedItem.originAddress}</p>
                   </div>
                 )}
              </div>
              
              <div className="bg-teal-50 rounded-2xl p-4 mb-6 border border-teal-100">
                <div className="flex items-center gap-3 text-teal-900 font-bold text-sm">
                   <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                   판매금 {selectedItem.donationPercent}% 기부 예정
                </div>
              </div>

              <button onClick={() => handlePurchase(selectedItem)} className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-teal-700 transition-all disabled:opacity-50" disabled={currentUser.points < selectedItem.price}>
                {currentUser.points < selectedItem.price ? '포인트가 부족합니다' : '복지 포인트로 결제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSelling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SellItem 
            currentUser={currentUser}
            onSuccess={handleAddItem} 
            onCancel={() => setIsSelling(false)} 
          />
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden flex justify-around p-3 z-40">
        <button onClick={() => setActiveTab('market')} className={`flex flex-col items-center gap-1 ${activeTab === 'market' ? 'text-teal-600' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg><span className="text-[10px] font-bold">장터</span></button>
        <button onClick={() => setIsSelling(true)} className="flex flex-col items-center gap-1 -mt-8"><div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></div></button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-teal-600' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg><span className="text-[10px] font-bold">현황</span></button>
      </nav>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
