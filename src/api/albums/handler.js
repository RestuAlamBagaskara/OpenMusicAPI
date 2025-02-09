class AlbumsHandler {
	constructor(service, validator) {
		this._service = service;
		this._validator = validator;

		this.postAlbumHandler = this.postAlbumHandler.bind(this);
		this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
		this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
		this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
		this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
		this.postCoverAlbumHandler = this.postCoverAlbumHandler.bind(this);
		this.getUserAlbumLikesByIdHandler = this.getUserAlbumLikesByIdHandler.bind(this);
		this.postUserAlbumLikesHandler = this.postUserAlbumLikesHandler.bind(this);
		this.deleteUserAlbumLikesHandler = this.deleteUserAlbumLikesHandler.bind(this);
	}

	async postAlbumHandler(request, h) {
		this._validator.validateAlbumPayload(request.payload);
		const { name, year } = request.payload;

		const albumId = await this._service.addAlbum({ name, year });

		const response = h.response({
			status: "success",
			message: "Album berhasil ditambahkan",
			data: {
				albumId,
			},
		});
		response.code(201);
		return response;
	}

	async getAlbumsHandler() {
		const albums = await this._service.getAlbums();
		return {
			status: "success",
			data: {
				albums,
			},
		};
	}

	async getAlbumByIdHandler(request) {
		const { id } = request.params;
		const album = await this._service.getAlbumById(id);
		return {
			status: "success",
			data: {
				album,
			},
		};
	}

	async putAlbumByIdHandler(request) {
		this._validator.validateAlbumPayload(request.payload);
		const { id } = request.params;

		await this._service.editAlbumById(id, request.payload);

		return {
			status: "success",
			message: "Album berhasil diperbarui",
		};
	}

	async deleteAlbumByIdHandler(request) {
		const { id } = request.params;
		await this._service.deleteAlbumById(id);

		return {
			status: "success",
			message: "Album berhasil dihapus",
		};
	}

	async postCoverAlbumHandler(request, h) {
		const { cover } = request.payload;
		const { id } = request.params;
    
		this._validator.validateCoverAlbumImageHeaders(cover.hapi.headers);

		await this._service.getAlbumById(id);

		await this._service.updateCoverAlbum({ id, cover });

		const response = h.response({
			status: "success",
			message: "Sampul berhasil diunggah",
		});
		response.code(201);
		return response;
	}

	async getUserAlbumLikesByIdHandler(request, h) {
		const { id } = request.params;

		const albumLikeData = await this._service.getAlbumLikesByAlbumId(id);

		const response = h.response({
			status: "success",
			data: {
				likes: albumLikeData.data,
			},
		});
		if (albumLikeData.source === "cache") {
			response.header("X-Data-Source", "cache");
		}
		response.code(200);
		return response;
	}

	async postUserAlbumLikesHandler(request, h) {
		const { id: credentialId } = request.auth.credentials;
		const { id: albumId } = request.params;

		await this._service.getAlbumById(albumId);

		const likesId = await this._service.addAlbumLikes(albumId, credentialId);

		const response = h.response({
			status: "success",
			message: "Likes berhasil ditambahkan",
			data: {
				likesId,
			},
		});
		response.code(201);
		return response;
	}

	async deleteUserAlbumLikesHandler(request) {
		const { id: credentialId } = request.auth.credentials;
		const { id: albumId } = request.params;

		await this._service.deleteAlbumLikes(credentialId, albumId);

		return {
			status: "success",
			message: "Likes berhasil dihapus",
		};
	}
}

module.exports = AlbumsHandler;
