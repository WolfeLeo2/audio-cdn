const fs = require('fs').promises;
const path = require('path');
const { parseFile } = require('music-metadata');

// Configuration
const BEDROOMPOP_DIR = './bedroompop';
const API_DIR = './api';
const OUTPUT_FILE = path.join(API_DIR, 'bedroompop.json');

async function extractMetadata(filePath) {
    try {
        console.log(`Extracting metadata from: ${filePath}`);
        const metadata = await parseFile(filePath);
        
        // Extract album art if available
        let albumArt = null;
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            albumArt = {
                format: picture.format,
                data: picture.data.toString('base64'),
                description: picture.description || 'Album Art'
            };
        }
        
        return {
            title: metadata.common.title || null,
            artist: metadata.common.artist || null,
            album: metadata.common.album || null,
            year: metadata.common.year || null,
            genre: metadata.common.genre || null,
            duration: metadata.format.duration || null,
            bitrate: metadata.format.bitrate || null,
            sampleRate: metadata.format.sampleRate || null,
            albumArt: albumArt
        };
    } catch (error) {
        console.error(`Error extracting metadata from ${filePath}:`, error.message);
        return null;
    }
}

function generateId(artist, title) {
    return (artist + '-' + title)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

async function processAllTracks() {
    try {
        // Ensure API directory exists
        await fs.mkdir(API_DIR, { recursive: true });
        
        // Read all MP3 files from bedroompop directory
        const files = await fs.readdir(BEDROOMPOP_DIR);
        const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
        
        console.log(`Found ${mp3Files.length} MP3 files to process...`);
        
        const tracks = [];
        
        for (const filename of mp3Files) {
            const filePath = path.join(BEDROOMPOP_DIR, filename);
            
            // Extract artist and title from filename (fallback)
            const nameWithoutExt = filename.replace('.mp3', '');
            const parts = nameWithoutExt.split(' - ');
            const fallbackArtist = parts[0] || 'Unknown Artist';
            const fallbackTitle = parts[1] || nameWithoutExt;
            
            // Extract metadata
            const metadata = await extractMetadata(filePath);
            
            // Use metadata if available, otherwise use filename parsing
            const artist = metadata?.artist || fallbackArtist;
            const title = metadata?.title || fallbackTitle;
            const id = generateId(artist, title);
            
            const track = {
                id: id,
                artist: artist,
                title: title,
                filename: filename,
                url: `/bedroompop/${filename}`,
                metadata: metadata || {
                    title: title,
                    artist: artist,
                    album: null,
                    year: null,
                    genre: null,
                    duration: null,
                    bitrate: null,
                    sampleRate: null,
                    albumArt: null
                }
            };
            
            tracks.push(track);
            console.log(`✓ Processed: ${artist} - ${title}`);
        }
        
        // Sort tracks by artist, then by title
        tracks.sort((a, b) => {
            if (a.artist !== b.artist) {
                return a.artist.localeCompare(b.artist);
            }
            return a.title.localeCompare(b.title);
        });
        
        // Create the final JSON structure
        const jsonData = {
            genre: "bedroompop",
            total_tracks: tracks.length,
            base_url: "/bedroompop/",
            last_updated: new Date().toISOString(),
            tracks: tracks
        };
        
        // Write to file
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));
        
        console.log(`\n✅ Successfully processed ${tracks.length} tracks!`);
        console.log(`📁 Output saved to: ${OUTPUT_FILE}`);
        console.log(`📊 Total file size: ${(await fs.stat(OUTPUT_FILE)).size} bytes`);
        
        // Show summary
        const withAlbumArt = tracks.filter(t => t.metadata.albumArt).length;
        console.log(`🎨 Tracks with album art: ${withAlbumArt}/${tracks.length}`);
        
    } catch (error) {
        console.error('❌ Error processing tracks:', error);
    }
}

// Run the script
if (require.main === module) {
    console.log('🎵 Starting metadata extraction...\n');
    processAllTracks();
}

module.exports = { extractMetadata, processAllTracks };
