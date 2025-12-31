import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { LogIn, FileText, LayoutDashboard, ArrowRight } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Home() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginRedirect = () => {
    navigate("/auth/login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Welcome to{" "}
              <span className="text-primary">Shadcn UI</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              A beautifully crafted dark mode layout with responsive navigation and routing.
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Checking authentication status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Welcome to{" "}
            <span className="text-primary">Shadcn UI</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A beautifully crafted dark mode layout with responsive navigation and routing.
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-lg leading-relaxed">
            This is the home page with centered greeting text. The layout features a dark mode theme, 
            responsive navigation, smooth transitions, and now supports multiple pages with React Router.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/about" 
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              About Us
            </a>
            <a 
              href="/services" 
              className="px-6 py-3 border border-gray-700 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Our Services
            </a>
          </div>
        </div>

        {/* Auth Status Section */}
        <div className="pt-8">
          {session ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center">
                  <LayoutDashboard className="h-5 w-5" />
                  Welcome Back!
                </CardTitle>
                <CardDescription>
                  You're logged in as: {session.user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">Quick Access</h3>
                  <div className="space-y-2">
                    <Link to="/form">
                      <Button className="w-full justify-between group" variant="outline">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Form Builder & Management</span>
                        </div>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLogout} variant="outline" className="flex-1">
                    Sign Out
                  </Button>
                  <Link to="/dashboard" className="flex-1">
                    <Button className="w-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center">
                  <LogIn className="h-5 w-5" />
                  Get Started
                </CardTitle>
                <CardDescription>
                  Sign in to access all features and manage your forms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To create forms, manage responses, and access the full feature set, please sign in to your account.
                </p>
                <Button onClick={handleLoginRedirect} className="w-full" size="lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In / Create Account
                </Button>
                <div className="text-xs text-muted-foreground">
                  <p>Don't have an account? You can create one during sign in.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="pt-12 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">
            Navigate using the menu above or the buttons below. Toggle the moon/sun icon to switch themes.
          </p>
        </div>
      </div>
    </div>
  );
}