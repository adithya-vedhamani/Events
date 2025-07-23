'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  bookings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  spaces: {
    total: number;
    active: number;
    inactive: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    repeatCustomers: number;
  };
  topSpaces: Array<{
    id: string;
    name: string;
    revenue: number;
    bookings: number;
    rating: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  bookingTrends: Array<{
    date: string;
    bookings: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/brand-owner?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No data available</h2>
          <p className="text-gray-600">Analytics data will appear here once you have bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your business performance and insights</p>
          </div>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{analytics.revenue.total.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {analytics.revenue.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.bookings.total}</p>
                <div className="flex items-center mt-2">
                  {analytics.bookings.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.bookings.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.bookings.growth >= 0 ? '+' : ''}{analytics.bookings.growth}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Spaces</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.spaces.active}</p>
                <p className="text-sm text-gray-500 mt-2">of {analytics.spaces.total} total spaces</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.customers.total}</p>
                <p className="text-sm text-gray-500 mt-2">{analytics.customers.newThisMonth} new this month</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analytics.monthlyRevenue.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{
                      height: `${(item.revenue / Math.max(...analytics.monthlyRevenue.map(r => r.revenue))) * 200}px`,
                    }}
                  ></div>
                  <p className="text-xs text-gray-500 mt-2">{item.month}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Booking Trends</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analytics.bookingTrends.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-600 rounded-t"
                    style={{
                      height: `${(item.bookings / Math.max(...analytics.bookingTrends.map(b => b.bookings))) * 200}px`,
                    }}
                  ></div>
                  <p className="text-xs text-gray-500 mt-2">{new Date(item.date).getDate()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Spaces */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Top Performing Spaces</h3>
              <Star className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Space Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topSpaces.map((space) => (
                  <tr key={space.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{space.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{space.revenue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{space.bookings}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{space.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(space.revenue / Math.max(...analytics.topSpaces.map(s => s.revenue))) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Customer Retention</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round((analytics.customers.repeatCustomers / analytics.customers.total) * 100)}%
              </div>
              <p className="text-sm text-gray-500 mt-2">Repeat customers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Average Rating</h3>
              <Star className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">4.6</div>
              <p className="text-sm text-gray-500 mt-2">Out of 5 stars</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Space Utilization</h3>
              <Target className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round((analytics.spaces.active / analytics.spaces.total) * 100)}%
              </div>
              <p className="text-sm text-gray-500 mt-2">Active spaces</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 