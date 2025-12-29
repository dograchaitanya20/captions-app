import Caption from '../models/Caption.js';

export const createCaption = async (req, res) => {
  try {
    const { title, text, segments, type, language } = req.body;
    
    const caption = new Caption({
      userId: req.userId,
      title: title || 'Untitled',
      text,
      segments,
      type: type || 'video',
      language: language || 'en',
    });

    await caption.save();
    res.json({ message: 'Caption saved successfully', caption });
  } catch (error) {
    console.error('Create caption error:', error);
    res.status(500).json({ message: 'Failed to save caption' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const captions = await Caption.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(captions);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to get history' });
  }
};

export const deleteCaption = async (req, res) => {
  try {
    const { id } = req.params;
    await Caption.findByIdAndDelete(id);
    res.json({ message: 'Caption deleted' });
  } catch (error) {
    console.error('Delete caption error:', error);
    res.status(500).json({ message: 'Failed to delete caption' });
  }
};

export const getCaption = async (req, res) => {
  try {
    const { id } = req.params;
    const caption = await Caption.findById(id);
    if (!caption) {
      return res.status(404).json({ message: 'Caption not found' });
    }
    res.json(caption);
  } catch (error) {
    console.error('Get caption error:', error);
    res.status(500).json({ message: 'Failed to get caption' });
  }
};

