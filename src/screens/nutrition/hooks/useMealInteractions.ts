import { useState, useCallback } from 'react';
import { Meal, MealInteraction } from '../types';
import nutritionAPI from '../../../services/nutritionApi';
import Toast from 'react-native-toast-message';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('useMealInteractions');

export const useMealInteractions = (dayMeals: Meal[], selectedMeal: Meal | null) => {
  const [mealInteractions, setMealInteractions] = useState<MealInteraction>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealForFeedback, setSelectedMealForFeedback] = useState<Meal | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  const handleMealLike = useCallback(async (mealId: string) => {
    logger.group('👍 MEAL LIKE ACTION');
    logger.info('User Action: Meal like button pressed', { mealId });
    
    try {
      const meal = dayMeals.find(m => m.id === mealId) || selectedMeal;
      const mealName = meal?.name || 'ce repas';
      
      const currentInteraction = mealInteractions[mealId];
      logger.debug('Current state', {
        mealId,
        currentInteraction,
        action: 'POST /meals/{mealId}/like (toggles: if liked removes, if disliked changes to like)'
      });
      
      logger.debug('API Request: Toggling meal like', { mealId, endpoint: 'POST /meals/{mealId}/like' });
      const response = await nutritionAPI.likeMeal(mealId);
      logger.debug('API Response: Like action completed', { 
        response: response?.data || response,
        userInteraction: response?.data?.userInteraction || response?.userInteraction
      });
      
      const userInteraction = response?.data?.userInteraction || 
                             response?.data?.data?.userInteraction ||
                             response?.userInteraction || 
                             null;
      
      const updatedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                null;
      
      logger.debug('API Response parsing', {
        mealId,
        rawResponse: response,
        userInteraction,
        normalizedInteraction: updatedInteraction
      });
      
      setMealInteractions(prev => {
        const interaction: 'like' | 'dislike' | null = updatedInteraction === 'like' ? 'like' : 
                                                      updatedInteraction === 'dislike' ? 'dislike' : null;
        const updated: MealInteraction = { ...prev, [mealId]: interaction };
        logger.debug('Updated mealInteractions state', { mealId, updatedInteraction, allInteractions: updated });
        return updated;
      });
      
      logger.info('State updated based on API response', { 
        mealId, 
        previousInteraction: currentInteraction,
        newInteraction: updatedInteraction
      });
      
      if (updatedInteraction === 'like') {
        Toast.show({
          type: 'success',
          text1: 'Repas aimé',
          text2: `Vous avez aimé ${mealName}`
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Like supprimé',
          text2: `Vous n'avez plus aimé ${mealName}`
        });
      }
      logger.groupEnd();
    } catch (error) {
      logger.error('Error handling meal like', error);
      logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  }, [dayMeals, selectedMeal, mealInteractions]);

  const handleMealDislike = useCallback(async (mealId: string) => {
    logger.group('👎 MEAL DISLIKE ACTION');
    logger.info('User Action: Meal dislike button pressed', { mealId });
    
    try {
      const meal = dayMeals.find(m => m.id === mealId) || selectedMeal;
      const mealName = meal?.name || 'ce repas';
      
      const currentInteraction = mealInteractions[mealId];
      logger.debug('Current state', {
        mealId,
        currentInteraction,
        action: 'POST /meals/{mealId}/dislike (toggles: if disliked removes, if liked changes to dislike)'
      });
      
      logger.debug('API Request: Toggling meal dislike', { mealId, endpoint: 'POST /meals/{mealId}/dislike' });
      const response = await nutritionAPI.dislikeMeal(mealId);
      logger.debug('API Response: Dislike action completed', { 
        response: response?.data || response,
        userInteraction: response?.data?.userInteraction || response?.userInteraction
      });
      
      const userInteraction = response?.data?.userInteraction || 
                             response?.data?.data?.userInteraction ||
                             response?.userInteraction || 
                             null;
      
      const updatedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                null;
      
      logger.debug('API Response parsing', {
        mealId,
        rawResponse: response,
        userInteraction,
        normalizedInteraction: updatedInteraction
      });
      
      setMealInteractions(prev => {
        const interaction: 'like' | 'dislike' | null = updatedInteraction === 'like' ? 'like' : 
                                                      updatedInteraction === 'dislike' ? 'dislike' : null;
        const updated: MealInteraction = { ...prev, [mealId]: interaction };
        logger.debug('Updated mealInteractions state', { mealId, updatedInteraction, allInteractions: updated });
        return updated;
      });
      
      logger.info('State updated based on API response', { 
        mealId, 
        previousInteraction: currentInteraction,
        newInteraction: updatedInteraction
      });
      
      if (updatedInteraction === 'dislike') {
        Toast.show({
          type: 'success',
          text1: 'Repas non aimé',
          text2: `Vous n'avez pas aimé ${mealName}`
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Dislike supprimé',
          text2: `Vous n'avez plus détesté ${mealName}`
        });
      }
      logger.groupEnd();
    } catch (error) {
      logger.error('Error handling meal dislike', error);
      logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  }, [dayMeals, selectedMeal, mealInteractions]);

  const handleMealFeedback = useCallback((meal: Meal) => {
    setSelectedMealForFeedback(meal);
    setFeedbackText('');
    setFeedbackRating(5);
    setShowFeedbackModal(true);
  }, []);

  const submitMealFeedback = useCallback(async () => {
    if (!selectedMealForFeedback) return;
    
    logger.group('💬 SUBMIT MEAL FEEDBACK');
    logger.info('User Action: Submitting meal feedback', {
      mealId: selectedMealForFeedback.id,
      mealName: selectedMealForFeedback.name,
      rating: feedbackRating,
      hasFeedbackText: !!feedbackText,
      feedbackLength: feedbackText.length,
    });
    
    try {
      const feedbackPayload = {
        feedback: feedbackText,
        rating: feedbackRating,
        suggestions: feedbackText
      };
      
      logger.debug('API Request: Submitting meal feedback', {
        mealId: selectedMealForFeedback.id,
        endpoint: 'nutritionAPI.submitMealFeedback',
        payload: feedbackPayload,
      });
      
      await nutritionAPI.submitMealFeedback(selectedMealForFeedback.id, feedbackPayload);
      
      logger.debug('API Response: Feedback submitted successfully');
      logger.info('State: Closing feedback modal and resetting form');
      
      Toast.show({
        type: 'success',
        text1: 'Feedback envoyé',
        text2: 'Merci pour votre retour détaillé!'
      });
      
      setShowFeedbackModal(false);
      setSelectedMealForFeedback(null);
      logger.groupEnd();
    } catch (error) {
      logger.error('Error submitting feedback', error);
      logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'envoyer votre feedback'
      });
    }
  }, [selectedMealForFeedback, feedbackText, feedbackRating]);

  return {
    mealInteractions,
    setMealInteractions,
    showFeedbackModal,
    setShowFeedbackModal,
    selectedMealForFeedback,
    feedbackText,
    setFeedbackText,
    feedbackRating,
    setFeedbackRating,
    handleMealLike,
    handleMealDislike,
    handleMealFeedback,
    submitMealFeedback,
  };
};

