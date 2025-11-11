'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import Layout from '../../components/Layout';

export default function Community() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const apiClient = useApiClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [stories, setStories] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddStory, setShowAddStory] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCommunityData();
    }
  }, [isAuthenticated]);

  const loadCommunityData = async () => {
    try {
      setIsLoadingData(true);
      
      // Token is automatically managed by useApiClient hook

      // Fetch community groups
      try {
        const groupsResponse = await apiClient.getCommunityGroups();
        setGroups(groupsResponse.groups || []);
      } catch (error) {
        console.error('Error loading groups:', error);
        // Fall back to mock data
        setGroups([
          {
            _id: '1',
            name: 'Type 2 Warriors',
            description: 'Support group for Type 2 diabetes management',
            memberCount: 1247,
            category: 'support',
            image: '🛡️',
            isJoined: true,
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
            region: 'global'
          },
          {
            _id: '2',
            name: 'Healthy Cooking Club',
            description: 'Share diabetes-friendly recipes and cooking tips',
            memberCount: 892,
            category: 'nutrition',
            image: '👨‍🍳',
            isJoined: false,
            lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
            region: 'north_america'
          }
        ]);
      }

      // Fetch recipes
      try {
        const recipesResponse = await apiClient.getRecipes({ limit: 12 });
        setRecipes(recipesResponse.recipes || []);
      } catch (error) {
        console.error('Error loading recipes:', error);
        // Fall back to mock data
        setRecipes([
          {
            _id: '1',
            title: 'Low-Carb Cauliflower Rice Bowl',
            authorName: 'Sarah M.',
            averageRating: 4.8,
            prepTime: 20,
            servings: 4,
            nutrition: { carbs: 12 },
            image: '🥗',
            tags: ['low-carb', 'vegetarian', 'quick'],
            likeCount: 234,
            saveCount: 89
          },
          {
            _id: '2',
            title: 'Grilled Salmon with Herbs',
            authorName: 'Mike R.',
            averageRating: 4.9,
            prepTime: 25,
            servings: 2,
            nutrition: { carbs: 3 },
            image: '🐟',
            tags: ['keto', 'high-protein', 'heart-healthy'],
          }
        ]);
      }
      setEvents([
        {
          _id: '1',
          title: 'Virtual Cooking Class: Healthy Desserts',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          time: '7:00 PM EST',
          attendees: 45,
          maxAttendees: 50,
          type: 'Virtual',
          host: 'Chef Amanda',
          description: 'Learn to make delicious sugar-free desserts',
          image: '🧁'
        },
        {
          _id: '2',
          title: 'Community Walk in Central Park',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          time: '9:00 AM',
          attendees: 23,
          maxAttendees: 30,
          type: 'In-Person',
          host: 'NYC Walking Group',
          description: '5K morning walk with fellow community members',
          image: '🏃‍♂️'
        }
      ]);

      // Fetch success stories
      try {
        const storiesResponse = await apiClient.getStories({ limit: 10 });
        setStories(storiesResponse.stories || []);
      } catch (error) {
        console.error('Error loading stories:', error);
        // Fall back to mock data
        setStories([
          {
            _id: '1',
            title: 'My Journey to Better Control',
            content: 'After struggling with diabetes management for years, I finally found a routine that works. Through consistent monitoring and this amazing community support, I reduced my A1C from 9.2% to 6.8% in just 6 months!',
            author: 'Sarah M.',
            category: 'journey',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            likes: 45,
            comments: 12
          },
          {
            _id: '2',
            title: 'Technology Changed My Life',
            content: 'Getting a continuous glucose monitor was a game-changer. I can now see how different foods affect my blood sugar in real-time and make better choices throughout the day.',
            author: 'Mike R.',
            category: 'technology',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            likes: 32,
            comments: 8
          }
        ]);
      }

      // Fetch events
      try {
        const eventsResponse = await apiClient.getEvents({ limit: 10 });
        setEvents(eventsResponse.events || []);
      } catch (error) {
        console.error('Error loading events:', error);
        // Keep existing mock data as fallback
      }

    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddRecipe = async (recipeData) => {
    try {
      await apiClient.createRecipe(recipeData);
      setShowAddRecipe(false);
      await loadCommunityData(); // Reload data
      alert('Recipe submitted successfully! It will be reviewed and published soon.');
    } catch (error) {
      console.error('Error adding recipe:', error);
      alert('Failed to submit recipe. Please try again.');
    }
  };

  const handleAddGroup = async (groupData) => {
    try {
      await apiClient.createCommunityGroup(groupData);
      setShowAddGroup(false);
      await loadCommunityData(); // Reload data
      alert('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleAddStory = async (storyData) => {
    try {
      await apiClient.createStory(storyData);
      setShowAddStory(false);
      await loadCommunityData(); // Reload data
      alert('Success story shared successfully!');
    } catch (error) {
      console.error('Error adding story:', error);
      alert('Failed to share story. Please try again.');
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      await apiClient.createEvent(eventData);
      setShowAddEvent(false);
      await loadCommunityData(); // Reload data
      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await apiClient.joinGroup(groupId);
      await loadCommunityData(); // Reload data
      alert('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please try again.');
    }
  };

  const handleLikeRecipe = async (recipeId) => {
    try {
      await apiClient.likeRecipe(recipeId);
      await loadCommunityData(); // Reload data
    } catch (error) {
      console.error('Error liking recipe:', error);
      alert('Failed to like recipe. Please try again.');
    }
  };

  const handleSaveRecipe = async (recipeId) => {
    try {
      await apiClient.saveRecipe(recipeId);
      await loadCommunityData(); // Reload data
      alert('Recipe saved to your collection!');
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading community...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
            Community & Support
          </h1>
          <p className="text-slate-600 mt-2 animate-slide-up animation-delay-100">
            Connect, share, and grow with fellow diabetes warriors
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 animate-slide-up animation-delay-200">
          <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
            {[
              { id: 'groups', label: 'Support Groups', icon: '👥' },
              { id: 'recipes', label: 'Recipes', icon: '🍽️' },
              { id: 'stories', label: 'Success Stories', icon: '📖' },
              { id: 'events', label: 'Events', icon: '📅' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* Support Groups Tab */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Support Groups</h2>
                <button 
                  onClick={() => setShowAddGroup(true)}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Group
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <div
                    key={group._id || group.id || index}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{group.image}</div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{group.name}</h3>
                          <p className="text-slate-600 text-sm">{group.category}</p>
                        </div>
                      </div>
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                        {group.region}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-4">{group.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>{group.memberCount?.toLocaleString() || 0} members</span>
                        <span>•</span>
                        <span>{group.lastActivity ? (typeof group.lastActivity === 'string' ? group.lastActivity : new Date(group.lastActivity).toLocaleDateString()) : 'Recently'}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => !group.isJoined && handleJoinGroup(group._id || group.id)}
                      disabled={group.isJoined}
                      className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-300 ${
                        group.isJoined
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-default'
                          : 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transform hover:scale-105 cursor-pointer'
                      }`}
                    >
                      {group.isJoined ? 'Joined ✓' : 'Join Group'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipes Tab */}
          {activeTab === 'recipes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Diabetes-Friendly Recipes</h2>
                <button 
                  onClick={() => setShowAddRecipe(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Share Recipe
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe, index) => (
                  <div
                    key={recipe._id || recipe.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-6xl">
                      {recipe.image}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-semibold text-slate-900 mb-2">{recipe.title}</h3>
                      <p className="text-slate-600 text-sm mb-3">by {recipe.authorName || recipe.author}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <span>⭐</span>
                          <span>{recipe.averageRating || recipe.rating}</span>
                        </div>
                        <span>•</span>
                        <span>{recipe.prepTime ? (typeof recipe.prepTime === 'number' ? `${recipe.prepTime} mins` : recipe.prepTime) : 'N/A'}</span>
                        <span>•</span>
                        <span>{recipe.nutrition?.carbs || recipe.carbs || 'N/A'} carbs</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(recipe.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <button 
                            onClick={() => handleLikeRecipe(recipe._id || recipe.id)}
                            className="flex items-center space-x-1 hover:text-red-500 transition-colors duration-300"
                          >
                            <span>❤️</span>
                            <span>{recipe.likeCount || recipe.likes || 0}</span>
                          </button>
                          <button 
                            onClick={() => handleSaveRecipe(recipe._id || recipe.id)}
                            className="flex items-center space-x-1 hover:text-blue-500 transition-colors duration-300"
                          >
                            <span>📌</span>
                            <span>{recipe.saveCount || recipe.saves || 0}</span>
                          </button>
                        </div>
                        <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-700 hover:to-red-700 transition-all duration-300">
                          View Recipe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Stories Tab */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Success Stories</h2>
                <button 
                  onClick={() => setShowAddStory(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Share Your Story
                </button>
              </div>
              
              <div className="space-y-6">
                {stories.map((story, index) => (
                  <div
                    key={story._id || story.id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                        {story.avatar}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{story.title}</h3>
                            <p className="text-slate-600 text-sm">by {story.authorName || story.author} • {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : (story.timeAgo || 'Recently')}</p>
                          </div>
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                            {story.category}
                          </span>
                        </div>
                        
                        <p className="text-slate-700 mb-4">{story.excerpt}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>❤️ {story.likeCount || story.likes || 0}</span>
                            <span>💬 {story.commentCount || story.comments || 0}</span>
                            <span>📖 {story.readTime}</span>
                          </div>
                          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                            Read More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Upcoming Events</h2>
                <button 
                  onClick={() => setShowAddEvent(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Event
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event, index) => (
                  <div
                    key={event._id || event.id || index}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="text-4xl">{event.image}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{event.title}</h3>
                        <p className="text-slate-600 text-sm mb-2">Hosted by {event.host}</p>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.type === 'Virtual' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 text-sm mb-4">{event.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm-6 4a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        <span>{event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'} at {event.time || 'Time TBD'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.attendees}/{event.maxAttendees} attending</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
                        Join Event
                      </button>
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-300">
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Recipe Modal */}
      {showAddRecipe && <AddRecipeForm onSubmit={handleAddRecipe} onClose={() => setShowAddRecipe(false)} />}
      
      {/* Add Group Modal */}
      {showAddGroup && <AddGroupForm onSubmit={handleAddGroup} onClose={() => setShowAddGroup(false)} />}
      
      {/* Add Story Modal */}
      {showAddStory && <AddStoryForm onSubmit={handleAddStory} onClose={() => setShowAddStory(false)} />}
      
      {/* Add Event Modal */}
      {showAddEvent && <AddEventForm onSubmit={handleAddEvent} onClose={() => setShowAddEvent(false)} />}
    </Layout>
  );
}

// Add Recipe Form Component
function AddRecipeForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', amount: '', unit: '' }],
    instructions: [{ step: 1, description: '' }],
    nutrition: { calories: '', carbs: '', protein: '', fat: '', fiber: '' },
    servings: 1,
    prepTime: 30,
    cookTime: 0,
    difficulty: 'medium',
    tags: [],
    glycemicIndex: 'low'
  });

  const [availableTags] = useState([
    'low-carb', 'keto', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'quick', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.ingredients.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Filter out empty ingredients and instructions
    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter(ing => ing.name && ing.amount),
      instructions: formData.instructions.filter(inst => inst.description).map((inst, idx) => ({
        ...inst,
        step: idx + 1
      }))
    };
    
    onSubmit(cleanedData);
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }]
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, { step: prev.instructions.length + 1, description: '' }]
    }));
  };

  const removeInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index, value) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? { ...inst, description: value } : inst
      )
    }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Share Your Recipe</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Recipe Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Delicious Low-Carb Chicken Bowl"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="3"
                placeholder="A healthy, diabetes-friendly meal that's both delicious and nutritious..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Servings</label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prep Time (minutes)</label>
              <input
                type="number"
                min="1"
                value={formData.prepTime}
                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cook Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={formData.cookTime}
                onChange={(e) => setFormData(prev => ({ ...prev, cookTime: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-slate-700">Ingredients *</label>
              <button
                type="button"
                onClick={addIngredient}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition-colors duration-300"
              >
                Add Ingredient
              </button>
            </div>
            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Amount"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="px-2 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-slate-700">Instructions *</label>
              <button
                type="button"
                onClick={addInstruction}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition-colors duration-300"
              >
                Add Step
              </button>
            </div>
            <div className="space-y-3">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <textarea
                    placeholder="Describe this step..."
                    value={instruction.description}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="2"
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="px-2 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4">Nutrition Information (per serving)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Calories"
                  value={formData.nutrition.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, nutrition: { ...prev.nutrition, calories: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <label className="text-xs text-slate-500">Calories</label>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Carbs"
                  value={formData.nutrition.carbs}
                  onChange={(e) => setFormData(prev => ({ ...prev, nutrition: { ...prev.nutrition, carbs: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <label className="text-xs text-slate-500">Carbs (g)</label>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Protein"
                  value={formData.nutrition.protein}
                  onChange={(e) => setFormData(prev => ({ ...prev, nutrition: { ...prev.nutrition, protein: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <label className="text-xs text-slate-500">Protein (g)</label>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Fat"
                  value={formData.nutrition.fat}
                  onChange={(e) => setFormData(prev => ({ ...prev, nutrition: { ...prev.nutrition, fat: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <label className="text-xs text-slate-500">Fat (g)</label>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Fiber"
                  value={formData.nutrition.fiber}
                  onChange={(e) => setFormData(prev => ({ ...prev, nutrition: { ...prev.nutrition, fiber: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <label className="text-xs text-slate-500">Fiber (g)</label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                    formData.tags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300"
            >
              Share Recipe
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

// Add Group Form Component
function AddGroupForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'support',
    privacy: 'public',
    tags: []
  });

  const [availableTags] = useState([
    'type-1', 'type-2', 'gestational', 'support', 'recipes', 'exercise', 
    'mental-health', 'teens', 'parents', 'seniors', 'newly-diagnosed'
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Group</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Group Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type 1 Support Circle"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="A supportive community for people with Type 1 diabetes to share experiences and tips..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="support">Support Group</option>
                  <option value="education">Educational</option>
                  <option value="social">Social</option>
                  <option value="fitness">Fitness & Exercise</option>
                  <option value="nutrition">Nutrition</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Privacy</label>
                <select
                  value={formData.privacy}
                  onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Create Group
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Add Story Form Component
function AddStoryForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'journey',
    tags: []
  });

  const [availableTags] = useState([
    'inspiration', 'milestone', 'diagnosis', 'lifestyle-change', 'family', 
    'work', 'travel', 'sports', 'mental-health', 'technology'
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Share Your Success Story</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Story Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="How I Achieved My A1C Goal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="journey">My Journey</option>
                <option value="milestone">Milestone Achievement</option>
                <option value="lifestyle">Lifestyle Change</option>
                <option value="technology">Technology Help</option>
                <option value="community">Community Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Story *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows="8"
                placeholder="Share your inspiring journey, challenges overcome, and advice for others..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      formData.tags.includes(tag)
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
              >
                Share Story
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Add Event Form Component
function AddEventForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'virtual',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    tags: []
  });

  const [availableTags] = useState([
    'workshop', 'support-meeting', 'cooking-class', 'exercise', 'webinar',
    'social', 'educational', 'fundraiser', 'awareness', 'family-friendly'
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Event</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Virtual Cooking Class: Healthy Desserts"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="4"
                placeholder="Join us for an interactive cooking session where we'll learn to make delicious, diabetes-friendly desserts..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="virtual">Virtual</option>
                  <option value="in-person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Max Attendees</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.type === 'virtual' ? 'Meeting Link/Platform' : 'Location'}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={formData.type === 'virtual' ? 'Zoom link will be provided' : 'Community Center, Main Street'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      formData.tags.includes(tag)
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
