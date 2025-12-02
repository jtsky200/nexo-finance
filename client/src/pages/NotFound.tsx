import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-status-error flex items-center justify-center">
              <AlertCircle className="h-8 w-8 status-error" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2">404</h1>

          <h2 className="text-xl font-semibold text-muted-foreground mb-4">
            Seite nicht gefunden
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Die gesuchte Seite existiert nicht.
            <br />
            Sie wurde möglicherweise verschoben oder gelöscht.
          </p>

          <Button
            onClick={handleGoHome}
            className="px-6"
          >
            <Home className="w-4 h-4 mr-2" />
            Zur Startseite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
