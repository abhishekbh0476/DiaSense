'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

export default function Community() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [stories, setStories] = useState([]);
  const [events, setEvents] = useState([]);

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

  const loadCommunityData = () => {
    // Mock data
    setGroups([
      {
        id: 1,
        name: 'Type 2 Warriors',
        description: 'Support group for Type 2 diabetes management',
        members: 1247,
        category: 'Support',
        image: '🛡️',
        isJoined: true,
        lastActivity: '2 hours ago',
        region: 'Global'
      },
      {
        id: 2,
        name: 'Healthy Cooking Club',
        description: 'Share diabetes-friendly recipes and cooking tips',
        members: 892,
        category: 'Nutrition',
        image: '👨‍🍳',
        isJoined: false,
        lastActivity: '1 hour ago',
        region: 'North America'
      },
      {
        id: 3,
        name: 'Walking Buddies',
        description: 'Local walking groups for exercise motivation',
        members: 456,
        category: 'Exercise',
        image: '🚶‍♀️',
        isJoined: true,
        lastActivity: '30 minutes ago',
        region: 'Local'
      }
    ]);

    setRecipes([
      {
        id: 1,
        title: 'Low-Carb Cauliflower Rice Bowl',
        author: 'Sarah M.',
        rating: 4.8,
        prepTime: '20 mins',
        servings: 4,
        carbs: '12g',
        image: '🥗',
        tags: ['Low-Carb', 'Vegetarian', 'Quick'],
        likes: 234,
        saves: 89
      },
      {
        id: 2,
        title: 'Grilled Salmon with Herbs',
        author: 'Mike R.',
        rating: 4.9,
        prepTime: '25 mins',
        servings: 2,
        carbs: '3g',
        image: '🐟',
        tags: ['Keto', 'High-Protein', 'Heart-Healthy'],
        likes: 189,
        saves: 156
      },
      {
        id: 3,
        title: 'Sugar-Free Berry Smoothie',
        author: 'Lisa K.',
        rating: 4.7,
        prepTime: '5 mins',
        servings: 1,
        carbs: '8g',
        image: '🥤',
        tags: ['Breakfast', 'Low-Sugar', 'Antioxidants'],
        likes: 167,
        saves: 203
      }
    ]);

    setStories([
      {
        id: 1,
        title: 'My Journey to Better Control',
        author: 'Jennifer L.',
        excerpt: 'How I reduced my HbA1c from 9.2% to 6.8% in 6 months...',
        readTime: '5 min read',
        likes: 342,
        comments: 28,
        category: 'Success Story',
        avatar: 'JL',
        timeAgo: '2 days ago'
      },
      {
        id: 2,
        title: 'Dealing with Diabetes Burnout',
        author: 'Robert C.',
        excerpt: 'Mental health is just as important as physical health when managing diabetes...',
        readTime: '7 min read',
        likes: 198,
        comments: 45,
        category: 'Mental Health',
        avatar: 'RC',
        timeAgo: '1 week ago'
      },
      {
        id: 3,
        title: 'Technology That Changed My Life',
        author: 'Maria S.',
        excerpt: 'How CGM and smart apps revolutionized my diabetes management...',
        readTime: '4 min read',
        likes: 276,
        comments: 19,
        category: 'Technology',
        avatar: 'MS',
        timeAgo: '3 days ago'
      }
    ]);

    setEvents([
      {
        id: 1,
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
        id: 2,
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
  };

  if (isLoading) {
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
                <button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Create Group
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <div
                    key={group.id}
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
                        <span>{group.members.toLocaleString()} members</span>
                        <span>•</span>
                        <span>{group.lastActivity}</span>
                      </div>
                    </div>
                    
                    <button
                      className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-300 ${
                        group.isJoined
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transform hover:scale-105'
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
                <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Share Recipe
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe, index) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-6xl">
                      {recipe.image}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-semibold text-slate-900 mb-2">{recipe.title}</h3>
                      <p className="text-slate-600 text-sm mb-3">by {recipe.author}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <span>⭐</span>
                          <span>{recipe.rating}</span>
                        </div>
                        <span>•</span>
                        <span>{recipe.prepTime}</span>
                        <span>•</span>
                        <span>{recipe.carbs} carbs</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recipe.tags.map((tag, idx) => (
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
                          <span>❤️ {recipe.likes}</span>
                          <span>📌 {recipe.saves}</span>
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
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Share Your Story
                </button>
              </div>
              
              <div className="space-y-6">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
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
                            <p className="text-slate-600 text-sm">by {story.author} • {story.timeAgo}</p>
                          </div>
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                            {story.category}
                          </span>
                        </div>
                        
                        <p className="text-slate-700 mb-4">{story.excerpt}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>❤️ {story.likes}</span>
                            <span>💬 {story.comments}</span>
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
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Create Event
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event, index) => (
                  <div
                    key={event.id}
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
                        <span>{event.date.toLocaleDateString()} at {event.time}</span>
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
    </Layout>
  );
}
