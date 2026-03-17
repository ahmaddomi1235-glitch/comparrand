export { analyzeMedicineImage as analyze, isGeminiConfigured as isApiConfigured } from './GIMINI';

import { analyzeMedicineImage, isGeminiConfigured } from './GIMINI';

export const imageAnalysisService = {
  analyze: analyzeMedicineImage,
  isApiConfigured: isGeminiConfigured,
};

export default imageAnalysisService;
