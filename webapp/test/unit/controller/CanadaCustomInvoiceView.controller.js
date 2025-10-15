/*global QUnit*/

sap.ui.define([
	"canadacustominvoice/controller/CanadaCustomInvoiceView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CanadaCustomInvoiceView Controller");

	QUnit.test("I should test the CanadaCustomInvoiceView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
