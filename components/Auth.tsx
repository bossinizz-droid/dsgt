
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [team, setTeam] = useState('플랫폼 개발팀');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 로컬 스토리지 시뮬레이션
    const usersJson = localStorage.getItem('gnt_users') || '[]';
    const users: (User & { password?: string })[] = JSON.parse(usersJson);

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin({ id: user.id, email: user.email, name: user.name, team: user.team, points: user.points });
      } else {
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
      }
    } else {
      if (users.some(u => u.email === email)) {
        alert('이미 존재하는 이메일입니다.');
        return;
      }
      const newUser: User & { password?: string } = {
        id: Date.now().toString(),
        email,
        password,
        name,
        team,
        points: 50000 // 가입 축하 포인트
      };
      users.push(newUser);
      localStorage.setItem('gnt_users', JSON.stringify(users));
      onLogin({ id: newUser.id, email: newUser.email, name: newUser.name, team: newUser.team, points: newUser.points });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-teal-200 mb-4">
            D
          </div>
          <h1 className="text-2xl font-bold text-gray-800">DS플리마켓</h1>
          <p className="text-sm text-gray-500 mt-1">사내 나눔 마켓에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">이름</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">소속 팀</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  <option>플랫폼 개발팀</option>
                  <option>마케팅팀</option>
                  <option>영업팀</option>
                  <option>인사팀</option>
                  <option>재무팀</option>
                  <option>경영지원</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">사내 이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              placeholder="example@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all mt-4"
          >
            {isLogin ? '로그인' : '회원가입 완료'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            {isLogin ? '처음이신가요? 계정 만들기' : '이미 계정이 있나요? 로그인하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
