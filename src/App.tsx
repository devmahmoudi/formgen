import Layout from "./components/layout";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Layout>
        <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                Welcome to{" "}
                <span className="text-primary">Shadcn UI</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                A beautifully crafted dark mode layout with responsive navigation.
              </p>
            </div>

            <div className="space-y-6">
              <p className="text-lg leading-relaxed">
                This is a sample greeting text centered on the page. The layout features a dark mode theme, 
                responsive navigation, and smooth transitions.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Get Started
                </button>
                <button className="px-6 py-3 border border-gray-700 rounded-lg font-medium hover:bg-accent transition-colors">
                  Learn More
                </button>
              </div>
            </div>

            <div className="pt-12 border-t border-gray-800">
              <p className="text-sm text-muted-foreground">
                Toggle the moon/sun icon in the navigation to switch between light and dark modes.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  );
}

export default App;