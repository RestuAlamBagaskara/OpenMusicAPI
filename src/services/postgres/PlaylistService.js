const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapPlaylistToModel } = require('../../utils');

class PlaylistService {
  constructor(collaborationsService, activityService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._activityService = activityService;
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

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
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
      text: `SELECT playlists.id, playlists.name, users.username AS owner
            FROM playlists
            LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id 
            LEFT JOIN users ON users.id = playlists.owner 
            WHERE playlists.owner = $1 OR collaborations.user_id = $1 
            GROUP BY (playlists.id, users.username)`,
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

  async addSongToPlaylist(playlistId, songId, userId) {
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
    await this._activityService.addActivity({playlistId, songId, action: 'add', userId});
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

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    const query = {
      text: 'DELETE FROM playlists_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist song gagal dihapus. Id tidak ditemukan');
    }

    await this._activityService.addActivity({ playlistId, songId, action: 'delete', userId});
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_activity.action, playlist_activity.created_at as time 
      FROM playlist_activity
      JOIN users ON users.id = playlist_activity.user_id
      JOIN songs ON songs.id = playlist_activity.song_id
      WHERE playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Activity tidak ditemukan');
    }

    return result.rows;
  }
}

module.exports = PlaylistService;