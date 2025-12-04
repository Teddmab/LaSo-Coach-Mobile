import { useState, useEffect, useMemo } from 'react';
import faqApi from '../../../services/faqApi';
import { FAQ, FAQState } from '../types';

export const useFAQ = () => {
  const [state, setState] = useState<FAQState>({
    faqs: [],
    loading: true,
    searchQuery: '',
    selectedCategory: 'ALL',
    expandedItems: {},
  });

  // Fetch FAQs on mount
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const data = await faqApi.getFAQs();
      setState(prev => ({ ...prev, faqs: data || [], loading: false }));
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['ALL', ...new Set(state.faqs.map(faq => faq.category).filter((cat): cat is string => Boolean(cat)))];
    return cats;
  }, [state.faqs]);

  // Get category counts
  const getCategoryCount = (category: string): number => {
    if (category === 'ALL') return state.faqs.length;
    return state.faqs.filter(faq => faq.category === category).length;
  };

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = state.faqs;

    // Filter by category
    if (state.selectedCategory !== 'ALL') {
      filtered = filtered.filter(faq => faq.category === state.selectedCategory);
    }

    // Filter by search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    // Group by category
    const grouped: Record<string, FAQ[]> = {};
    filtered.forEach(faq => {
      const category = faq.category || 'OTHER';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(faq);
    });

    return grouped;
  }, [state.faqs, state.selectedCategory, state.searchQuery]);

  // Toggle expand/collapse
  const toggleExpand = (faqId: string): void => {
    setState(prev => ({
      ...prev,
      expandedItems: {
        ...prev.expandedItems,
        [faqId]: !prev.expandedItems[faqId],
      },
    }));
  };

  const setSearchQuery = (query: string): void => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const setSelectedCategory = (category: string): void => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  };

  return {
    ...state,
    categories,
    filteredFAQs,
    getCategoryCount,
    toggleExpand,
    setSearchQuery,
    setSelectedCategory,
    refetch: fetchFAQs,
  };
};

