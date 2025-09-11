import { Request, Response } from 'express';

export const handleExtractCategory = (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Mock category extraction
    const categoryKeywords = {
      'Shelter': ['tent', 'tarp', 'shelter', 'テント', 'タープ'],
      'Clothing': ['jacket', 'pants', 'shirt', 'ジャケット', 'パンツ'],
      'Cooking': ['stove', 'pot', 'cookware', 'バーナー', 'クッカー'],
      'Safety': ['helmet', 'rope', 'harness', 'ヘルメット', 'ロープ']
    };

    let detectedCategory = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => 
        prompt.toLowerCase().includes(keyword.toLowerCase())
      )) {
        detectedCategory = {
          name: category,
          englishName: category
        };
        break;
      }
    }

    if (detectedCategory) {
      res.json({
        success: true,
        data: detectedCategory,
        message: 'Category extracted successfully'
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: 'No specific category detected'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extract category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleAnalyzeGearList = (req: Request, res: Response) => {
  try {
    const { gearItems } = req.body;
    
    if (!Array.isArray(gearItems)) {
      return res.status(400).json({
        success: false,
        message: 'Gear items array is required'
      });
    }

    // Mock analysis
    const totalWeight = gearItems.reduce((sum, item) => 
      sum + ((item.weightGrams || 0) * (item.requiredQuantity || 1)), 0
    );
    const totalPrice = gearItems.reduce((sum, item) => 
      sum + ((item.priceCents || 0) * (item.requiredQuantity || 1)), 0
    );
    const missingItems = gearItems.filter(item => 
      (item.requiredQuantity || 1) > (item.ownedQuantity || 0)
    ).length;

    const analysis = {
      summary: `Total: ${totalWeight}g, ¥${Math.round(totalPrice / 100)}, Missing: ${missingItems} items`,
      tips: [
        totalWeight > 10000 ? 'Consider weight reduction - over 10kg' : 'Good weight balance',
        missingItems > 0 ? `You need ${missingItems} more items` : 'All required items owned',
        'Consider upgrading to lighter alternatives'
      ].filter(tip => tip.length > 0)
    };

    res.json({
      success: true,
      data: analysis,
      message: 'Gear list analysis completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze gear list',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};