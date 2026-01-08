import React from 'react';
import { Palette } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { GlobalStyles, FONT_FAMILIES, FONT_SIZES } from './types';

interface GlobalStylesPanelProps {
  styles: GlobalStyles;
  onUpdate: (styles: GlobalStyles) => void;
}

export const GlobalStylesPanel: React.FC<GlobalStylesPanelProps> = ({ styles, onUpdate }) => {
  const updateStyle = (key: keyof GlobalStyles, value: string) => {
    onUpdate({ ...styles, [key]: value });
  };

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Global Styles
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-4 pb-4 space-y-6">
            {/* Layout Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Layout
              </h4>
              <div className="space-y-4">
                <div>
                  <Label>Content Width</Label>
                  <Select
                    value={styles.contentWidth}
                    onValueChange={(value) => updateStyle('contentWidth', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480px">Narrow (480px)</SelectItem>
                      <SelectItem value="540px">Small (540px)</SelectItem>
                      <SelectItem value="600px">Standard (600px)</SelectItem>
                      <SelectItem value="660px">Wide (660px)</SelectItem>
                      <SelectItem value="720px">Extra Wide (720px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Border Radius</Label>
                  <Select
                    value={styles.borderRadius}
                    onValueChange={(value) => updateStyle('borderRadius', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None</SelectItem>
                      <SelectItem value="4px">Small (4px)</SelectItem>
                      <SelectItem value="8px">Medium (8px)</SelectItem>
                      <SelectItem value="12px">Large (12px)</SelectItem>
                      <SelectItem value="16px">Extra Large (16px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Colors Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Colors
              </h4>
              <div className="space-y-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.backgroundColor}
                      onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styles.backgroundColor}
                      onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Email body background</p>
                </div>

                <div>
                  <Label>Content Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.contentBackgroundColor}
                      onChange={(e) => updateStyle('contentBackgroundColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styles.contentBackgroundColor}
                      onChange={(e) => updateStyle('contentBackgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Main content area background</p>
                </div>

                <div>
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.textColor}
                      onChange={(e) => updateStyle('textColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styles.textColor}
                      onChange={(e) => updateStyle('textColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Heading Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.headingColor}
                      onChange={(e) => updateStyle('headingColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styles.headingColor}
                      onChange={(e) => updateStyle('headingColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Link Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.linkColor}
                      onChange={(e) => updateStyle('linkColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styles.linkColor}
                      onChange={(e) => updateStyle('linkColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Typography Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Typography
              </h4>
              <div className="space-y-4">
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={styles.fontFamily}
                    onValueChange={(value) => updateStyle('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Base Font Size</Label>
                  <Select
                    value={styles.fontSize}
                    onValueChange={(value) => updateStyle('fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Presets Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Quick Presets
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdate({
                    ...styles,
                    backgroundColor: '#f4f4f4',
                    contentBackgroundColor: '#ffffff',
                    textColor: '#333333',
                    headingColor: '#222222',
                    linkColor: '#0066cc',
                  })}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded bg-[#f4f4f4] border" />
                    <div className="w-4 h-4 rounded bg-[#ffffff] border" />
                    <div className="w-4 h-4 rounded bg-[#0066cc]" />
                  </div>
                  <span className="text-xs font-medium">Light</span>
                </button>
                <button
                  onClick={() => onUpdate({
                    ...styles,
                    backgroundColor: '#1a1a2e',
                    contentBackgroundColor: '#16213e',
                    textColor: '#e0e0e0',
                    headingColor: '#ffffff',
                    linkColor: '#4fc3f7',
                  })}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded bg-[#1a1a2e]" />
                    <div className="w-4 h-4 rounded bg-[#16213e]" />
                    <div className="w-4 h-4 rounded bg-[#4fc3f7]" />
                  </div>
                  <span className="text-xs font-medium">Dark</span>
                </button>
                <button
                  onClick={() => onUpdate({
                    ...styles,
                    backgroundColor: '#fef3e2',
                    contentBackgroundColor: '#ffffff',
                    textColor: '#5d4037',
                    headingColor: '#3e2723',
                    linkColor: '#ff6f00',
                  })}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded bg-[#fef3e2]" />
                    <div className="w-4 h-4 rounded bg-[#ffffff] border" />
                    <div className="w-4 h-4 rounded bg-[#ff6f00]" />
                  </div>
                  <span className="text-xs font-medium">Warm</span>
                </button>
                <button
                  onClick={() => onUpdate({
                    ...styles,
                    backgroundColor: '#e8f5e9',
                    contentBackgroundColor: '#ffffff',
                    textColor: '#2e7d32',
                    headingColor: '#1b5e20',
                    linkColor: '#43a047',
                  })}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded bg-[#e8f5e9]" />
                    <div className="w-4 h-4 rounded bg-[#ffffff] border" />
                    <div className="w-4 h-4 rounded bg-[#43a047]" />
                  </div>
                  <span className="text-xs font-medium">Nature</span>
                </button>
                <button
                  onClick={() => onUpdate({
                    ...styles,
                    backgroundColor: '#fce4ec',
                    contentBackgroundColor: '#ffffff',
                    textColor: '#880e4f',
                    headingColor: '#ad1457',
                    linkColor: '#e91e63',
                  })}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded bg-[#fce4ec]" />
                    <div className="w-4 h-4 rounded bg-[#ffffff] border" />
                    <div className="w-4 h-4 rounded bg-[#e91e63]" />
                  </div>
                  <span className="text-xs font-medium">Pink</span>
                </button>
                <button
                  onClick={() => onUpdate({
                    ...styles,
                    backgroundColor: '#e3f2fd',
                    contentBackgroundColor: '#ffffff',
                    textColor: '#1565c0',
                    headingColor: '#0d47a1',
                    linkColor: '#2196f3',
                  })}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded bg-[#e3f2fd]" />
                    <div className="w-4 h-4 rounded bg-[#ffffff] border" />
                    <div className="w-4 h-4 rounded bg-[#2196f3]" />
                  </div>
                  <span className="text-xs font-medium">Ocean</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GlobalStylesPanel;
