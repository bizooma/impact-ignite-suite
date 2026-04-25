import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import causeioLogo from "@/assets/causeio-logo.png";

export const PublicNav = () => {
  const { user, loading } = useAuth();

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-12" />
        </Link>
        <div className="flex items-center space-x-3">
          {loading ? (
            <Button variant="outline" disabled size="sm">Loading...</Button>
          ) : user ? (
            <Link to="/dashboard">
              <Button variant="default" size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
