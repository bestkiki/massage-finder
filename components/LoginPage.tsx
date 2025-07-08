
import React, { useState, FormEvent } from 'react';
import { signInAdmin } from '../firebase';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setIsLoggingIn(false);
      return;
    }

    try {
      await signInAdmin(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err.code, err.message);
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('이메일 또는 비밀번호가 잘못되었습니다. 다시 확인해주세요.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 형식입니다.');
          break;
        case 'auth/network-request-failed':
            setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
            break;
        default:
          setError('로그인 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-100 to-purple-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
        <div className="text-center mb-8">
            <i className="fas fa-spa text-5xl text-pink-500"></i>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 mt-4">
                관리자 로그인
            </h1>
            <p className="text-sm text-gray-500 mt-2">마사지 파인더 관리자 페이지</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition"
              disabled={isLoggingIn}
            />
          </div>

          <div>
            <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition"
              disabled={isLoggingIn}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </>
              ) : (
                <><i className="fas fa-sign-in-alt mr-2"></i>로그인</>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
            <button
                onClick={onClose}
                className="text-sm font-medium text-pink-600 hover:text-pink-500 transition-colors"
            >
                <i className="fas fa-arrow-left mr-1.5"></i> 메인 페이지로 돌아가기
            </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
