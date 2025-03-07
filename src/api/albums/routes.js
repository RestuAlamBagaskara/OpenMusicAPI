const routes = (handler) => [
	{
		method: "POST",
		path: "/albums",
		handler: handler.postAlbumHandler,
	},
	{
		method: "GET",
		path: "/albums",
		handler: handler.getAlbumsHandler,
	},
	{
		method: "GET",
		path: "/albums/{id}",
		handler: handler.getAlbumByIdHandler,
	},
	{
		method: "PUT",
		path: "/albums/{id}",
		handler: handler.putAlbumByIdHandler,
	},
	{
		method: "DELETE",
		path: "/albums/{id}",
		handler: handler.deleteAlbumByIdHandler,
	},
	{
		method: "POST",
		path: "/albums/{id}/covers",
		handler: handler.postCoverAlbumHandler,
		options: {
			payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        maxBytes: 512000,
      },
		},
	},
	{
		method: "GET",
		path: "/albums/{id}/likes",
		handler: handler.getUserAlbumLikesByIdHandler,
	},
	{
		method: "POST",
		path: "/albums/{id}/likes",
		handler: handler.postUserAlbumLikesHandler,
		options: {
			auth: "app_jwt",
		},
	},
	{
		method: "DELETE",
		path: "/albums/{id}/likes",
		handler: handler.deleteUserAlbumLikesHandler,
		options: {
			auth: "app_jwt",
		},
	},
];

module.exports = routes;
