import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Get in Touch</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-accent">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">hello@example.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-accent">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">123 Web Street, Digital City</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Send a Message</h2>
              
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-background focus:border-primary focus:outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-background focus:border-primary focus:outline-none"
                    placeholder="Your email"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-background focus:border-primary focus:outline-none"
                    placeholder="Your message"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
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