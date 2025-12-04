import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../constants/theme';
import { FAQScreenProps } from './faq/types';
import { useFAQ } from './faq/hooks/useFAQ';
import FAQSearchBar from './faq/components/FAQSearchBar';
import FAQCategoryFilters from './faq/components/FAQCategoryFilters';
import FAQCategorySection from './faq/components/FAQCategorySection';
import FAQEmptyState from './faq/components/FAQEmptyState';
import { ShimmerCard } from '../components/Shimmer';

const FAQScreen: React.FC<FAQScreenProps> = ({ onClose, user, onTabPress }) => {
  const {
    loading,
    searchQuery,
    selectedCategory,
    expandedItems,
    categories,
    filteredFAQs,
    getCategoryCount,
    toggleExpand,
    setSearchQuery,
    setSelectedCategory,
  } = useFAQ();

  if (loading) {
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={styles.pageTitle}>Questions Fréquemment Posées</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>Trouvez ici les réponses à vos questions.</Text>

      {/* Search Bar */}
      <FAQSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category Filters */}
      <FAQCategoryFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        getCategoryCount={getCategoryCount}
      />

      {/* FAQ Items */}
      {Object.keys(filteredFAQs).length === 0 ? (
        <FAQEmptyState />
      ) : (
        Object.entries(filteredFAQs).map(([category, items]) => (
          <FAQCategorySection
            key={category}
            category={category}
            items={items}
            expandedItems={expandedItems}
            onToggleItem={toggleExpand}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Espace pour la navigation fixe
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default FAQScreen;

