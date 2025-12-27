import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">About Us</h1>
            <p className="text-lg text-muted-foreground">
              Learn more about our company and what we do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="text-foreground/80">
                We're dedicated to creating beautiful, functional user interfaces with the latest 
                technologies like React, TypeScript, and Tailwind CSS.
              </p>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Our Vision</h2>
              <p className="text-foreground/80">
                To make web development more accessible and enjoyable through well-designed 
                components and comprehensive documentation.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Features</h2>
            <ul className="grid gap-3">
              {[
                "Dark/Light mode toggle",
                "Responsive design",
                "Component-based architecture",
                "TypeScript support",
                "Fast performance with Vite",
                "Accessible components"
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-8 border-t border-gray-800">
            <Link 
              to="/" 
              className="inline-flex items-center text-primary hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}