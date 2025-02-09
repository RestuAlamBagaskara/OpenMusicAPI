const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapAlbumToModel, mapSongToModel } = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumService {
  constructor(storageService, cacheService) {
    this._pool = new Pool();
    this._storageService = storageService;
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    await this._cacheService.delete('albums');
    return result.rows[0].id;
  }

  async getAlbums() {
    try {
      const result = await this._cacheService.get('albums');
      return JSON.parse(result);
    }
    catch {
      const result = await this._pool.query('SELECT * FROM albums');
      const mappedResult = result.rows.map(mapAlbumToModel);
      await this._cacheService.set('albums', JSON.stringify(mappedResult));
      return mappedResult;
    }
  }

  async getAlbumById(id) {
    const queryAlbum = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const albumResult = await this._pool.query(queryAlbum);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const querySongs = {
      text: 'SELECT * FROM songs WHERE album_id = $1',
      values: [id],
    };
    const songsResult = await this._pool.query(querySongs);
    albumResult.rows[0].songs = songsResult.rows.map(mapSongToModel);

    return albumResult.rows[0];
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
    await this._cacheService.delete('albums');
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
    await this._cacheService.delete('albums');
  }

  async updateCoverAlbum({ id, cover }) {
    const coverUrl = await this._storageService.writeFile(
        cover,
        cover.hapi
    );
    
    const updatedAt = new Date().toISOString();
    const query = {
        text: 'UPDATE albums SET "coverUrl" = $1, updated_at = $2 WHERE id = $3 RETURNING id',
        values: [coverUrl, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
        throw new NotFoundError(
            'Gagal memperbarui album. Id tidak ditemukan'
        );
    }
    await this._cacheService.delete('albums');
  }

  async getAlbumLikesByAlbumId(id) {
      try {
          const albumLikesCount = await this._cacheService.get(`album_likes:${id}`);

          return {
              source: 'cache',
              data: JSON.parse(albumLikesCount),
          };
      } catch {
          const query = {
              text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
              values: [id],
          };
          const albumLikesCount = await this._pool.query(query);

          await this._cacheService.set(`album_likes:${id}`, albumLikesCount.rowCount);

          return {
              source: 'db',
              data: albumLikesCount.rowCount,
          };
      }
  }

  async addAlbumLikes(albumId, userId) {
      const id = `likes-${nanoid(16)}`;

      const queryCheck = {
          text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
          values: [userId, albumId],
      };
      const existLike = await this._pool.query(queryCheck);
      if (existLike.rowCount) {
          throw new InvariantError(
              'Likes gagal ditambahkan. Anda sudah menyukai album ini.'
          );
      }

      const query = {
          text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
          values: [id, userId, albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
          throw new InvariantError('Likes gagal ditambahkan');
      }

      await this._cacheService.delete(`album_likes:${albumId}`);

      return result.rows[0].id;
  }

  async deleteAlbumLikes(userId, albumId) {
      const query = {
          text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
          values: [userId, albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
          throw new InvariantError('Likes gagal dihapus');
      }

      await this._cacheService.delete(`album_likes:${albumId}`);
  }
}

module.exports = AlbumService;