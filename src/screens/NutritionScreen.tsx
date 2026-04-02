import React from 'react';
import { NutritionLayout } from './nutrition/components/NutritionLayout';
import { NutritionScreenProps } from './nutrition/types';

const NutritionScreen: React.FC<NutritionScreenProps> = (props) => {
  return <NutritionLayout {...props} />;
};

export default NutritionScreen;
