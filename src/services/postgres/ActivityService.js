const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class ActivityService {
  constructor() {
    this._pool = new Pool();
  }

  async addActivity({ playlistId, songId, action, userId }) {
    const id = `activity-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_activity VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, playlistId, userId, songId, action],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Activity gagal ditambahkan');
    }
  }
}

module.exports = ActivityService;