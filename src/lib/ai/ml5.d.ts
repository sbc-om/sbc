declare module 'ml5' {
  export function featureExtractor(model: string, options?: unknown): unknown;
  export function imageClassifier(model: string): unknown;
  export function sentiment(dataset: string): unknown;
  const ml5: unknown;
  export default ml5;
}
