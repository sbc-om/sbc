declare module 'ml5' {
  export function featureExtractor(model: string, options?: any): any;
  export function imageClassifier(model: string): any;
  export function sentiment(dataset: string): any;
  const ml5: any;
  export default ml5;
}
