const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapPlaylistToModel } = require('../../utils');

class PlaylistService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: 'SELECT id, name, owner FROM playlists WHERE owner = $1',
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows.map(mapPlaylistToModel);
  }

  async deletePlaylist(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist-song-${nanoid(16)}`;

    const querySong = {
      text: 'SELECT id FROM songs WHERE id = $1',
      values: [songId],
    };

    const result = await this._pool.query(querySong);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal ditambahkan ke playlist. Id lagu tidak ditemukan');
    }

    const query = {
      text: 'INSERT INTO playlists_songs VALUES($1, $2, $3)',
      values: [id, playlistId, songId],
    };

    await this._pool.query(query);
  }

  async getSongsFromPlaylist(playlistId) {
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

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlists_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist song gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = PlaylistService;