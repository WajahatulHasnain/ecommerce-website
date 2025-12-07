import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import SnapShopLogo from "../components/SnapShopLogo";

export default function Home() {
  const [msg, setMsg] = useState("Loading...");
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    axios.get("http://localhost:5000/")
      .then(res => setMsg(res.data))
      .catch(() => setMsg("Backend not reachable"));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search functionality - redirect to products with search query
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const featuredCategories = [
    {
      name: "Electronics",
      icon: "📱",
      description: "Latest gadgets and tech",
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "Fashion",
      icon: "👗",
      description: "Trendy clothing & accessories",
      color: "from-pink-400 to-rose-600"
    },
    {
      name: "Home & Garden",
      icon: "🏡",
      description: "Beautiful home essentials",
      color: "from-green-400 to-emerald-600"
    },
    {
      name: "Sports & Fitness",
      icon: "⚽",
      description: "Active lifestyle gear",
      color: "from-orange-400 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-etsy-orange via-warm-blue to-lavender opacity-10"></div>
        <div className="relative container-custom section-padding">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6 animate-fade-in">
              <SnapShopLogo className="h-20 w-20 lg:h-24 lg:w-24" textClassName="text-4xl lg:text-5xl" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-warm-gray-900 mb-6 animate-fade-in">
              Discover Something 
              <span className="text-gradient block mt-2">Special</span>
            </h1>
            <p className="text-xl lg:text-2xl text-warm-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Find unique, handpicked products from trusted sellers. Your perfect find is just a search away.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Input
                  variant="search"
                  placeholder="Search for anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={() => (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  className="pr-16"
                />
                <Button 
                  type="submit"
                  size="md"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link to="/select-role">
                <Button size="lg" className="min-w-48">
                  Get Started Today
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg" className="min-w-48">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-warm-cream py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-warm-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-warm-gray-600 max-w-2xl mx-auto">
              Explore our curated collections and find exactly what you're looking for
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category, index) => (
              <Card 
                key={index} 
                variant="primary" 
                hover 
                className="group cursor-pointer animate-fade-in-up"
                style={{'--stagger': index}}
              >
                <div className="text-center p-6">
                  <div className={`w-20 h-20 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 transition-transform duration-300`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-warm-gray-900 mb-2 group-hover:text-etsy-orange transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-warm-gray-600">{category.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-warm-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="dashboard" className="text-center p-8 hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-sage to-success rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-warm-gray-900 mb-3">Fast & Free Shipping</h3>
              <p className="text-warm-gray-600 leading-relaxed">Lightning-fast delivery on orders over $50. Track your package every step of the way.</p>
            </Card>
            
            <Card variant="dashboard" className="text-center p-8 hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-etsy-orange to-etsy-orange-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-warm-gray-900 mb-3">Premium Quality</h3>
              <p className="text-warm-gray-600 leading-relaxed">Hand-selected products from verified sellers. Quality guaranteed or your money back.</p>
            </Card>
            
            <Card variant="dashboard" className="text-center p-8 hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-warm-blue to-lavender rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.5a9.5 9.5 0 11-9.5 9.5 9.5-9.5 0 019.5-9.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-warm-gray-900 mb-3">24/7 Support</h3>
              <p className="text-warm-gray-600 leading-relaxed">Our friendly customer support team is always here to help you with any questions.</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-br from-etsy-orange via-etsy-orange-light to-warm-blue text-white py-20">
        <div className="container-custom text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl lg:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of happy customers who've found their perfect products with us
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-lg mx-auto">
            <Link to="/auth" className="flex-1">
              <Button 
                variant="secondary" 
                size="lg" 
                fullWidth
                className="bg-white text-etsy-orange hover:bg-warm-gray-50 hover:text-etsy-orange-dark font-semibold"
              >
                Shop as Customer
              </Button>
            </Link>
            <Link to="/auth" className="flex-1">
              <Button 
                variant="outline" 
                size="lg" 
                fullWidth
                className="border-white text-white hover:bg-white hover:text-etsy-orange font-semibold"
              >
                Admin Portal
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm opacity-80">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm opacity-80">Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1K+</div>
              <div className="text-sm opacity-80">Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">99%</div>
              <div className="text-sm opacity-80">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-warm-gray-50 py-4">
        <div className="container-custom text-center">
          <p className="text-sm text-warm-gray-600">
            Status: <span className={msg.includes("Backend not reachable") ? "text-error" : "text-sage"}>{msg}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
