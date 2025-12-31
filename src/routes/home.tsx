import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import {
  LogIn,
  FileText,
  LayoutDashboard,
  ArrowRight,
  Home,
} from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Simple reload to update state
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Welcome to <span className="text-primary">Shadcn UI</span>
            </h1>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Show ONLY when NOT logged in */}
        {!session && (
          <>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                Welcome to <span className="text-primary">Shadcn UI</span>
              </h1>

              <p className="text-xl text-muted-foreground">
                A beautifully crafted dark mode layout with responsive
                navigation and routing.
              </p>
              <p className="text-lg leading-relaxed">
                This is the home page with centered greeting text. The layout
                features a dark mode theme, responsive navigation, smooth
                transitions, and now supports multiple pages with React Router.
              </p>
            </div>

            {/* Action Buttons - Only show when NOT logged in */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <a
                href="/auth/login"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex flex-row align-middle justify-center"
              >
                <LogIn className="mr-2 h-4 w-4 mt-1" />
                <span>Login</span>
              </a>
              <a
                href="/about"
                className="px-6 py-3 border border-gray-700 rounded-lg font-medium hover:bg-accent transition-colors"
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
          </>
        )}

        {/* Show Welcome Back card when user IS logged in */}
        {session && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center text-3xl">
                <LayoutDashboard className="h-7 w-7" />
                Welcome Back!
              </CardTitle>
              <CardDescription className="text-lg">
                You're logged in as:{" "}
                <span className="font-semibold">{session.user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-muted-foreground text-center">
                  Quick Access
                </h3>
                <div className="space-y-3">
                  <Link to="/form">
                    <Button
                      className="w-full justify-between group p-6"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">
                            Form Builder & Management
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Create, edit, and manage your forms and responses
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-12 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">
            {session
              ? "Manage your account and access all features"
              : "Navigate using the menu above or the buttons below. Toggle the moon/sun icon to switch themes."}
          </p>
        </div>
      </div>
    </div>
  );
}
