'use client';

import { useState } from 'react';
import { verifyPassword } from './actions';

interface AdminLoginFormProps {
  onAuthSuccess: () => void;
}

export default function AdminLoginForm({ onAuthSuccess }: AdminLoginFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await verifyPassword(formData);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      // TypeScript 오류 해결: result.success가 true이면 result.token은 반드시 존재함
      localStorage.setItem('blog_admin_token', result.token);
      onAuthSuccess();
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">블로그 관리자 페이지</h1>

      <form action={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {loading ? '확인 중...' : '관리자 접속'}
        </button>
      </form>
    </div>
  );
}
