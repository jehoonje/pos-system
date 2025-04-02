// app/pos/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PosClient } from './PosClient';
import { fetchServerCategories, fetchServerMenus } from '../api/serverPosData';

export default async function PosPage() {
  // 서버에서 쿠키 읽기
  const cookieStore = cookies();
  const storeIdCookie = cookieStore.get('currentStoreId');
  const accessTokenCookie = cookieStore.get('accessToken');
  
  // 인증 확인 (서버 측에서)
  if (!accessTokenCookie) {
    redirect('/');
  }
  
  const storeId = storeIdCookie ? Number(storeIdCookie.value) : null;
  
  // 서버에서 초기 데이터 가져오기
  let initialCategories: any[] = [];
  let initialMenus: any[] = [];
  
  if (storeId) {
    try {
      // 카테고리 데이터 가져오기
      initialCategories = await fetchServerCategories(storeId);
      
      // 첫 번째 카테고리의 메뉴 데이터 가져오기
      if (initialCategories.length > 0) {
        const firstCategoryId = initialCategories[0].categoryId;
        initialMenus = await fetchServerMenus(storeId, firstCategoryId);
      }
    } catch (error) {
      console.error('서버에서 초기 데이터 로딩 실패:', error);
      // 에러 처리는 클라이언트에서 추가로 수행
    }
  }
  
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">로딩 중...</div>}>
      <PosClient 
        initialStoreId={storeId} 
        initialCategories={initialCategories} 
        initialMenus={initialMenus} 
      />
    </Suspense>
  );
}
