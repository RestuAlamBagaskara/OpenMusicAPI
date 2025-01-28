require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('./exceptions/ClientError');

// Songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongService');
const SongsValidator = require('./validator/songs');

// Albums
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumService');
const AlbumsValidator = require('./validator/albums');

// Users
const users = require('./api/users');
const UsersService = require('./services/postgres/UserService');
const UsersValidator = require('./validator/users');

// Authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationService');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

// Playlists
const playlists = require('./api/playlists');
const PlaylistService = require('./services/postgres/PlaylistService');
const PlaylistsValidator = require('./validator/playlists');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*']
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('app_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: songs,
      options: {
        service: new SongsService(),
        validator: SongsValidator,
      },
    },
    {
      plugin: albums,
      options: {
        service: new AlbumsService(),
        validator: AlbumsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: new UsersService(),
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService: new AuthenticationsService(),
        usersService: new UsersService(),
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: new PlaylistService(),
        validator: PlaylistsValidator
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;

    // penanganan client error secara internal.
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
}

init();