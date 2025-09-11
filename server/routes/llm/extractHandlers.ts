import { Request, Response } from 'express';

export const handleExtractUrl = (req: Request, res: Response) => {
  try {
    const { url, userCategories } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Mock extraction logic (replace with actual LLM service)
    const mockExtraction = {
      name: 'Extracted Product',
      brand: 'Brand Name',
      weightGrams: Math.floor(Math.random() * 1000) + 50,
      priceCents: Math.floor(Math.random() * 10000) + 1000,
      suggestedCategory: 'Other',
      confidence: 0.8 + Math.random() * 0.2
    };

    // Adapt to user categories
    if (userCategories && Array.isArray(userCategories)) {
      const matchedCategory = userCategories.find((cat: string) => 
        cat.toLowerCase().includes('clothing') || 
        cat.toLowerCase().includes('shelter') ||
        cat.toLowerCase().includes('cook')
      );
      if (matchedCategory) {
        mockExtraction.suggestedCategory = matchedCategory;
      }
    }

    res.json({
      success: true,
      data: mockExtraction,
      message: 'URL extraction completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract from URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleExtractPrompt = (req: Request, res: Response) => {
  try {
    const { prompt, userCategories } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Mock extraction logic
    const mockExtraction = {
      name: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
      brand: extractBrandFromPrompt(prompt),
      weightGrams: extractWeightFromPrompt(prompt),
      priceCents: extractPriceFromPrompt(prompt),
      suggestedCategory: 'Other',
      confidence: 0.7 + Math.random() * 0.3
    };

    res.json({
      success: true,
      data: mockExtraction,
      message: 'Prompt extraction completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract from prompt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const extractBrandFromPrompt = (prompt: string): string | undefined => {
  const brands = ['Patagonia', 'Arc\'teryx', 'Montbell', 'REI', 'Osprey'];
  const found = brands.find(brand => 
    prompt.toLowerCase().includes(brand.toLowerCase())
  );
  return found;
};

const extractWeightFromPrompt = (prompt: string): number | undefined => {
  const weightMatch = prompt.match(/(\d+)\s*(g|gram)/i);
  return weightMatch ? parseInt(weightMatch[1]) : undefined;
};

const extractPriceFromPrompt = (prompt: string): number | undefined => {
  const priceMatch = prompt.match(/[¥$](\d+)/);
  return priceMatch ? parseInt(priceMatch[1]) * 100 : undefined;
};