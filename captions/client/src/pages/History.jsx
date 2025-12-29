import React from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const History = () => {
  const [captions, setCaptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/api/captions/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaptions(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.delete(`${API_BASE_URL}/api/captions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaptions((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error('Failed to delete caption', err);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2 text-white">Caption History</h1>
          <p className="text-slate-400">View and manage your saved captions</p>
        </div>

        {captions.length > 0 ? (
          <div className="space-y-4">
            {captions.map((caption) => (
              <Card
                key={caption._id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{caption.title}</h3>
                    <p className="text-sm text-slate-400">
                      {new Date(caption.createdAt).toLocaleString()} • <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">{caption.type?.toUpperCase()}</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all font-medium rounded-lg px-4 py-2"
                      onClick={() => deleteItem(caption._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-900 border border-slate-800">
            <CardContent className="p-16 text-center">
              <div className="text-5xl mb-6">📭</div>
              <p className="text-slate-400 font-medium text-lg">No caption history yet</p>
              <p className="text-slate-500 text-sm mt-2">Start by uploading audio or video files to create captions.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;
