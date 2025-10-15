/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["canadacustominvoice/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
