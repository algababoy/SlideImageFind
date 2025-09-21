import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, ExternalLink } from "lucide-react";

export function CommercialUseInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="commercial-info-button">
          <Info className="h-4 w-4 mr-2" />
          Commercial Use Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commercial Use Rights for Selling Slideshows</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Good News: All our platforms allow commercial use in slideshows!
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              You can legally use images from all these sources in slideshows you sell, as long as you follow their specific requirements.
            </p>
          </div>

          <div className="grid gap-4">
            
            {/* Pixabay */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-100 text-blue-800">Pixabay</Badge>
                <Badge variant="outline" className="text-green-600">✓ Commercial OK</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>✅ Allowed:</strong> Use in slideshows, presentations, and commercial products</p>
                <p><strong>📝 Attribution:</strong> Not required, but appreciated</p>
                <p><strong>❌ Prohibited:</strong> Cannot sell raw images as standalone products (prints, stock photos)</p>
                <p className="text-muted-foreground">Perfect for slideshow content with no attribution requirements.</p>
              </div>
            </div>

            {/* Unsplash */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-orange-100 text-orange-800">Unsplash</Badge>
                <Badge variant="outline" className="text-green-600">✓ Commercial OK</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>✅ Allowed:</strong> Use in slideshows and commercial products</p>
                <p><strong>📝 Attribution:</strong> Not legally required, but API guidelines recommend crediting photographer</p>
                <p><strong>❌ Prohibited:</strong> Cannot sell unmodified images as prints or standalone products</p>
                <p className="text-muted-foreground">Great for professional slideshow content. Consider crediting the photographer when possible.</p>
              </div>
            </div>

            {/* Pexels */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-green-100 text-green-800">Pexels</Badge>
                <Badge variant="outline" className="text-green-600">✓ Most Permissive</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>✅ Allowed:</strong> Completely free for commercial use in any context</p>
                <p><strong>📝 Attribution:</strong> Not required</p>
                <p><strong>❌ Prohibited:</strong> Don't use identifiable people negatively</p>
                <p className="text-muted-foreground">Most flexible license - ideal for commercial slideshow products.</p>
              </div>
            </div>

            {/* Wikimedia Commons */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-100 text-purple-800">Wikimedia Commons</Badge>
                <Badge variant="outline" className="text-yellow-600">Varies by License</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>CC0 (Public Domain):</strong> No restrictions, no attribution required</p>
                <p><strong>CC BY:</strong> Attribution required - include title, author, license</p>
                <p><strong>CC BY-SA:</strong> Attribution required + share-alike for modifications</p>
                <p className="text-muted-foreground">Check each image's specific license. CC0 is most flexible for commercial use.</p>
              </div>
            </div>

            {/* OpenClipart */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gray-100 text-gray-800">OpenClipart</Badge>
                <Badge variant="outline" className="text-green-600">✓ Public Domain</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>✅ Allowed:</strong> Completely free for any use including commercial</p>
                <p><strong>📝 Attribution:</strong> Not required</p>
                <p><strong>❌ Prohibited:</strong> None - public domain</p>
                <p className="text-muted-foreground">SVG clipart with no restrictions. Perfect for presentations.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 Best Practices for Slideshow Products
            </h3>
            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
              <li>• Always add your own creative content, design, and value to the slideshows</li>
              <li>• Include attribution when required or recommended (builds good relationships)</li>
              <li>• Use the hot links we provide to easily access license details</li>
              <li>• Copy attribution text directly from our application for accuracy</li>
              <li>• Focus on creating unique, valuable presentations rather than just using raw images</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ What You Cannot Do
            </h3>
            <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
              <li>• Sell the raw, unmodified images as standalone products (prints, stock photos)</li>
              <li>• Create competing stock photo services using these images</li>
              <li>• Remove watermarks or modify attribution where required</li>
              <li>• Use images with recognizable people in offensive contexts</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This guide provides general information about platform licenses. 
              For specific legal questions, consult with a legal professional. Always check the most current 
              license terms on each platform.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}