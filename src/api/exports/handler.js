class ExportsHandler {
	constructor(service, playlistService, validator ) {
        this._service = service;
        this._validator = validator;
        this._playlistService = playlistService;

        this.postExportPlaylistsHandler = this.postExportPlaylistsHandler.bind(this);
    }

    async postExportPlaylistsHandler(request, h) {
        this._validator.validateExportPlaylistsPayload(request.payload);

        const { playlistId } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);
        const message = {
            playlistId,
            targetEmail: request.payload.targetEmail,
        };

        await this._service.sendMessage('export:playlists', JSON.stringify(message));

        const response = h.response({
            status: 'success',
            message: 'Permintaan Anda sedang kami proses',
        });
        response.code(201);
        return response;
    }
}

module.exports = ExportsHandler;