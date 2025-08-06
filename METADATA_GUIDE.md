# Audio CDN Metadata Extraction

This guide shows you how to extract metadata from your MP3 files and add it to your `bedroompop.json` API file.

## 🚀 Quick Start

### Method 1: Using Node.js (Recommended)

1. **Install Node.js** (if not already installed):
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use homebrew: `brew install node`

2. **Install dependencies**:
   ```bash
   cd /Users/app/audio-cdn
   npm install
   ```

3. **Run the metadata extraction**:
   ```bash
   # Basic metadata (recommended - smaller file size)
   node extract-metadata-basic.js
   
   # OR full metadata with embedded album art (larger file size)
   node extract-metadata.js
   ```

4. **Check the results**:
   - Your updated `api/bedroompop.json` will include metadata for all tracks
   - Album art can be extracted on-demand from the HTML interface

### Method 2: Manual Processing (Alternative)

If you prefer not to use Node.js, you can use tools like:

- **ExifTool**: Command-line metadata extraction
- **FFprobe**: Part of FFmpeg, extracts audio metadata
- **MediaInfo**: Cross-platform media information tool

## 📋 What Metadata Gets Extracted

The script extracts the following from each MP3 file:

### Basic Information
- **Title** - Song title from ID3 tags
- **Artist** - Artist name from ID3 tags  
- **Album** - Album name from ID3 tags
- **Year** - Release year
- **Genre** - Music genre(s)

### Technical Details
- **Duration** - Track length in seconds and formatted (mm:ss)
- **Bitrate** - Audio quality in kbps
- **Has Album Art** - Boolean indicating if embedded art exists

### Generated Fields
- **ID** - URL-friendly identifier
- **Filename** - Original MP3 filename
- **URL** - Direct CDN URL to the file

## 📁 Updated JSON Structure

After running the script, your `bedroompop.json` will look like this:

```json
{
  "genre": "bedroompop",
  "total_tracks": 31,
  "base_url": "/bedroompop/",
  "last_updated": "2025-08-06T10:30:00.000Z",
  "stats": {
    "total_tracks": 31,
    "tracks_with_album_art": 25,
    "unique_artists": 22,
    "unique_albums": 18
  },
  "tracks": [
    {
      "id": "abbey-glover-i-wish-you-liked-girls",
      "artist": "Abbey Glover",
      "title": "I Wish You Liked Girls",
      "album": "Bedroom Dreams",
      "year": 2023,
      "genre": "Bedroom Pop, Indie",
      "duration": 189,
      "duration_formatted": "3:09",
      "bitrate": 320,
      "has_album_art": true,
      "filename": "Abbey Glover - I Wish You Liked Girls.mp3",
      "url": "/bedroompop/Abbey Glover - I Wish You Liked Girls.mp3"
    }
    // ... more tracks
  ]
}
```

## 🎨 Using Metadata in Your Music App

### Fetch with Rich Metadata
```javascript
const response = await fetch('https://yourcdn.netlify.app/api/bedroompop.json');
const data = await response.json();

// Access rich metadata
data.tracks.forEach(track => {
    console.log(`${track.artist} - ${track.title}`);
    console.log(`Album: ${track.album || 'Unknown'}`);
    console.log(`Duration: ${track.duration_formatted}`);
    console.log(`Has Art: ${track.has_album_art}`);
});
```

### Filter and Search
```javascript
// Find tracks by artist
const clairoTracks = data.tracks.filter(track => 
    track.artist.toLowerCase().includes('clairo')
);

// Find tracks with album art
const tracksWithArt = data.tracks.filter(track => track.has_album_art);

// Search by duration (songs over 3 minutes)
const longTracks = data.tracks.filter(track => track.duration > 180);
```

## 🔧 Customization

### Modify the Script
You can edit `extract-metadata-basic.js` to:
- Add more metadata fields
- Change the sorting order
- Add custom processing logic
- Filter specific file types

### Add Album Art URLs
If you want to serve album art separately, you could:
1. Extract album art to separate image files
2. Upload them to your CDN
3. Add `album_art_url` field to each track

## ⚡ Performance Benefits

By pre-extracting metadata:
- **Faster loading** - No client-side processing needed
- **Better UX** - Instant access to track information
- **Smaller requests** - Only load album art when needed
- **Offline capable** - Metadata available without file access

## 🔄 Keeping Metadata Updated

Run the extraction script whenever you:
- Add new MP3 files
- Update existing files
- Want to refresh the metadata

You can automate this with:
- GitHub Actions (on file changes)
- Netlify build hooks
- Cron jobs
- Git pre-commit hooks

## 🎯 Next Steps

1. Run the metadata extraction script
2. Update your music app to use the rich metadata
3. Consider adding album art extraction if needed
4. Set up automated metadata updates for new files
