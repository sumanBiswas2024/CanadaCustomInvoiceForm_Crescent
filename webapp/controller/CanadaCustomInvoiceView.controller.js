// sap.ui.define([
//     "sap/ui/core/mvc/Controller"
// ], (Controller) => {
//     "use strict";

//     return Controller.extend("canadacustominvoice.controller.CanadaCustomInvoiceView", {
//         onInit() {
//         }
//     });
// });


sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/Label',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/comp/smartvariants/PersonalizableInfo',
    'sap/m/MessageBox',
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast",
    "sap/m/PDFViewer",
    "sap/m/Dialog",
    "sap/m/BusyIndicator",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/ui/core/Fragment"
], (Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo, MessageBox, exportLibrary, Spreadsheet, MessageToast, CustModels, PDFViewer, Dialog, BusyIndicator, VBox, Text, Fragment) => {
    "use strict";

    return Controller.extend("canadacustominvoice.controller.CanadaCustomInvoiceView", {
        onInit() {

            //this.getView().setModel(this.oModel);
            this.oModel = new JSONModel();

            this._busyDialog = new sap.m.Dialog({
                showHeader: false,
                type: "Message",
                content: new sap.m.VBox({
                    justifyContent: "Center",
                    alignItems: "Center",
                    items: [
                        new sap.m.BusyIndicator({ size: "2rem" }), // Spinner
                        new sap.m.Text({ text: "Generating PDFs, please wait...", textAlign: "Center" }).addStyleClass("sapUiSmallMarginTop")
                    ]
                }),
                contentWidth: "250px",
                contentHeight: "120px",
                verticalScrolling: false,
                horizontalScrolling: false
            });

            this._pdfViewer = new PDFViewer({
                isTrustedSource: true
            });
            this.getView().addDependent(this._pdfViewer);

            sap.ui.getCore().setModel(this.oModel, "UIDataModel");
            sap.ui.getCore().getModel("UIDataModel").setProperty("/Visible", true);
            sap.ui.getCore().getModel("UIDataModel").setProperty("/Invisible", false);
            //this.applyData = this.applyData.bind(this);
            //this.fetchData = this.fetchData.bind(this);
            //this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

            this.oSmartVariantManagement = this.getView().byId("svm");
            this.oExpandedLabel = this.getView().byId("expandedLabel");
            this.oSnappedLabel = this.getView().byId("snappedLabel");
            this.oFilterBar = this.getView().byId("filterbar");
            this.oTable = this.getView().byId("table");

            this.oFilterBar.registerFetchData(this.fetchData);
            this.oFilterBar.registerApplyData(this.applyData);
            this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

            var oPersInfo = new PersonalizableInfo({
                type: "filterBar",
                keyName: "persistencyKey",
                dataSource: "",
                control: this.oFilterBar
            });
            this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
            this.oSmartVariantManagement.initialise(function () { }, this.oFilterBar);

            // this.getDeliveryDocumentF4Data();
            this.getBillingDocumentF4Data();
            // Set initial placeholder
            this._setPdfPlaceholder();

        },
        _setPdfPlaceholder: function () {
            this.byId("pdfIframeContainer").setContent(`
                <div style="
                    height: calc(100vh - 255px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    color: #666;
                    font-size: 1.2rem;
                    font-family: Arial, sans-serif;
                    text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📄</div>
                    <h3 style="margin: 0 0 10px 0; color:#696363;">No PDF Available</h3>
                    <p> Generated PDF will appear here.<br>
                    Please select a Billing Document and click <b>Go</b>.</p>
                </div>
            `);
        },

        // getBillingDocumentF4Data: function () {

        //     var that = this;
        //     var oModel = this.getOwnerComponent().getModel();
        //     var pUrl = "/billDoc"
        //     oModel.read(pUrl,
        //         {
        //             urlParameters: {
        //                 "$top": 5000 // or any large number
        //             },
        //             success: function (response) {
        //                 var oData = response.results;
        //                 console.log(oData);

        //                 var oBillingDocModel = that.getOwnerComponent().getModel("billingDocModel");
        //                 oBillingDocModel.setData(oData);

        //                 sap.ui.core.BusyIndicator.hide();
        //             },
        //             error: function (error) {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 console.log(error);

        //                 var errorObject = JSON.parse(error.responseText);
        //                 sap.m.MessageBox.warning(errorObject.error.message.value);

        //             }
        //         });
        // },

        getBillingDocumentF4Data: async function () {
            sap.ui.core.BusyIndicator.show(0);
            try {
                const oModel = this.getOwnerComponent().getModel(); // V4 model
                const oListBinding = oModel.bindList("/billDoc");   // EntitySet path

                // Read data (supports $top)
                const aContexts = await oListBinding.requestContexts(0, 100000); // skip=0, top=5000

                // Extract data from contexts
                const aData = aContexts.map(oContext => oContext.getObject());
                console.log(aData);

                // Set to local JSON model
                const oBillingDocModel = this.getOwnerComponent().getModel("billingDocModel");
                oBillingDocModel.setData(aData);

            } catch (error) {
                console.error(error);
                let sMessage = "Error while fetching billing document data.";

                if (error && error.message) {
                    sMessage = error.message;
                } else if (error && error.error && error.error.message) {
                    sMessage = error.error.message;
                }

                sap.m.MessageBox.warning(sMessage);
            } finally {
                sap.ui.core.BusyIndicator.hide();
            }
        },

        onDialogEquipmentNumber: function () {
            new CustModels();
        },
        onExit: function () {
            this.oModel = null;
            this.oSmartVariantManagement = null;
            this.oExpandedLabel = null;
            this.oSnappedLabel = null;
            this.oFilterBar = null;
            this.oTable = null;
        },
        onPressText: function () {
            this.oTable.removeSelections(true);
            var oModel = sap.ui.getCore().getModel("UIDataModel");
            oModel.setProperty('/Visible', !oModel.getProperty('/Visible'));
            oModel.setProperty('/Invisible', !oModel.getProperty('/Invisible'));
        },
        // onOpenDeliveryDocumentDialog: function () {
        //     var oView = this.getView();
        //     if (!oView.byId("idDeliveryDocumentDialog")) {
        //         sap.ui.core.Fragment.load({
        //             id: oView.getId(),
        //             name: "com.crescent.app.barcodeform.Fragment.DeliveryDocument",
        //             controller: this
        //         }).then(function (oDialog) {
        //             oView.addDependent(oDialog)
        //             oDialog.open();
        //         })
        //     } else {
        //         oView.byId("idDeliveryDocumentDialog").open();
        //     }
        // },
        onOpenBillingDocDialog: function () {
            var oView = this.getView();
            if (!oView.byId("idBillingDocDialog")) {
                sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "canadacustominvoice.Fragment.BillingDoc",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog)
                    oDialog.open();
                })
            } else {
                oView.byId("idBillingDocDialog").open();
            }
        },
        onCloseBillingDocDialog: function () {
            this.byId("idBillingDocDialog").close();
        },
        onSelectBillingDoc: function () {
            var oGlobalModel = this.getOwnerComponent().getModel("globalModel");
            var oList = this.byId("idBillingDocList");
            var aSelectedItems = oList.getSelectedItems();
            var aSelectedValues = [];
            var aSelectedID = [];

            // Extract selected Material Group 
            aSelectedItems.forEach(function (oItem) {
                aSelectedID.push(oItem.getTitle());
                // aSelectedValues.push(oItem.getDescription());
            });

            // Show selected values in Input field
            var sValue = aSelectedID.join(", ");
            this.byId("idBillingDocInput").setValue(sValue);

            // oGlobalModel.setProperty("/selectedMaterialId", aSelectedID);   

            var sDocumentValues = this.byId("idBillingDocInput").getValue(); // Comma-separated values
            var aDocumentArray = sDocumentValues.split(", "); // Convert to array
            oGlobalModel.setProperty("/selectedDocumentId", aDocumentArray);

            var oSearchField = this.byId("idBillingDocSearchField");  // Remove Search Field
            oSearchField.setValue("");
            var oBinding = oList.getBinding("items");
            if (oBinding) {
                oBinding.filter([]); // Remove filters
            }

            oList.removeSelections(true); // Removes all List selections

            // var oSelectAllCheckBox = this.byId("selectAllCheckBoxDeliveryDocument");
            // if (oSelectAllCheckBox) {
            //     oSelectAllCheckBox.setSelected(false);
            // }

            // Close the dialog
            this.byId("idBillingDocDialog").close();
        },
        onBillingDocClear: function (oEvent) {
            var sValue = oEvent.getParameter("value"); // Get the input value
            var oList = this.byId("idBillingDocList"); // Get the list
            var oGlobalModel = this.getOwnerComponent().getModel("globalModel");

            if (!sValue) {    // If input is empty, clear selection
                oList.removeSelections(true); // Deselect all items
                oGlobalModel.setProperty("/selectedDocumentId", "");
                // oGlobalModel.setProperty("/SelectedDocumentName", "");
            }
        },
        onSearchBillingDoc: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue"); // Get search input
            var oList = this.byId("idBillingDocList");
            if (!oList) {
                console.error("List not found!");
                return;
            }

            var oBinding = oList.getBinding("items"); // Get binding of the List
            if (!oBinding) {
                console.error("List binding not found!");
                return;
            }

            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                var oFilter1 = new sap.ui.model.Filter("billingDoc", sap.ui.model.FilterOperator.Contains, sQuery);
                // var oFilter2 = new sap.ui.model.Filter("PurchaseOrderByCustomer", sap.ui.model.FilterOperator.Contains, sQuery);
                aFilters.push(new sap.ui.model.Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filters to the list binding
            oBinding.filter(aFilters);
        },
        onSearch: function () {
            var that = this;
            this.getDataFromBackend2();
            // this._loadPdfMakeLibrary();
        },
        _loadPdfMakeLibrary: function (aHdrData, aItmData) {

            var that = this;

            // ✅ Show BusyIndicator immediately
            sap.ui.core.BusyIndicator.show(0);

            // Get paths for local libraries
            var sPath = jQuery.sap.getModulePath("canadacustominvoice", "/libs/pdfmake/pdfmake.min.js");
            var vfsPath = jQuery.sap.getModulePath("canadacustominvoice", "/libs/pdfmake/vfs_fonts.js");
            var jsBarcodePath = jQuery.sap.getModulePath("canadacustominvoice", "/libs/jsbarcode/JsBarcode.all.min.js");

            // ✅ Load pdfMake first
            jQuery.sap.includeScript(sPath, "pdfMakeScript",
                function () {
                    console.log("✅ pdfMake loaded successfully.");

                    // ✅ Now load vfs_fonts
                    jQuery.sap.includeScript(vfsPath, "vfsFontsScript",
                        function () {
                            console.log("✅ vfs_fonts loaded successfully.");

                            // ✅ Finally load JsBarcode
                            jQuery.sap.includeScript(jsBarcodePath, "jsBarcodeScript",
                                function () {
                                    console.log("✅ JsBarcode loaded successfully.");

                                    // ✅ Hide BusyIndicator
                                    sap.ui.core.BusyIndicator.hide();

                                    // ✅ Check if libraries are loaded
                                    if (typeof pdfMake !== "undefined" && typeof JsBarcode !== "undefined") {

                                        that.generatePdfCanadaCustom(aHdrData, aItmData);
                                        // that.generatePdfCanadaCustom();
                                    } else {
                                        console.error(" pdfMake or JsBarcode not defined after loading.");
                                        sap.m.MessageBox.error("Required libraries not loaded. Please try again.");
                                    }
                                },
                                function () {
                                    console.error(" Error loading JsBarcode.");
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.error("Failed to load JsBarcode library.");
                                }
                            );

                        },
                        function () {
                            console.error(" Error loading vfs_fonts.");
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageBox.error("Failed to load vfs_fonts library.");
                        }
                    );

                },
                function () {
                    console.error(" Error loading pdfMake.");
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("Failed to load pdfMake library.");
                }
            );
        },
        convertImgToBase64: function (url, callback) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var dataURL = canvas.toDataURL('image/png');
                callback(dataURL);
            };
            img.onerror = function () {
                console.error("Failed to load image:", url);
            };
            img.src = url;
        },
        generateBarcode: function (text, callback) {
            var canvas = document.createElement("canvas");
            JsBarcode(canvas, text, {
                format: "CODE128",
                lineColor: "#000",
                width: 3,
                height: 60,
                displayValue: false // no text under barcode
            });
            var base64 = canvas.toDataURL("image/png");
            // console.log(base64);
            callback(base64);
        },
        _validateInputFields: function () {
            var inputfromDocument = this.byId("idBillingDocInput");

            var isValid = true;
            var message = '';

            if (!inputfromDocument.getValue()) {
                inputfromDocument.setValueState(sap.ui.core.ValueState.Error);
                isValid = false;
                message += 'Billing Document No , ';
            } else {
                inputfromDocument.setValueState(sap.ui.core.ValueState.None);
            }


            if (!isValid) {
                // Remove the last comma and space from the message
                message = message.slice(0, -2);
                sap.m.MessageBox.error("Please fill up the following fields: " + message);
                return false;
            }

            return true;
        },
        getDataFromBackend2: async function () {
            if (!this._validateInputFields()) {
                // Stop if validation fails
                return;
            }

            var that = this;
            var oGlobalModel = this.getOwnerComponent().getModel("globalModel");
            var oServiceModel = this.getOwnerComponent().getModel(); // OData V4 model

            var aDocumentId = oGlobalModel.getProperty("/selectedDocumentId") || [];
            var aFilters = [];

            if (aDocumentId.length > 0) {
                var aDocumentFilters = aDocumentId.map(function (docId) {
                    return new sap.ui.model.Filter("Commercial_no", sap.ui.model.FilterOperator.EQ, docId);
                });

                aFilters.push(new sap.ui.model.Filter({
                    filters: aDocumentFilters,
                    and: false
                }));
            }

            var aFilters2 = [];

            if (aDocumentId.length > 0) {
                var aDocumentFilters = aDocumentId.map(function (docId) {
                    return new sap.ui.model.Filter("BillingDocument", sap.ui.model.FilterOperator.EQ, docId);
                });

                aFilters2.push(new sap.ui.model.Filter({
                    filters: aDocumentFilters,
                    and: false
                }));
            }

            sap.ui.core.BusyIndicator.show();

            try {
                // --- HEADER DATA ---
                var aHdrData = await oServiceModel.bindList("/headSet", undefined, undefined, aFilters).requestContexts()
                    .then(function (aContexts) {
                        return aContexts.map(function (oCtx) {
                            return oCtx.getObject();
                        });
                    });

                console.log("Header Array Data:", aHdrData);

                // --- ITEM DATA ---
                var aItmData = await oServiceModel.bindList("/itemSet", undefined, undefined, aFilters2).requestContexts()
                    .then(function (aContexts) {
                        return aContexts.map(function (oCtx) {
                            return oCtx.getObject();
                        });
                    });

                console.log("Item Array Data:", aItmData);

                // Convert all string fields in first header record to uppercase
                if (Array.isArray(aHdrData) && aHdrData.length > 0) {
                    Object.keys(aHdrData[0]).forEach(function (key) {
                        if (typeof aHdrData[0][key] === "string") {
                            aHdrData[0][key] = aHdrData[0][key].toUpperCase();
                        }
                    });
                }

                // Set data in global model
                oGlobalModel.setProperty("/headerData", aHdrData);
                oGlobalModel.setProperty("/itemData", aItmData);

                if (aHdrData.length === 0 || aItmData.length === 0) {
                    sap.m.MessageBox.warning("No Data Available!");
                    return;
                }

                that._loadPdfMakeLibrary(aHdrData, aItmData);

            } catch (oError) {
                console.error("Error fetching data:", oError);
                try {
                    var oResponse = oError && oError.message && typeof oError.message === "string" ? JSON.parse(oError.message) : null;
                    sap.m.MessageBox.error(oResponse?.error?.message?.value || "Failed to fetch data.");
                } catch (e) {
                    sap.m.MessageBox.error("Failed to fetch data.");
                }
            } finally {
                sap.ui.core.BusyIndicator.hide();
            }
        },
        formatDate: function (sDate) {
            if (!sDate) {
                return ""; // Return blank if null or undefined
            }

            try {
                var oDate = new Date(sDate);
                if (isNaN(oDate)) {
                    return ""; // Invalid date
                }
                var day = String(oDate.getDate()).padStart(2, '0');
                var month = String(oDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                var year = oDate.getFullYear();
                return day + "/" + month + "/" + year;
            } catch (e) {
                return ""; // Safe fallback
            }
        },
        calculatedData: function (aItmData) {
            var totalPackages = 0;
            var totalNetWeight = 0;
            var totalGrossWeight = 0;
            var totalPrice = 0;

            aItmData.forEach(item => {
                totalPackages += parseFloat(item.number_of_packages || 0);
                totalNetWeight += parseFloat(item.Net_Weight || 0);
                totalGrossWeight += parseFloat(item.Gross_weight_or_other_quantity || 0);
                totalPrice += parseFloat(item.Total || 0);
            });
            console.log(`Total Packages: ${totalPackages.toFixed(2)}, Net Wt (Kg): ${totalNetWeight.toFixed(2)},  Gross Wt (Kg): ${totalGrossWeight.toFixed(2)},  Total PRice: ${totalPrice.toFixed(2)}`);
            return {
                totalPackages: totalPackages.toFixed(2),
                totalNetWeight: totalNetWeight.toFixed(2),
                totalGrossWeight: totalGrossWeight.toFixed(2),
                totalPrice: totalPrice.toFixed(2)
            };
        },

        // generatePdfCanadaCustom2: function (aHdrDataArr, aItmData) {
        //     var that = this;

        //     this._busyDialog.open(); // Show spinner

        //     var oCalData = this.calculatedData(aItmData);

        //     // Path to your PNG logo
        //     var oImageUrl = jQuery.sap.getModulePath("canadacustominvoice", "/model/Crescent_logo.png");

        //     // Convert PNG logo to base64 with error handling
        //     var logoPromise = new Promise(function (resolve, reject) {
        //         that.convertImgToBase64(oImageUrl, function (base64Logo) {
        //             if (base64Logo) {
        //                 resolve(base64Logo);
        //             } else {
        //                 reject(new Error("Failed to convert logo to base64"));
        //             }
        //         });
        //     });

        //     var aHdrData = aHdrDataArr[0]; // Header Odata coming as Array.
        //     console.log("Header Data:", aHdrData);

        //     logoPromise.then(function (base64Logo) {
        //         var content = [];

        //         // Title without logo, two lines as per screenshot
        //         content.push({
        //             table: {
        //                 widths: ['*'],
        //                 body: [
        //                     [
        //                         {
        //                             stack: [
        //                                 { text: 'CANADA CUSTOMS INVOICE', bold: true, fontSize: 10, alignment: "center" },
        //                                 { text: 'FACTURE DES DOUANES CANADIENNES', bold: true, fontSize: 10, alignment: "center" }
        //                             ],
        //                             border: [false, false, false, false],
        //                             margin: [0, 4, 0, 2]
        //                         }
        //                     ]
        //                 ]
        //             },
        //             layout: 'noBorders'
        //         });

        //         // Single table for the entire form with 5 columns
        //         var tableBody = [];


        //         // Row 1: Field 1 (colSpan 2, rowSpan 2) + Field 2 (colSpan 3)
        //         tableBody.push([
        //             {
        //                 colSpan: 2,
        //                 rowSpan: 2,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     // { text: '\n\n\n\n\n', fontSize: 7 } // 6 lines
        //                     { text: "Exporter & Manfacturer:", bold: true, fontSize: 7, margin: [0, 0, 0, 4], alignment: 'center' },
        //                     { text: "CRESCENT FOUNDRY CO PVT LTD", fontSize: 7, fillColor: "#ffffffff", alignment: 'center' },
        //                     { text: "7/1, LORD SINHA ROAD, LORDS BUILDING # 406,", fontSize: 7, fillColor: "#ffffffff", alignment: 'center' },
        //                     { text: "KOLKATA-700071(INDIA).", fontSize: 7, fillColor: "#ffffffff", alignment: 'center' },
        //                     { text: "I.E CODE NO.: 0288001028", fontSize: 7, margin: [0, 0, 0, 0], alignment: 'center' }
        //                 ],
        //                 border: [true, true, true, true]
        //             },
        //             { text: '', border: [false, true, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     { text: aHdrData.Document_date + "       " + aHdrData.Commercial_no, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'right' },
        //                 ],
        //                 border: [false, true, true, true]
        //             },
        //             { text: '', border: [false, true, false, true] },
        //             { text: '', border: [false, true, true, true] }
        //         ]);

        //         // Row 2: Placeholder for Field 1 + Field 3 (colSpan 3)
        //         tableBody.push([
        //             { text: '', border: [true, false, false, true] },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     { text: aHdrData.Document_date, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'right' },
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);

        //         // Row 3: Field 4 (colSpan 2, rowSpan 3) + Field 5 (colSpan 3)
        //         tableBody.push([
        //             {
        //                 colSpan: 2,
        //                 rowSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     // { text: '\n\n\n\n\n', fontSize: 7 } // 6 lines
        //                     { text: aHdrData.Goods_consigned_To_Name, fontSize: 7, margin: [0, 6, 0, 2], alignment: 'center' },
        //                     { text: aHdrData.Goods_consigned_To_Address, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'center' },
        //                     // { text: aHdrData.Document_date, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'center' },
        //                 ],
        //                 border: [true, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     { text: aHdrData.Goods_consigned_To_Name, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'center' },
        //                     { text: aHdrData.Goods_consigned_To_Address, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'center' }
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);

        //         // Row 4: Placeholder for Field 4 + Field 6 (colSpan 3)
        //         tableBody.push([
        //             { text: '', border: [true, false, false, true] },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     { text: aHdrData.Country_of_Destination, fontSize: 7, margin: [0, 0, 0, 2], alignment: 'center' },
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);

        //         // // Row 5: Placeholder for Field 4 + Field 7 (colSpan 3)
        //         // tableBody.push([
        //         //     { text: '', border: [true, false, false, true] },
        //         //     { text: '', border: [false, false, false, true] },
        //         //     {
        //         //         colSpan: 3,
        //         //         stack: [
        //         //             { text: '7. Country of Origin of goods / Pays d\'origine des marchandises', bold: true, fontSize: 7, margin: [0, 0, 0, 2] },
        //         //             { text: aHdrData.Country_of_Origin, fontSize: 7, margin: [0, 0, 0, 2] , alignment: 'center'},
        //         //             { text: 'If shipment includes goods of different origins enter origins against items in 12. / Si l\'expédition comprend des marchandises d\'origines différentes, préciser l\'origine contre les items en 12.', fontSize: 7, italics: true }
        //         //         ],
        //         //         border: [false, false, true, true]
        //         //     },
        //         //     { text: '', border: [false, false, false, true] },
        //         //     { text: '', border: [false, false, true, true] }
        //         // ]);
        //         // Row 5: Country of Origin (side-by-side layout)
        //         tableBody.push([
        //             { text: '', border: [true, false, false, true] },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 table: {
        //                     widths: ['50%', '50%'],
        //                     body: [
        //                         [
        //                             {
        //                                 stack: [
        //                                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                                     { text: aHdrData.Country_of_Origin || '', fontSize: 7, margin: [0, 0, 0, 2], alignment: 'center' }
        //                                 ],
        //                                 border: [false, false, true, false]
        //                             },
        //                             {
        //                                 text: 'If shipment includes goods of different origins enter origins against items in 12.\nS’il expédition comprend des marchandises d’origines différentes, préciser la provenance en 12.',
        //                                 fontSize: 6,
        //                                 italics: true,
        //                                 alignment: 'left',
        //                                 border: [false, false, false, false]
        //                             }
        //                         ]
        //                     ]
        //                 },
        //                 layout: {
        //                     defaultBorder: false,
        //                     hLineWidth: function () { return 0; },
        //                     vLineWidth: function (i, node) {
        //                         // draw continuous vertical border between columns
        //                         return i === 0 || i === node.table.widths.length ? 0 : 0.5;
        //                     },
        //                     vLineColor: function () { return '#000000'; } // ensure visible black border
        //                 },
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);


        //         // Row 6: Field 8 (colSpan 2, rowSpan 2) + Field 9 (colSpan 3)
        //         tableBody.push([
        //             {
        //                 colSpan: 2,
        //                 rowSpan: 2,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 14] },
        //                     // { text: '\n\n', fontSize: 7 } // 2 lines
        //                     { text: `Port Of Loading:  ${aHdrData.Port_Of_Loading}`, fontSize: 7, margin: [0, 4, 0, 2], alignment: 'center' },
        //                     { text: `Port Of Destination:  ${aHdrData.Port_of_Destination}`, fontSize: 7, margin: [0, 4, 0, 2], alignment: 'center' }
        //                 ],
        //                 border: [true, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 16] },
        //                     { text: "AS PER CONTRACT", fontSize: 7, margin: [0, 0, 0, 2], alignment: 'right' },
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);

        //         // Row 7: Placeholder for Field 8 + Field 10 (colSpan 3)
        //         tableBody.push([
        //             { text: '', border: [true, false, false, true] },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 10] },
        //                     { text: '\n', fontSize: 7 } // 1 line
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);


        //         // Items table header (fields 11-15) with Selling Price spanning 14 and 15 in one row
        //         tableBody.push([
        //             { text: '11. No. of Pkgs / Nom. Coils', bold: true, fontSize: 7, alignment: 'center', border: [true, false, false, true] },
        //             { text: '12. Specification of Commodities (Kind of Packages, Marks and Numbers, General Description and Characteristics, i.e., Grade, Quality) / Spécification des Commodities (Kind of Packages, Marks and Numbers, General Description and Characteristics, p. ex. Classe que qualit e', bold: true, fontSize: 7, alignment: 'center', border: [false, false, false, true] },
        //             { text: '13. Quantity (State Unit) / Quantité (Préciser l\'unité)', bold: true, fontSize: 7, alignment: 'center', border: [false, false, false, true] },
        //             {
        //                 colSpan: 2,
        //                 stack: [
        //                     { text: 'Selling Price / Prix de vente', bold: true, fontSize: 7, alignment: 'center' },
        //                     {
        //                         columns: [
        //                             { text: '14. Unit Price / Prix Unitaire', bold: true, fontSize: 7, alignment: 'left', width: '50%' },
        //                             { text: '15. Total', bold: true, fontSize: 7, alignment: 'right', width: '50%' }
        //                         ],
        //                         margin: [0, 2, 0, 0]
        //                     }
        //                 ],
        //                 border: [false, false, true, true]
        //             }
        //         ]);

        //         // // Add 50 data rows for the items table
        //         // for (var i = 0; i < 40; i++) {
        //         //     tableBody.push([
        //         //         { text: '', fontSize: 7, alignment: 'center', border: [true, false, false, false] }, // No bottom border
        //         //         { text: '', fontSize: 7, border: [false, false, false, false] }, // No borders
        //         //         { text: '', fontSize: 7, alignment: 'center', border: [false, false, false, false] },
        //         //         { text: '', fontSize: 7, alignment: 'right', border: [false, false, false, false] },
        //         //         { text: '', fontSize: 7, alignment: 'right', border: [false, false, true, false] } // Right border only
        //         //     ]);
        //         // }

        //         // 1️⃣ Fixed summary row
        //         tableBody.push([
        //             {
        //                 text: oCalData.totalPackages || '',
        //                 fontSize: 7,
        //                 alignment: 'center',
        //                 border: [true, false, false, false]
        //             },
        //             {
        //                 text: [
        //                     ('Marked: ' + (aHdrData.Marked || '')),                                                // Marked first
        //                     (aHdrData.GoodsDescription1 ? '\n' + aHdrData.GoodsDescription1 : ''),  // GoodsDescription1 next
        //                     (aHdrData.GoodsDescription2 ? '\n' + aHdrData.GoodsDescription2 : '')   // GoodsDescription2 last
        //                 ],
        //                 fontSize: 7,
        //                 border: [false, false, false, false]
        //             },
        //             {
        //                 text: aHdrData.ShipmentType || '',
        //                 fontSize: 7,
        //                 alignment: 'center',
        //                 border: [false, false, false, false]
        //             },
        //             {
        //                 text: aHdrData.BillingDocumentCurrency || '',
        //                 fontSize: 7,
        //                 alignment: 'right',
        //                 border: [false, false, false, false]
        //             },
        //             {
        //                 text: '',  // last blank column
        //                 fontSize: 7,
        //                 alignment: 'right',
        //                 border: [false, false, true, false]
        //             }
        //         ]);

        //         // Add data rows from aItmData
        //         aItmData.forEach(item => {
        //             tableBody.push([
        //                 { text: "", fontSize: 7, alignment: 'center', border: [true, false, false, false] },
        //                 { text: item.Material + "    " + item.Material_Desc, fontSize: 7, border: [false, false, false, false] },
        //                 { text: item.Quantity + "  " + item.Uom, fontSize: 7, alignment: 'center', border: [false, false, false, false] },
        //                 { text: item.Unit_Price, fontSize: 7, alignment: 'right', border: [false, false, false, false] },
        //                 { text: item.Total, fontSize: 7, alignment: 'right', border: [false, false, true, false] }
        //             ]);
        //         });

        //         // Only add blank rows if aItmData < 50
        //         var remainingRows = 20 - aItmData.length;
        //         if (remainingRows > 0) {
        //             for (var i = 0; i < remainingRows; i++) {
        //                 tableBody.push([
        //                     { text: '', fontSize: 7, alignment: 'center', border: [true, false, false, false] },
        //                     { text: '', fontSize: 7, border: [false, false, false, false] },
        //                     { text: '', fontSize: 7, alignment: 'center', border: [false, false, false, false] },
        //                     { text: '', fontSize: 7, alignment: 'right', border: [false, false, false, false] },
        //                     { text: '', fontSize: 7, alignment: 'right', border: [false, false, true, false] }
        //                 ]);
        //             }
        //         };

        //         // content.push({
        //         //     table: {
        //         //         widths: ['10%', '44%', '15%', '15.5%', '15.5%'],
        //         //         body: tableBody
        //         //     },
        //         //     layout: {
        //         //         hLineWidth: function (i, node) {
        //         //             // Draw horizontal lines for rows 1-10 (fields 1-10) and top/bottom of the table
        //         //             if (i === 0 || i === node.table.body.length - 1) return 1; // Top and bottom
        //         //             if (i <= 7) return 1; // Rows 1-7 (fields 1-10)
        //         //             return 0; // No horizontal lines for rows 8 onwards (fields 11-15 and data)
        //         //         },
        //         //         vLineWidth: function (i, node) { return 1; }, // Ensure vertical lines for all columns
        //         //         paddingLeft: function () { return 4; },
        //         //         paddingRight: function () { return 4; },
        //         //         paddingTop: function () { return 2; },
        //         //         paddingBottom: function () { return 2; }
        //         //     },
        //         //     border: [true, true, true, true],
        //         //     margin: [0, 5, 0, 5]
        //         // });

        //         // Fields 18-22 section
        //         // Fields 18-22 section
        //         tableBody.push([
        //             {
        //                 colSpan: 2,
        //                 stack: [
        //                     { text: '18. If any of fields 1 to 17 are included on an attached commercial Invoice, check this box / Si les renseignements des zones 1 e 17 figurent sur la facture commerciale, cocher cette boite', bold: true, fontSize: 7, alignment: 'left' },
        //                     { text: '', fontSize: 7, alignment: 'center', margin: [2, 0, 0, 0] },
        //                     {
        //                         columns: [
        //                             { text: aHdrData.Commercial_no + "    " + aHdrData.Document_date, fontSize: 7, margin: [0, 4, 0, 2], alignment: 'right' },
        //                             { text: '', border: [false, false, false, true], fillColor: '#ffffff', width: '*' }
        //                         ]
        //                     }
        //                 ],
        //                 border: [true, true, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 2,
        //                 stack: [
        //                     { text: '16. Total Weight / Poids Total', bold: true, fontSize: 7, alignment: 'left' },
        //                     {
        //                         columns: [
        //                             { text: 'Net', bold: true, fontSize: 7, width: '50%', alignment: 'center', border: [true, true, true, true] }, // Top and vertical borders
        //                             { text: '', border: [true, true, true, true], fillColor: '#ffffff', width: '*' }, // Vertical border between
        //                             { text: 'Gross / Brut', bold: true, fontSize: 7, width: '50%', alignment: 'center', border: [true, true, true, true] }, // Top and vertical borders
        //                             { text: '', border: [true, true, true, true], fillColor: '#ffffff', width: '*' }
        //                         ]
        //                     },
        //                     {
        //                         columns: [
        //                             { text: oCalData.totalNetWeight, fontSize: 7, width: '50%', alignment: 'center', border: [true, false, true, true], margin: [0, 4, 0, 0] }, // Vertical border
        //                             { text: '', border: [true, false, true, true], fillColor: '#ffffff', width: '*' }, // Vertical border between
        //                             { text: oCalData.totalGrossWeight, fontSize: 7, width: '50%', alignment: 'center', border: [true, false, true, true], margin: [0, 4, 0, 0] }, // Vertical border
        //                             { text: '', border: [true, false, true, true], fillColor: '#ffffff', width: '*' }
        //                         ]
        //                     }
        //                 ],
        //                 border: [false, true, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 1,
        //                 stack: [
        //                     { text: '17. Invoice Total / Total de la facture', bold: true, fontSize: 7, alignment: 'left' },
        //                     { text: '', border: [false, false, false, true], fillColor: '#ffffff' },
        //                     {
        //                         columns: [
        //                             { text: oCalData.totalPrice, fontSize: 7, alignment: 'right', width: '*', margin: [0, 4, 0, 0] },
        //                             { text: '', border: [false, false, false, true], fillColor: '#ffffff', width: '*' }
        //                         ]
        //                     }
        //                 ],
        //                 border: [false, true, true, true]
        //             }
        //         ]);
        //         tableBody.push([
        //             {
        //                 colSpan: 2,
        //                 stack: [
        //                     { text: '19. Commercial Invoice No. IN. De fa facture commercial Exporter’s Name and Address (If other than Vendor) Nom et adresse de /‘exportateur (S\'ll differe du vendeur)', bold: true, fontSize: 7, alignment: 'left' },
        //                     // { text: '\n\n\n\n', fontSize: 7 }
        //                     { text: "CRESCENT FOUNDRY CO PVT LTD", fontSize: 7, fillColor: "#ffffffff", alignment: 'left' },
        //                     { text: "7/1, LORD SINHA ROAD, LORDS BUILDING # 406,", fontSize: 7, fillColor: "#ffffffff", alignment: 'left' },
        //                     { text: "KOLKATA-700071(INDIA).", fontSize: 7, fillColor: "#ffffffff", alignment: 'left' }
        //                 ],
        //                 border: [true, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '20. Originator (Name and Address) / Expéditeur d\'origine (Nom et adresse)', bold: true, fontSize: 7, alignment: 'left' }
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);

        //         tableBody.push([
        //             {
        //                 colSpan: 2,
        //                 stack: [
        //                     { text: '21. Department Ruling (if applicable) / Décision du Ministère (s\'il y a lieu)', bold: true, fontSize: 7, alignment: 'left' }
        //                 ],
        //                 border: [true, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             {
        //                 colSpan: 3,
        //                 stack: [
        //                     { text: '22. If fields 23 to 25 are not applicable, check this box / Si les zones 23 e 25 sont sans objet, cocher cette boite', bold: true, fontSize: 7, alignment: 'left' },
        //                     { text: '☐', fontSize: 7, alignment: 'center', margin: [5, 0, 0, 0] }
        //                 ],
        //                 border: [false, false, true, true]
        //             },
        //             { text: '', border: [false, false, false, true] },
        //             { text: '', border: [false, false, true, true] }
        //         ]);

        //         // tableBody.push([
        //         //     {
        //         //         colSpan: 5,
        //         //         border: [true, false, true, true], // Outer box for the entire section
        //         //         table: {
        //         //             widths: ['66.66%', '33.34%'], // Left nested table (23+24) vs Right (25)
        //         //             body: [
        //         //                 [
        //         //                     // Left nested table (23 + 24 side by side with 3 sub-rows)
        //         //                     {
        //         //                         table: {
        //         //                             widths: ['50%', '50%'],
        //         //                             body: [
        //         //                                 [
        //         //                                     {
        //         //                                         stack: [
        //         //                                             { text: '23. If included in field 17 indicate amount / Si compris dans le total de la zone 17 préciser', bold: true, fontSize: 8, margin: [0, 0, 0, 3] },
        //         //                                             { text: '(i) Transportation charges, expenses and insurance from the place of direct shipment to Canada.', fontSize: 7 }
        //         //                                         ],
        //         //                                         margin: [4, 2, 4, 2]
        //         //                                     },
        //         //                                     {
        //         //                                         stack: [
        //         //                                             { text: '24. If not included in field 17 indicate amount / Si non compris dans le total de la zone 17 préciser', bold: true, fontSize: 8, margin: [0, 0, 0, 3] },
        //         //                                             { text: '(i) Transportation charges, expenses and insurance to the place of direct shipment to Canada.', fontSize: 7 }
        //         //                                         ],
        //         //                                         margin: [4, 2, 4, 2]
        //         //                                     }
        //         //                                 ],
        //         //                                 [
        //         //                                     { text: '(ii) Costs for construction, erection and incurred after importation into Canada.', fontSize: 7, margin: [4, 2, 4, 2] },
        //         //                                     { text: '(ii) Amounts for commissions other than buying commissions.', fontSize: 7, margin: [4, 2, 4, 2] }
        //         //                                 ],
        //         //                                 [
        //         //                                     { text: '(iii) Export Packing / Le coût de l\'emballage d\'exportation', fontSize: 7, margin: [4, 2, 4, 2] },
        //         //                                     { text: '(iii) Export Packing / Le coût de l\'emballage d\'exportation', fontSize: 7, margin: [4, 2, 4, 2] }
        //         //                                 ]
        //         //                             ]
        //         //                         },
        //         //                         layout: {
        //         //                             hLineWidth: function () { return 1; }, // horizontal lines for subrows
        //         //                             vLineWidth: function (i, node) {
        //         //                                 return (i === 0 || i === node.table.widths.length) ? 0 : 1; // only middle divider between 23 & 24
        //         //                             },
        //         //                             vLineColor: function () { return '#000'; },
        //         //                             hLineColor: function () { return '#000'; },
        //         //                             paddingTop: function () { return 2; },
        //         //                             paddingBottom: function () { return 2; },
        //         //                             paddingLeft: function () { return 3; },
        //         //                             paddingRight: function () { return 3; }
        //         //                         }
        //         //                     },

        //         //                     // Right side — Field 25 (single tall cell)
        //         //                     {
        //         //                         stack: [
        //         //                             { text: '25. Check (if applicable) / Cocher (S\'il y a lieu)', bold: true, fontSize: 8, margin: [0, 0, 0, 4] },
        //         //                             { text: '☐ (i) Royalty payments or subsequent proceeds are paid or payable by the purchaser', fontSize: 7, margin: [0, 0, 0, 3] },
        //         //                             { text: '☐ (ii) The purchaser has supplied goods or services for use in the production of these goods', fontSize: 7 }
        //         //                         ],
        //         //                         margin: [4, 2, 4, 2],
        //         //                         // rowSpan: 3, // makes it equal height with left section
        //         //                         border: [true, true, true, true], // Outer box only
        //         //                         fillColor: '#ffffff' // avoid nested borders
        //         //                     }
        //         //                 ]
        //         //             ]
        //         //         },
        //         //         layout: {
        //         //             hLineWidth: function () { return 0; }, // handled inside nested table
        //         //             vLineWidth: function () { return 0; },
        //         //             paddingTop: function () { return 0; },
        //         //             paddingBottom: function () { return 0; },
        //         //             paddingLeft: function () { return 0; },
        //         //             paddingRight: function () { return 0; }
        //         //         }
        //         //     }
        //         // ]);

        //         tableBody.push([
        //             {
        //                 colSpan: 5,
        //                 border: [true, false, true, true], // Outer box for entire section
        //                 table: {
        //                     widths: ['66.66%', '33.34%'],
        //                     body: [
        //                         [
        //                             // Left nested table (23 + 24) with borders
        //                             {
        //                                 table: {
        //                                     widths: ['50%', '50%'],
        //                                     body: [
        //                                         [
        //                                             {
        //                                                 stack: [
        //                                                     { text: '23. If included in field 17 indicate amount / Si compris dans le total de la zone 17 préciser', bold: true, fontSize: 7, margin: [0, 0, 0, 3] },
        //                                                     { text: '(i) Transportation charges, expenses and insurance from the place of direct shipment to Canada.\nLes frais de transport, dépenses et assurances à partir du point d\'expédition directe vers le Canada.', fontSize: 7 }
        //                                                 ],
        //                                                 margin: [4, 1, 4, 1],
        //                                                 border: [true, true, true, true]
        //                                             },
        //                                             {
        //                                                 stack: [
        //                                                     { text: '24. If not included in field 17 indicate amount / Si non compris dans le total de la zone 17 préciser', bold: true, fontSize: 7, margin: [0, 0, 0, 3] },
        //                                                     { text: `(i) Transportation charges, expenses and insurance to the place of direct shipment to Canada.\nLes frais de transport, dépenses et assurances\nJusqu'au point d'expédition directe vers le Canada`, fontSize: 7 }
        //                                                 ],
        //                                                 margin: [4, 1, 4, 1],
        //                                                 border: [true, true, true, true]
        //                                             }
        //                                         ],
        //                                         [
        //                                             { text: '(ii) Costs for construction, erection and incurred after importation into Canada.\nLes coûts de construction, d\'érection et d\'assemblage après importation au Canada.', fontSize: 7, margin: [4, 2, 4, 2], border: [true, false, true, true] },
        //                                             { text: '(ii) Amounts for commissions other than buying commissions\nLes commissions autres que celles versées pour l\'achat', fontSize: 7, margin: [4, 2, 4, 2], border: [true, false, true, true] }
        //                                         ],
        //                                         [
        //                                             { text: '(iii) Export Packing / Le coût de l\'emballage d\'exportation', fontSize: 7, margin: [4, 2, 4, 2], border: [true, false, true, true] },
        //                                             { text: '(iii) Export Packing / Le coût de l\'emballage d\'exportation', fontSize: 7, margin: [4, 2, 4, 2], border: [true, false, true, true] }
        //                                         ]
        //                                     ]
        //                                 },
        //                                 layout: {
        //                                     hLineWidth: function (i, node) { return 1; },
        //                                     vLineWidth: function (i, node) { return 1; },
        //                                     vLineColor: function () { return '#000'; },
        //                                     hLineColor: function () { return '#000'; },
        //                                     paddingTop: function () { return 2; },
        //                                     paddingBottom: function () { return 2; },
        //                                     paddingLeft: function () { return 3; },
        //                                     paddingRight: function () { return 3; }
        //                                 }
        //                             },

        //                             // Right side — Field 25 (3-row nested table)
        //                             {
        //                                 table: {
        //                                     widths: ['*'],
        //                                     body: [
        //                                         [
        //                                             { text: `25. Check (if applicable) / Cocher (S'il y a lieu)`, bold: true, fontSize: 7, margin: [0, 0, 0, 4], border: [true, true, true, false] }
        //                                         ],
        //                                         [
        //                                             { text: `(i) Royalty Payments or subsequent proceeds are paid or payable by the purchaser\nDes avances ou produits ont été ou seront versés par l'acheteur`, fontSize: 7, border: [true, false, true, false] }
        //                                         ],
        //                                         [
        //                                             {
        //                                                 text: '\u25A1', // □ white square
        //                                                 fontSize: 10,
        //                                                 margin: [2, 0, 0, 0],
        //                                                 border: [true, false, true, false],
        //                                                 alignment: 'center'
        //                                             }
        //                                         ],
        //                                         [
        //                                             { text: `(ii) The purchaser has supplied goods or services for use in the production of these goods\nL'acheteur fournit des marchandises ou des services pour la production de ces biens`, fontSize: 7, border: [true, false, true, true] }
        //                                         ],
        //                                         [
        //                                             {
        //                                                 text: '\u25A1', // □ white square
        //                                                 fontSize: 10,
        //                                                 margin: [2, 0, 0, 0],
        //                                                 border: [true, false, true, false],
        //                                                 alignment: 'center'
        //                                             }
        //                                         ]
        //                                     ]
        //                                 },
        //                                 layout: {
        //                                     hLineWidth: function () { return 0; },
        //                                     vLineWidth: function () { return 0; },
        //                                     paddingTop: function () { return 2; },
        //                                     paddingBottom: function () { return 2; },
        //                                     paddingLeft: function () { return 4; },
        //                                     paddingRight: function () { return 4; }
        //                                 }
        //                             }
        //                         ]
        //                     ]
        //                 },
        //                 layout: {
        //                     hLineWidth: function () { return 0; },
        //                     vLineWidth: function () { return 0; },
        //                     paddingTop: function () { return 0; },
        //                     paddingBottom: function () { return 0; },
        //                     paddingLeft: function () { return 0; },
        //                     paddingRight: function () { return 0; }
        //                 }
        //             }
        //         ]);



        //         content.push({
        //             table: {
        //                 widths: ['10%', '50%', '15%', '12.5%', '12.5%'],
        //                 body: tableBody
        //             },
        //             layout: {
        //                 hLineWidth: function (i, node) { return 1; },
        //                 vLineWidth: function (i, node) { return 1; },
        //                 paddingLeft: function () { return 4; },
        //                 paddingRight: function () { return 4; },
        //                 paddingTop: function () { return 2; },
        //                 paddingBottom: function () { return 2; }
        //             },
        //             border: [true, true, true, true],
        //             margin: [0, 2, 0, 2]
        //         });

        //         // Certification Footer
        //         content.push({
        //             text: 'I, The undersigned Member of the Secretarial Staff of the Bengal Chamber of Commerce & Industry hereby certify that the above declaration was made before me.',
        //             fontSize: 7,
        //             italics: true,
        //             margin: [0, 8, 0, 0]
        //         });
        //         content.push({
        //             text: 'Member of the Secretarial Staff\nThe Bengal Chamber of Commerce & Industry',
        //             fontSize: 7,
        //             alignment: 'right',
        //             margin: [0, 20, 0, 0]
        //         });

        //         var docDefinition = {
        //             pageSize: "A4",
        //             pageMargins: [30, 20, 30, 20],
        //             content: content,
        //             styles: {
        //                 tableHeader: {
        //                     bold: true,
        //                     fontSize: 8,
        //                     alignment: "center",
        //                     fillColor: "#E0E0E0"
        //                 },
        //                 tableBody: {
        //                     fontSize: 7,
        //                     alignment: "left",
        //                     bold: false
        //                 }
        //             }
        //         };

        //         // Preview PDF in the View
        //         pdfMake.createPdf(docDefinition).getBlob(function (blob) {
        //             var blobUrl = URL.createObjectURL(blob);

        //             var oHtml = that.byId("pdfIframeContainer");
        //             oHtml.setContent(`
        //         <div class="pdf-iframe-container">
        //             <iframe src="${blobUrl}" class="pdf-iframe"></iframe>
        //         </div>
        //     `);

        //             that._pdfBlobUrl = blobUrl;

        //             that._busyDialog.close();
        //         });

        //     }).catch(function (err) {
        //         console.error("Error while generating PDF:", err);
        //         that._busyDialog.close();
        //         sap.m.MessageBox.error("Failed to generate PDF.");
        //     });

        // },

        generatePdfCanadaCustom: function (aHdrDataArr, aItmData) {
            var that = this;

            this._busyDialog.open(); // Show spinner

            var oCalData = this.calculatedData(aItmData);

            // Path to your PNG logo
            var oImageUrl = jQuery.sap.getModulePath("canadacustominvoice", "/model/Crescent_logo.png");

            // Convert PNG logo to base64 with error handling
            var logoPromise = new Promise(function (resolve, reject) {
                that.convertImgToBase64(oImageUrl, function (base64Logo) {
                    if (base64Logo) {
                        resolve(base64Logo);
                    } else {
                        reject(new Error("Failed to convert logo to base64"));
                    }
                });
            });

            var aHdrData = aHdrDataArr[0]; // Header Odata coming as Array.
            console.log("Header Data:", aHdrData);

            // Date Format DD-MM-YYYY
            var oDocument_date = that.formatDate(aHdrData.Document_date);

            logoPromise.then(function (base64Logo) {
                var content = [];

                // Title without logo, two lines as per screenshot
                content.push({
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                {
                                    stack: [
                                        { text: 'CANADA CUSTOMS INVOICE', bold: true, fontSize: 10, alignment: "center" },
                                        { text: 'FACTURE DES DOUANES CANADIENNES', bold: true, fontSize: 10, alignment: "center" }
                                    ],
                                    border: [false, false, false, false],
                                    margin: [0, 4, 0, 2]
                                }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                });

                // Single table for the entire form with 5 columns
                var tableBody = [];

                // ------------------------
                // Main table (unchanged 5-column layout)
                // ------------------------


                // ------------------------
                // 1–10 Fields section: two columns 50%-50%

                // Step 2: two-column (50%-50%) layout, each row aligns height visually
                content.push({
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            // ---------- Row 1 (Left 1 ↔ Right 2–3) ----------
                            [
                                // LEFT: Field 1
                                {
                                    stack: [
                                        { text: "Exporter & Manufacturer:", bold: true, fontSize: 7, alignment: 'center', margin: [0, 18, 0, 2] },
                                        { text: "CRESCENT FOUNDRY CO PVT LTD", fontSize: 7, alignment: 'center' },
                                        { text: "7/1, LORD SINHA ROAD, LORDS BUILDING # 406,", fontSize: 7, alignment: 'center' },
                                        { text: "KOLKATA-700071 (INDIA)", fontSize: 7, alignment: 'center' },
                                        { text: "I.E CODE NO.: 0288001028", fontSize: 7, alignment: 'center', margin: [0, 2, 0, 2] }
                                    ],
                                    border: [false, true, true, true]
                                },

                                // RIGHT: Fields 2 and 3
                                {
                                    stack: [
                                        { text: oDocument_date + "     " + (aHdrData.Commercial_no || ''), bold: false, fontSize: 7, alignment: 'right', margin: [0, 18, 0, 2] },
                                        { text: oDocument_date, fontSize: 7, margin: [0, 10, 0, 2], alignment: 'right' },
                                    ],
                                    border: [false, true, false, true]
                                }
                            ],

                            // ---------- Row 2 (Left 4 ↔ Right 5–7) ----------
                            [
                                // LEFT: Field 4 (Consignee)
                                {
                                    stack: [
                                        { text: "", bold: true, fontSize: 7, alignment: 'center', margin: [0, 30, 0, 2] },
                                        { text: aHdrData.Goods_consigned_To_Name || '', fontSize: 7, alignment: 'center' },
                                        { text: aHdrData.Goods_consigned_To_Address || '', fontSize: 7, alignment: 'center' }
                                    ],
                                    border: [false, true, false, true]
                                },

                                // RIGHT: Fields 5–7 (with fixed borders)
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            // ---------- Section 1 ----------
                                            [
                                                {
                                                    table: {
                                                        widths: ['*'],
                                                        body: [
                                                            [{ text: "", fontSize: 7, alignment: 'center', margin: [0, 20, 0, 0] }],
                                                            [{ text: aHdrData.Goods_consigned_To_Name, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 0] }],
                                                            [{ text: aHdrData.Goods_consigned_To_Address, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 2] }]
                                                        ]
                                                    },
                                                    layout: {
                                                        hLineWidth: (i, node) => (i === node.table.body.length ? 0.5 : 0),
                                                        vLineWidth: () => 0,
                                                        hLineColor: () => '#000000',
                                                        paddingLeft: () => 0,
                                                        paddingRight: () => 0
                                                    },
                                                    border: [true, false, false, false],
                                                    margin: [-5, 0, -5, 0]
                                                }
                                            ],

                                            // ---------- Section 2 ----------
                                            [
                                                {
                                                    table: {
                                                        widths: ['*'],
                                                        body: [
                                                            [{ text: "", fontSize: 7, alignment: 'center', margin: [0, 2, 0, 2] }],
                                                            [{ text: aHdrData.Country_of_Destination, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 2] }]
                                                        ]
                                                    },
                                                    layout: {
                                                        hLineWidth: (i, node) => (i === node.table.body.length ? 0.5 : 0),
                                                        vLineWidth: () => 0,
                                                        hLineColor: () => '#000000',
                                                        paddingLeft: () => 0,
                                                        paddingRight: () => 0
                                                    },
                                                    border: [true, false, false, false],
                                                    margin: [-5, 0, -5, 0]
                                                }
                                            ],

                                            // ---------- Section 3 (40/60 split with perfect middle border) ----------
                                            [
                                                {
                                                    table: {
                                                        widths: ['40%', '60%'],
                                                        body: [
                                                            [
                                                                {
                                                                    text: aHdrData.Country_of_Origin || '',
                                                                    fontSize: 7,
                                                                    alignment: 'center',
                                                                    margin: [0, 30, 0, 4],
                                                                    border: [true, false, false, true]
                                                                },
                                                                {
                                                                    text: "",
                                                                    fontSize: 7,
                                                                    alignment: 'center',
                                                                    margin: [0, 30, 0, 0],
                                                                    border: [true, false, false, true]
                                                                }
                                                            ]
                                                        ]
                                                    },
                                                    layout: {
                                                        hLineWidth: () => 0,
                                                        vLineWidth: (i, node) => (i === 1 ? 0.5 : 0), // only middle border
                                                        vLineColor: () => '#000000',
                                                        paddingLeft: () => 0,
                                                        paddingRight: () => 0,
                                                        paddingTop: () => 0,
                                                        paddingBottom: () => 0
                                                    },
                                                    border: [true, false, false, false],
                                                    margin: [0, -4, 0, -4]
                                                }
                                            ]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: () => 0,
                                        vLineWidth: () => 0,
                                        paddingLeft: () => 0,
                                        paddingRight: () => 0
                                    },
                                    border: [true, false, false, false]
                                }
                            ],

                            // ---------- Row 3 (Left 8 ↔ Right 9–10) ----------
                            [
                                {
                                    stack: [
                                        { text: "", bold: false, fontSize: 7, alignment: 'center', margin: [0, 20, 0, 2] },
                                        { text: `Port Of Loading: ${aHdrData.Port_Of_Loading || ''}`, fontSize: 7, alignment: 'center' },
                                        { text: `Port Of Destination: ${aHdrData.Port_of_Destination || ''}`, fontSize: 7, alignment: 'center', margin: [0, 6, 0, 10] }
                                    ],
                                    border: [false, true, true, true]
                                },
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            [
                                                {
                                                    table: {
                                                        widths: ['*'],
                                                        body: [
                                                            [{ text: "AS PER CONTRACT", fontSize: 7, alignment: 'Right', margin: [150, 30, 0, 0] }]

                                                        ]
                                                    },
                                                    layout: {
                                                        hLineWidth: (i, node) => (i === node.table.body.length ? 0.5 : 0),
                                                        vLineWidth: () => 0,
                                                        hLineColor: () => '#000000',
                                                        paddingLeft: () => 0,
                                                        paddingRight: () => 0
                                                    },
                                                    border: [true, false, false, false],
                                                    margin: [-5, 0, -5, 0]
                                                }
                                            ],
                                            [
                                                {
                                                    table: {
                                                        widths: ['*'],
                                                        body: [
                                                            [{ text: "", fontSize: 7, alignment: 'center', margin: [0, 4, 0, 2] }]

                                                        ]
                                                    },
                                                    layout: {
                                                        hLineWidth: () => 0,
                                                        vLineWidth: () => 0,
                                                        hLineColor: () => '#000000',
                                                        paddingLeft: () => 0,
                                                        paddingRight: () => 0
                                                    },
                                                    border: [true, false, false, false],
                                                    margin: [-5, 0, -5, 0]
                                                }
                                            ],
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: () => 0,
                                        vLineWidth: () => 0,
                                        paddingLeft: () => 0,
                                        paddingRight: () => 0
                                    },
                                    border: [true, true, false, true]
                                }
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: (i, node) => 0.5,
                        vLineWidth: (i, node) => 0.5,
                        hLineColor: (i, node) => '#000000',
                        vLineColor: (i, node) => '#000000'
                    },
                    margin: [0, -1, 0, 0]
                });


                // Items table header (fields 11-15) with Selling Price spanning 14 and 15 in one row
                tableBody.push([
                    { text: ' ', bold: true, fontSize: 7, alignment: 'center', border: [false, false, false, false], margin: [0, 20, 0, 0] },
                    { text: ' ', bold: true, fontSize: 7, alignment: 'center', border: [false, false, false, false], margin: [0, 20, 0, 0] },
                    { text: '. ', bold: true, fontSize: 7, alignment: 'center', border: [false, false, false, false], margin: [0, 20, 0, 0] },
                    {
                        colSpan: 2,
                        stack: [
                            { text: '', bold: true, fontSize: 7, alignment: 'center' },
                            {
                                columns: [
                                    { text: ' ', bold: true, fontSize: 7, alignment: 'left', width: '50%', margin: [0, 10, 0, 0] },
                                    { text: ' ', bold: true, fontSize: 7, alignment: 'right', width: '50%', margin: [0, 10, 0, 0] }
                                ],
                                margin: [0, 20, 0, 0]
                            }
                        ],
                        border: [false, false, false, false]
                    },
                    { text: '. ', bold: true, fontSize: 7, alignment: 'center', border: [false, false, false, false], margin: [0, 20, 0, 0] }
                ]);

                // // Add 50 data rows for the items table
                // for (var i = 0; i < 40; i++) {
                //     tableBody.push([
                //         { text: '', fontSize: 7, alignment: 'center', border: [true, false, false, false] }, // No bottom border
                //         { text: '', fontSize: 7, border: [false, false, false, false] }, // No borders
                //         { text: '', fontSize: 7, alignment: 'center', border: [false, false, false, false] },
                //         { text: '', fontSize: 7, alignment: 'right', border: [false, false, false, false] },
                //         { text: '', fontSize: 7, alignment: 'right', border: [false, false, true, false] } // Right border only
                //     ]);
                // }

                // 1️⃣ Fixed summary row
                tableBody.push([
                    {
                        text: oCalData.totalPackages || '',
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },
                    {
                        text: [
                            ('Marked: ' + (aHdrData.Marked || '')),                                                // Marked first
                            (aHdrData.GoodsDescription1 ? '\n' + aHdrData.GoodsDescription1 : ''),  // GoodsDescription1 next
                            (aHdrData.GoodsDescription2 ? '\n' + aHdrData.GoodsDescription2 : '')   // GoodsDescription2 last
                        ],
                        fontSize: 7,
                        border: [false, false, false, false]
                    },
                    {
                        text: aHdrData.ShipmentType || '',
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },
                    {
                        text: aHdrData.BillingDocumentCurrency || '',
                        fontSize: 7,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },
                    {
                        text: '',  // last blank column
                        fontSize: 7,
                        alignment: 'right',
                        border: [false, false, false, false]
                    }
                ]);

                // Add data rows from aItmData
                aItmData.forEach(item => {
                    tableBody.push([
                        { text: "", fontSize: 7, alignment: 'center', border: [false, false, false, false] },
                        { text: item.Material + "    " + item.Material_Desc, fontSize: 7, border: [false, false, false, false] },
                        { text: item.Quantity + "  " + item.Uom, fontSize: 7, alignment: 'center', border: [false, false, false, false] },
                        { text: item.Unit_Price, fontSize: 7, alignment: 'right', border: [false, false, false, false] },
                        { text: item.Total, fontSize: 7, alignment: 'right', border: [false, false, false, false] }
                    ]);
                });

                // Only add blank rows if aItmData < 50
                var remainingRows = 15 - aItmData.length;
                if (remainingRows > 0) {
                    for (var i = 0; i < remainingRows; i++) {
                        tableBody.push([
                            { text: '', fontSize: 7, alignment: 'center', border: [false, false, false, false] },
                            { text: '', fontSize: 7, border: [false, false, false, false] },
                            { text: '', fontSize: 7, alignment: 'center', border: [false, false, false, false] },
                            { text: '', fontSize: 7, alignment: 'right', border: [false, false, false, false] },
                            { text: '', fontSize: 7, alignment: 'right', border: [false, false, false, false] }
                        ]);
                    }
                };

                // content.push({
                //     table: {
                //         widths: ['10%', '44%', '15%', '15.5%', '15.5%'],
                //         body: tableBody
                //     },
                //     layout: {
                //         hLineWidth: function (i, node) {
                //             // Draw horizontal lines for rows 1-10 (fields 1-10) and top/bottom of the table
                //             if (i === 0 || i === node.table.body.length - 1) return 1; // Top and bottom
                //             if (i <= 7) return 1; // Rows 1-7 (fields 1-10)
                //             return 0; // No horizontal lines for rows 8 onwards (fields 11-15 and data)
                //         },
                //         vLineWidth: function (i, node) { return 1; }, // Ensure vertical lines for all columns
                //         paddingLeft: function () { return 4; },
                //         paddingRight: function () { return 4; },
                //         paddingTop: function () { return 2; },
                //         paddingBottom: function () { return 2; }
                //     },
                //     border: [true, true, true, true],
                //     margin: [0, 5, 0, 5]
                // });

                // Fields 18-22 section
                // Fields 18-22 section
                tableBody.push([
                    {
                        colSpan: 2,
                        stack: [
                            { text: '', bold: true, fontSize: 7, alignment: 'left', margin: [2, 28, 0, 0] },
                            { text: '', fontSize: 7, alignment: 'center', margin: [2, 0, 0, 0] },
                            {
                                columns: [
                                    { text: aHdrData.Commercial_no + "    " +oDocument_date, fontSize: 7, margin: [14, 4, 0, 4], alignment: 'right' },
                                    { text: '', border: [false, false, false, true], fillColor: '#ffffff', width: '*' }
                                ]
                            }
                        ],
                        border: [false, true, true, true]
                    },
                    { text: '', border: [false, false, false, true] },
                    {
                        colSpan: 2,
                        stack: [
                            { text: '', bold: true, fontSize: 7, alignment: 'left' },
                            {
                                columns: [
                                    { text: '', bold: true, fontSize: 7, width: '50%', alignment: 'center', border: [true, true, true, true], margin: [0, 14, 0, 0] }, // Top and vertical borders
                                    { text: '', border: [true, true, true, true], fillColor: '#ffffff', width: '*' }, // Vertical border between
                                    { text: '', bold: true, fontSize: 7, width: '50%', alignment: 'center', border: [true, true, true, true], margin: [0, 14, 0, 0] }, // Top and vertical borders
                                    { text: '', border: [true, true, true, true], fillColor: '#ffffff', width: '*' }
                                ]
                            },
                            {
                                columns: [
                                    { text: oCalData.totalNetWeight + "    KGS", fontSize: 7, width: '50%', alignment: 'center', border: [true, false, true, true], margin: [0, 18, 0, 4] }, // Vertical border
                                    { text: '', border: [true, false, true, true], fillColor: '#ffffff', width: '*' }, // Vertical border between
                                    { text: oCalData.totalGrossWeight + "    KGS", fontSize: 7, width: '50%', alignment: 'center', border: [true, false, true, true], margin: [0, 18, 0, 4] }, // Vertical border
                                    { text: '', border: [true, false, true, true], fillColor: '#ffffff', width: '*' }
                                ]
                            }
                        ],
                        border: [false, true, true, true]
                    },
                    { text: '', border: [false, false, false, true] },
                    {
                        colSpan: 1,
                        stack: [
                            { text: '', bold: true, fontSize: 7, alignment: 'left' },
                            { text: '', border: [false, false, false, true], fillColor: '#ffffff' },
                            {
                                columns: [
                                    { text: "CAD " + oCalData.totalPrice, fontSize: 7, alignment: 'left', width: '*', margin: [0, 32, 0, 4] },
                                    // { text: '', border: [false, false, false, true], fillColor: '#ffffff', width: '*' }
                                ]
                            }
                        ],
                        border: [false, true, false, true]
                    }
                ]);



                content.push({
                    table: {
                        widths: ['10%', '50%', '13%', '13.5%', '13.5%'],
                        body: tableBody
                    },
                    // layout: {
                    //     hLineWidth: function (i, node) { return 1; },
                    //     vLineWidth: function (i, node) { return 1; },
                    //     paddingLeft: function () { return 4; },
                    //     paddingRight: function () { return 4; },
                    //     paddingTop: function () { return 2; },
                    //     paddingBottom: function () { return 2; }
                    // },
                    layout: {
                        hLineWidth: function (i, node) { return 0.5; },
                        vLineWidth: function (i, node) { return 0.5; },
                        hLineColor: function (i, node) { return '#000000'; },
                        vLineColor: function (i, node) { return '#000000'; }
                    },
                    border: [true, true, true, true],
                    margin: [0, 2, 0, 2]
                });

                content.push({
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            // ---------- Row pair 19 & 20 ----------
                            [
                                // LEFT column: 19
                                {
                                    stack: [
                                        { text: "CRESCENT FOUNDRY CO PVT LTD", fontSize: 7, alignment: 'center', margin: [0, 28, 0, 0] },
                                        { text: "7/1, LORD SINHA ROAD, LORDS BUILDING # 406,", fontSize: 7, alignment: 'center' },
                                        { text: "KOLKATA-700071 (INDIA)", fontSize: 7, alignment: 'center' }
                                    ],
                                    border: [false, false, true, true]
                                },

                                // RIGHT column: 20
                                {
                                    stack: [

                                        { text: "", fontSize: 7, margin: [0, 28, 0, 0], alignment: 'right' },
                                    ],
                                    border: [false, false, false, true]
                                }
                            ],

                            // ---------- Row pair 21 & 22 ----------
                            [
                                // LEFT column: 21
                                {
                                    stack: [

                                        { text: "", fontSize: 7, margin: [0, 20, 0, 0], alignment: 'right' },
                                    ],
                                    border: [false, true, false, true]
                                },

                                // RIGHT column: 22
                                {
                                    stack: [

                                        { text: "", fontSize: 7, margin: [0, 20, 0, 0], alignment: 'right' },
                                    ],
                                    border: [true, true, false, true]
                                }
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: (i, node) => 0.5,
                        vLineWidth: (i, node) => 0.5,
                        hLineColor: (i, node) => '#000000',
                        vLineColor: (i, node) => '#000000'
                    },
                    margin: [0, -3, 0, 0]
                });


                content.push({
                    table: {
                        widths: ['66.66%', '33.34%'],
                        body: [
                            [
                                // Left side — Fields 23 + 24
                                {
                                    table: {
                                        widths: ['50%', '50%'],
                                        body: [
                                            [
                                                {
                                                    stack: [
                                                        { text: ' ', bold: true, fontSize: 7, margin: [0, 0, 0, 3] },
                                                        { text: '', fontSize: 7 }
                                                    ],
                                                    margin: [4, 50, 4, 1],
                                                    border: [true, true, true, true]
                                                },
                                                {
                                                    stack: [
                                                        { text: '', bold: true, fontSize: 7, margin: [0, 0, 0, 3] },
                                                        { text: '', fontSize: 7 }
                                                    ],
                                                    margin: [4, 50, 4, 1],
                                                    border: [true, true, true, true]
                                                }
                                            ],
                                            [
                                                { text: '', fontSize: 7, margin: [4, 40, 4, 2], border: [true, false, true, true] },
                                                { text: '', fontSize: 7, margin: [4, 40, 4, 2], border: [true, false, true, true] }
                                            ],
                                            [
                                                { text: '', fontSize: 7, margin: [4, 24, 4, 2], border: [true, false, true, true] },
                                                { text: '', fontSize: 7, margin: [4, 24, 4, 2], border: [true, false, true, true] }
                                            ]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: (i, node) => 0.5,
                                        vLineWidth: (i, node) => 0.5,
                                        vLineColor: () => '#000',
                                        hLineColor: () => '#000',
                                        paddingTop: () => 2,
                                        paddingBottom: () => 2,
                                        paddingLeft: () => 3,
                                        paddingRight: () => 3
                                    }
                                },

                                // Right side — Field 25
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            [{ text: ` `, bold: true, fontSize: 7, margin: [0, 0, 0, 4], border: [true, true, true, false] }],
                                            [{ text: ``, fontSize: 7, border: [true, false, true, false] }],
                                            [{
                                                text: '', // □ white square
                                                fontSize: 10,
                                                margin: [2, 0, 0, 0],
                                                border: [true, false, true, false],
                                                alignment: 'center'
                                            }],
                                            [{ text: ``, fontSize: 7, border: [true, false, true, true] }],
                                            [{
                                                text: '', // □ white square
                                                fontSize: 10,
                                                margin: [2, 0, 0, 0],
                                                border: [true, false, true, false],
                                                alignment: 'center'
                                            }]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: () => 0,
                                        vLineWidth: () => 0,
                                        paddingTop: () => 2,
                                        paddingBottom: () => 2,
                                        paddingLeft: () => 4,
                                        paddingRight: () => 4
                                    }
                                }
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: () => 0,
                        vLineWidth: () => 0,
                        paddingTop: () => 0,
                        paddingBottom: () => 0,
                        paddingLeft: () => 0,
                        paddingRight: () => 0
                    }
                });


                // Certification Footer
                content.push({
                    text: 'I, The undersigned Member of the Secretarial Staff of the Bengal Chamber of Commerce & Industry hereby certify that the above declaration was made before me.',
                    fontSize: 7,
                    italics: true,
                    margin: [0, 8, 0, 0]
                });
                content.push({
                    text: 'Member of the Secretarial Staff\nThe Bengal Chamber of Commerce & Industry',
                    fontSize: 7,
                    alignment: 'right',
                    margin: [0, 30, 0, 0]
                });

                var docDefinition = {
                    pageSize: "A4",
                    pageMargins: [60, 20, 60, 2],  // [Left,Top,Right,Bottom]
                    content: content,
                    styles: {
                        tableHeader: {
                            bold: true,
                            fontSize: 8,
                            alignment: "center",
                            fillColor: "#E0E0E0"
                        },
                        tableBody: {
                            fontSize: 7,
                            alignment: "left",
                            bold: false
                        }
                    }
                };

                // Preview PDF in the View
                pdfMake.createPdf(docDefinition).getBlob(function (blob) {
                    var blobUrl = URL.createObjectURL(blob);

                    var oHtml = that.byId("pdfIframeContainer");
                    oHtml.setContent(`
                <div class="pdf-iframe-container">
                    <iframe src="${blobUrl}" class="pdf-iframe"></iframe>
                </div>
            `);

                    that._pdfBlobUrl = blobUrl;

                    that._busyDialog.close();
                });

            }).catch(function (err) {
                console.error("Error while generating PDF:", err);
                that._busyDialog.close();
                sap.m.MessageBox.error("Failed to generate PDF.");
            });

        },

        onDownloadPdf: function () {
            if (this._pdfBlobUrl) {
                //  Create Object URL from blob
                var pdfUrl = this._pdfBlobUrl;

                //  Open new window
                var newWindow = window.open("", "_blank");
                if (!newWindow) {
                    sap.m.MessageToast.show("Please allow pop-ups to view the PDF.");
                    return;
                }

                // Write HTML with iframe
                newWindow.document.write(`
                    <html>
                        <head>
                            <title>Canada Custom Invoice Form</title>
                            <style>
                                html, body {
                                    margin: 0;
                                    height: 100%;
                                    overflow: hidden;
                                }
                                iframe {
                                    width: 100%;
                                    height: 100%;
                                    border: none;
                                }
                            </style>
                        </head>
                        <body>
                            <iframe src="${pdfUrl}" allow="fullscreen"></iframe>
                        </body>
                    </html>
                `);

                newWindow.document.close();
            } else {
                sap.m.MessageToast.show("PDF not ready yet.");
            }
        },
        // onClosePdfDialog: function () {

        //     this.byId("idDeliveryDocumentInput").setValue("");

        //     var oDialog = this.byId("pdfDialog");
        //     oDialog.close();

        //     // Optional: Reset blob URL if you had one
        //     if (this._pdfBlobUrl) {
        //         URL.revokeObjectURL(this._pdfBlobUrl);
        //         this._pdfBlobUrl = null;
        //     }
        // },

        onClosePdfPreview: function () {

            this.byId("idBillingDocInput").setValue("");
            // this.byId("closeBtn").setVisible(false);

            var oHtml = this.byId("pdfIframeContainer");

            // Clear the iframe content
            if (oHtml) {
                // oHtml.setContent(""); // Remove the embedded iframe
                // Reset PDF view to placeholder
                this._setPdfPlaceholder();
            }

            // Optional: Reset blob URL if you had one
            if (this._pdfBlobUrl) {
                URL.revokeObjectURL(this._pdfBlobUrl);
                this._pdfBlobUrl = null;
            } else {
                sap.m.MessageToast.show("PDF not ready yet.");
            }
        }

    });
});