import { Link } from "react-router-dom";

const services = [
  {
    title: "UI/UX Design",
    description: "Creating beautiful and user-friendly interfaces that provide excellent user experiences.",
    icon: "🎨"
  },
  {
    title: "Frontend Development",
    description: "Building responsive web applications using React, TypeScript, and modern frameworks.",
    icon: "💻"
  },
  {
    title: "Component Libraries",
    description: "Developing reusable component libraries for consistent and efficient development.",
    icon: "🧩"
  },
  {
    title: "Performance Optimization",
    description: "Improving application performance and loading times for better user engagement.",
    icon: "⚡"
  }
];

export default function ServicesPage() {
  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Our Services</h1>
            <p className="text-lg text-muted-foreground">
              Explore the range of services we offer to help you build amazing web applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border border-gray-800 bg-card hover:border-primary/50 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{service.icon}</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                    <p className="text-foreground/80">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-gray-800 flex justify-between items-center">
            <Link 
              to="/" 
              className="inline-flex items-center text-primary hover:underline"
            >
              ← Back to Home
            </Link>
            <Link 
              to="/contact" 
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}