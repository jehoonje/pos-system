declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: any) => void }) => void;
    };
  }
}

export {};
