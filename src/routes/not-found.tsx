import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Return Home
          </Link>
          <p className="text-sm text-muted-foreground">
            Or use the navigation menu to find what you're looking for.
          </p>
        </div>
      </div>
    </div>
  );
}