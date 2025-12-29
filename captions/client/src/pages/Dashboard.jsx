import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Upload, Video, BookOpen, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic,
      title: 'Live Audio',
      description: 'Real-time captions from your microphone',
      path: '/live-audio',
    },
    {
      icon: Upload,
      title: 'Upload Audio',
      description: 'Transcribe pre-recorded audio files',
      path: '/upload-audio',
    },
    {
      icon: Video,
      title: 'Upload Video',
      description: 'Add captions to video files',
      path: '/upload-video',
    },
    {
      icon: BookOpen,
      title: 'History',
      description: 'View and manage transcriptions',
      path: '/history',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Customize your preferences',
      path: '/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 text-white">Caption Studio</h1>
          <p className="text-lg text-slate-400">Choose how you want to create captions. Real-time from audio or video, or transcribe files.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.path}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader>
                  <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-slate-800 mb-4">
                    <Icon className="h-7 w-7 text-slate-300" />
                  </div>
                  <CardTitle className="text-white text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                  <Button
                    onClick={() => navigate(feature.path)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium h-10 border border-slate-700"
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
