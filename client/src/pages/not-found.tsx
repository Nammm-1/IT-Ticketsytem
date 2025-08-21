import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="h-20 w-20" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bowie State University</h1>
            <p className="text-sm text-gray-600 mt-2">IT Support Ticketing System</p>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">404 Page Not Found</h2>
            <p className="text-sm text-gray-600">
              The page you're looking for doesn't exist.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
