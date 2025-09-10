import { Router } from 'express';

const router = Router();

// Extract from URL
router.post('/extract-url', (req, res) => {
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
        cat.toLowerCase().includes('gear')
      );
      if (matchedCategory) {
        mockExtraction.suggestedCategory = matchedCategory;
      }
    }

    res.json({
      success: true,
      data: mockExtraction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract from URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extract from prompt
router.post('/extract-prompt', (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Mock extraction from prompt
    const brandPattern = /(Arc'teryx|Patagonia|Montbell|REI|Osprey|Deuter|Gregory)/i;
    const brandMatch = prompt.match(brandPattern);
    
    const mockExtraction = {
      name: brandMatch ? `${brandMatch[1]} Product` : 'Extracted Gear',
      brand: brandMatch ? brandMatch[1] : 'Unknown Brand',
      weightGrams: Math.floor(Math.random() * 500) + 100,
      priceCents: Math.floor(Math.random() * 15000) + 5000,
      suggestedCategory: prompt.toLowerCase().includes('jacket') ? 'Clothing' : 'Other',
      confidence: 0.7 + Math.random() * 0.2
    };

    res.json({
      success: true,
      data: mockExtraction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract from prompt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhance URL data with prompt
router.post('/enhance-url-prompt', (req, res) => {
  try {
    const { urlData, prompt } = req.body;
    
    if (!urlData || !prompt) {
      return res.status(400).json({
        success: false,
        message: 'URL data and prompt are required'
      });
    }

    // Extract weight from prompt if mentioned
    const weightMatch = prompt.match(/(\d+)\s*g/i);
    const enhancedData = {
      ...urlData,
      weightGrams: weightMatch ? parseInt(weightMatch[1]) : urlData.weightGrams,
      confidence: Math.max(urlData.confidence || 0.5, 0.85)
    };

    res.json({
      success: true,
      data: enhancedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enhance URL data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extract category from prompt
router.post('/extract-category', (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Simple category extraction
    const categoryMap: { [key: string]: { name: string; englishName: string } } = {
      'シェルター': { name: 'シェルター', englishName: 'Shelter' },
      '調理器具': { name: '調理器具', englishName: 'Cooking' },
      '防寒具': { name: '防寒具', englishName: 'Insulation' },
      'レインギア': { name: 'レインギア', englishName: 'Rain Gear' },
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (prompt.includes(key)) {
        return res.json({
          success: true,
          data: value
        });
      }
    }

    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze gear list
router.post('/analyze-list', (req, res) => {
  try {
    const { gearItems } = req.body;
    
    if (!Array.isArray(gearItems)) {
      return res.status(400).json({
        success: false,
        message: 'Gear items array is required'
      });
    }

    const totalWeight = gearItems.reduce((sum: number, item: any) => 
      sum + ((item.weightGrams || 0) * (item.requiredQuantity || 1)), 0);
    const itemCount = gearItems.length;
    const missingItems = gearItems.filter((item: any) => 
      (item.requiredQuantity || 1) > (item.ownedQuantity || 0)).length;

    const analysisResult = {
      summary: `総重量: ${totalWeight}g (${itemCount}アイテム) | 不足: ${missingItems}アイテム`,
      tips: [
        totalWeight > 10000 ? '10kg超過 - 軽量化を検討' : '良い重量バランスです',
        missingItems > 0 ? `${missingItems}アイテムが不足しています` : '必要なアイテムは揃っています',
        itemCount < 10 ? '基本アイテムの追加を検討' : '十分なアイテム数です'
      ].filter(tip => tip.length > 0)
    };

    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze gear list',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LLM service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;