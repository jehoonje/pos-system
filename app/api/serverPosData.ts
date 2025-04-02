// api/serverPosData.ts
import { headers } from 'next/headers';

// 서버 컴포넌트에서 절대 경로 대신 상대 경로 사용
const API_BASE_PATH = '/api';

// 서버에서 인증 토큰 가져오기
function getAuthHeader() {
  const headersList = headers();
  const cookie = headersList.get('cookie') || '';
  const tokenMatch = cookie.match(/accessToken=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : '';
  
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

// 서버에서 카테고리 데이터 가져오기
export async function fetchServerCategories(storeId: number) {
  if (!storeId) return [];
  
  try {
    const authHeaders = getAuthHeader();
    
    // 상대 경로 사용
    const url = `${API_BASE_PATH}/categories/all/${storeId}`;
    console.log('서버 컴포넌트에서 API 요청:', url);
    
    const response = await fetch(url, {
      headers: authHeaders,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`카테고리 데이터 로딩 실패: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('서버 카테고리 로딩 오류:', error);
    return [];
  }
}

// 서버에서 메뉴 데이터 가져오기
export async function fetchServerMenus(storeId: number, categoryId: number) {
  if (!storeId || !categoryId) return [];
  
  try {
    const authHeaders = getAuthHeader();
    
    // 상대 경로 사용
    const url = `${API_BASE_PATH}/menus/all/${categoryId}?storeId=${storeId}`;
    console.log('서버 컴포넌트에서 API 요청:', url);
    
    const response = await fetch(url, {
      headers: authHeaders,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`메뉴 데이터 로딩 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((menu: any) => ({
      ...menu,
      menuId: menu.menuId ?? menu.id ?? null,
    }));
  } catch (error) {
    console.error('서버 메뉴 로딩 오류:', error);
    return [];
  }
}
