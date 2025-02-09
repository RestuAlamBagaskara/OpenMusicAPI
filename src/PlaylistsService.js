const { Pool } = require('pg');
 
class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylists(playlistId) {
    const querySongs = {
        text: `SELECT songs.id, songs.title, songs.performer FROM songs
               JOIN playlists_songs ON songs.id = playlists_songs.song_id
               WHERE playlists_songs.playlist_id = $1`,
        values: [playlistId],
      };
      const resultSongs = await this._pool.query(querySongs);
  
      const queryPlaylist = {
        text: `SELECT p.id, p.name, u.username FROM playlists p
              JOIN users u ON p.owner = u.id
              WHERE p.id = $1`, 
        values: [playlistId]
      };
      const resultPlaylist = await this._pool.query(queryPlaylist);
      if (!resultPlaylist.rows.length) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }
      
      return {
        ...resultPlaylist.rows[0],
        songs: resultSongs.rows,
      };
  }

}

module.exports = PlaylistsService;