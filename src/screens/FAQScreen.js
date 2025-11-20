import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import faqApi from '../services/faqApi';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import NotificationBadge from '../components/NotificationBadge';

const FAQScreen = ({ onClose, user, onTabPress }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedItems, setExpandedItems] = useState({});

  // Fetch FAQs on mount
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const data = await faqApi.getFAQs();
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['ALL', ...new Set(faqs.map(faq => faq.category).filter(Boolean))];
    return cats;
  }, [faqs]);

  // Get category counts
  const getCategoryCount = (category) => {
    if (category === 'ALL') return faqs.length;
    return faqs.filter(faq => faq.category === category).length;
  };

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    // Group by category
    const grouped = {};
    filtered.forEach(faq => {
      const category = faq.category || 'OTHER';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(faq);
    });

    return grouped;
  }, [faqs, selectedCategory, searchQuery]);

  // Toggle expand/collapse
  const toggleExpand = (faqId) => {
    setExpandedItems(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // Render category filter buttons
  const renderCategoryFilters = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFiltersContainer}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        {categories.map(category => {
          const count = getCategoryCount(category);
          const isSelected = selectedCategory === category;
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterButton,
                isSelected && styles.categoryFilterButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons
                name="help-circle-outline"
                size={18}
                color={isSelected ? '#FFFFFF' : '#FF9800'}
                style={styles.categoryIcon}
              />
              <Text style={[
                styles.categoryFilterText,
                isSelected && styles.categoryFilterTextActive
              ]}>
                {category === 'ALL' ? 'Toutes les catégories' : category}
              </Text>
              <View style={[
                styles.categoryBadge,
                isSelected && styles.categoryBadgeActive
              ]}>
                <Text style={[
                  styles.categoryBadgeText,
                  isSelected && styles.categoryBadgeTextActive
                ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Render FAQ item
  const renderFAQItem = (faq) => {
    const isExpanded = expandedItems[faq.id];
    
    return (
      <View key={faq.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => toggleExpand(faq.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render category section
  const renderCategorySection = (category, items) => {
    if (items.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color="#FF9800"
            style={styles.categorySectionIcon}
          />
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.categorySectionBadge}>
            <Text style={styles.categorySectionBadgeText}>{items.length}</Text>
          </View>
        </View>
        {items.map(faq => renderFAQItem(faq))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <AppHeader
        showLogo={true}
        onHelpPress={() => {
          // Already on FAQ page, do nothing
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Questions Fréquemment Posées</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Trouvez ici les réponses à vos questions.</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une question..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        {renderCategoryFilters()}

        {/* FAQ Items */}
        {Object.keys(filteredFAQs).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>Aucune question trouvée</Text>
          </View>
        ) : (
          Object.entries(filteredFAQs).map(([category, items]) =>
            renderCategorySection(category, items)
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  categoryFiltersContainer: {
    marginBottom: 24,
  },
  categoryFiltersContent: {
    paddingRight: 16,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  categoryFilterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  categoryBadgeTextActive: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categorySectionIcon: {
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  categorySectionBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  categorySectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  faqAnswerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
});

export default FAQScreen;

