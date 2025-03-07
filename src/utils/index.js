const mapAlbumToModel = ({
  id,
  name,
  year,
  created_at,
  updated_at
}) => ({
  id,
  name,
  year,
  createdAt: created_at,
  updatedAt: updated_at
})

const mapSongToModel = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
  created_at,
  updated_at
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id,
  createdAt: created_at,
  updatedAt: updated_at
})

const mapPlaylistToModel = ({
  id,
  name,
  owner,
  created_at,
  updated_at
}) => ({
  id,
  name,
  username: owner,
  createdAt: created_at,
  updatedAt: updated_at
})

module.exports = { mapAlbumToModel, mapSongToModel, mapPlaylistToModel };