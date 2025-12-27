export default function HomePage() {
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

        <div className="pt-12 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">
            Navigate using the menu above or the buttons below. Toggle the moon/sun icon to switch themes.
          </p>
        </div>
      </div>
    </div>
  );
}