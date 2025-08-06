const fs = require('fs').promises;
const path = require('path');
const { parseFile } = require('music-metadata');

// Configuration
const BEDROOMPOP_DIR = './bedroompop';
const API_DIR = './api';
const OUTPUT_FILE = path.join(API_DIR, 'bedroompop.json');

async function extractBasicMetadata(filePath) {
    try {
        console.log(`Extracting metadata from: ${filePath}`);
        const metadata = await parseFile(filePath);
        
        return {
            title: metadata.common.title || null,
            artist: metadata.common.artist || null,
            album: metadata.common.album || null,
            year: metadata.common.year || null,
            genre: metadata.common.genre ? metadata.common.genre.join(', ') : null,
            duration: metadata.format.duration ? Math.round(metadata.format.duration) : null,
            bitrate: metadata.format.bitrate || null,
            hasAlbumArt: !!(metadata.common.picture && metadata.common.picture.length > 0)
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

function formatDuration(seconds) {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            const metadata = await extractBasicMetadata(filePath);
            
            // Use metadata if available, otherwise use filename parsing
            const artist = metadata?.artist || fallbackArtist;
            const title = metadata?.title || fallbackTitle;
            const id = generateId(artist, title);
            
            const track = {
                id: id,
                artist: artist,
                title: title,
                album: metadata?.album || null,
                year: metadata?.year || null,
                genre: metadata?.genre || null,
                duration: metadata?.duration || null,
                duration_formatted: formatDuration(metadata?.duration),
                bitrate: metadata?.bitrate || null,
                has_album_art: metadata?.hasAlbumArt || false,
                filename: filename,
                url: `/bedroompop/${filename}`
            };
            
            tracks.push(track);
            console.log(`✓ Processed: ${artist} - ${title}${metadata?.album ? ` (${metadata.album})` : ''}`);
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
            stats: {
                total_tracks: tracks.length,
                tracks_with_album_art: tracks.filter(t => t.has_album_art).length,
                unique_artists: [...new Set(tracks.map(t => t.artist))].length,
                unique_albums: [...new Set(tracks.map(t => t.album).filter(Boolean))].length
            },
            tracks: tracks
        };
        
        // Write to file
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));
        
        console.log(`\n✅ Successfully processed ${tracks.length} tracks!`);
        console.log(`📁 Output saved to: ${OUTPUT_FILE}`);
        console.log(`📊 Total file size: ${(await fs.stat(OUTPUT_FILE)).size} bytes`);
        
        // Show summary
        const withAlbumArt = tracks.filter(t => t.has_album_art).length;
        const uniqueArtists = [...new Set(tracks.map(t => t.artist))].length;
        const uniqueAlbums = [...new Set(tracks.map(t => t.album).filter(Boolean))].length;
        
        console.log(`\n📈 Collection Summary:`);
        console.log(`🎨 Tracks with album art: ${withAlbumArt}/${tracks.length}`);
        console.log(`👤 Unique artists: ${uniqueArtists}`);
        console.log(`💿 Unique albums: ${uniqueAlbums}`);
        
    } catch (error) {
        console.error('❌ Error processing tracks:', error);
    }
}

// Run the script
if (require.main === module) {
    console.log('🎵 Starting metadata extraction...\n');
    processAllTracks();
}

module.exports = { extractBasicMetadata, processAllTracks };
