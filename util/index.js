module.exports = {
	isValidUuid: uuid => !!uuid.match(/^[A-F\d]{8}-([A-F\d]{4}-){3}[A-F\d]{12}$/i)
};
