import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/context/ThemeContext';
import { Save, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const [fontSize, setFontSize] = useState([24]);
  const [captionColor, setCaptionColor] = useState('white');
  const [bgOpacity, setBgOpacity] = useState('medium');
  const [autoScroll, setAutoScroll] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const { theme, setTheme } = useTheme();

  const handleSave = () => {
    localStorage.setItem(
      'preferences',
      JSON.stringify({
        fontSize: fontSize[0],
        captionColor,
        bgOpacity,
        autoScroll,
        soundNotifications,
        theme,
      })
    );
    alert('Preferences saved!');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-6 w-6 text-slate-400" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-slate-400">Customize your caption preferences</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white text-lg font-semibold">Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-slate-300 text-sm font-medium">Font Size</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    min={16}
                    max={48}
                    step={2}
                    className="flex-1"
                  />
                  <div className="bg-slate-800 px-3 py-1.5 rounded-lg min-w-[60px] text-center">
                    <p className="font-medium text-slate-300">{fontSize[0]}px</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-slate-300 text-sm font-medium">Caption Color</Label>
                <Select value={captionColor} onValueChange={setCaptionColor}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="cyan">Cyan</SelectItem>
                    <SelectItem value="magenta">Magenta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-slate-300 text-sm font-medium">Background Opacity</Label>
                <Select value={bgOpacity} onValueChange={setBgOpacity}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low (25%)</SelectItem>
                    <SelectItem value="medium">Medium (50%)</SelectItem>
                    <SelectItem value="high">High (100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white text-lg font-semibold">Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between py-3">
                <Label className="text-slate-300 font-medium">Auto-scroll to latest caption</Label>
                <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-800">
                <Label className="text-slate-300 font-medium">Sound notifications</Label>
                <Switch
                  checked={soundNotifications}
                  onCheckedChange={setSoundNotifications}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-800">
                <Label className="text-slate-300 font-medium">Dark Mode</Label>
                <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
              </div>
            </CardContent>
          </Card>
          <Button
            onClick={handleSave}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold h-11 flex items-center justify-center gap-2 border border-slate-700"
          >
            <Save className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
