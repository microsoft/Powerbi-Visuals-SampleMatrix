/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";
import powerbi from "powerbi-visuals-api";
import { MatrixDataviewHtmlFormatter } from "./matrixDataviewHtmlFormatter";
import { SampleMatrixSettingsModel } from "./sampleMatrixSettingsModel"
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import CustomVisualApplyCustomSortArgs = powerbi.extensibility.visual.CustomVisualApplyCustomSortArgs;
import SortDirection = powerbi.SortDirection;
export class Visual implements IVisual {
    private target: HTMLElement;
    private dataView: DataView;
    private host: IVisualHost;
    private formattingSettings: SampleMatrixSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private isSorted: boolean = false;


    /**
     * Creates instance of Sample Matrix visual. This method is only called once.
     *
     * @constructor
     * @param {VisualConstructorOptions} options - Contains references to the element that will
     *                                             contain the visual and a reference to the host
     *                                             which contains services.
     */
    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);

        this.target = options.element;
        this.host = options.host;

        const localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(localizationManager);

    }

    public update(options: VisualUpdateOptions) {
        if (!options) {
            return;
        }


        if (options.type & powerbi.VisualUpdateType.Data) {
            if (!options.dataViews
                || !options.dataViews[0]
                || !options.dataViews[0].matrix
                || !options.dataViews[0].matrix.rows
                || !options.dataViews[0].matrix.rows.root
                || !options.dataViews[0].matrix.rows.root.children
                || !options.dataViews[0].matrix.rows.root.children.length
                || !options.dataViews[0].matrix.columns
                || !options.dataViews[0].matrix.columns.root
                || !options.dataViews[0].matrix.columns.root.children
                || !options.dataViews[0].matrix.columns.root.children.length) {
                this.dataView = undefined;
                return;
            }

            this.dataView = options.dataViews[0];

            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(SampleMatrixSettingsModel, options.dataViews);
            if (this.dataView) {
                let objects = null;
                if (this.dataView && this.dataView.metadata) {
                    objects = this.dataView.metadata.objects;
                }
                let rowsHierarchyLevels = null;
                if (this.dataView && this.dataView.matrix && this.dataView.matrix.rows && this.dataView.matrix.rows.levels) {
                    rowsHierarchyLevels = this.dataView.matrix.rows.levels;
                }
                let columnsHierarchyLevels = null;
                if (this.dataView && this.dataView.matrix && this.dataView.matrix.columns && this.dataView.matrix.columns.levels) {
                    columnsHierarchyLevels = this.dataView.matrix.columns.levels;
                }
                this.formattingSettings.populateSubTotalsOptions(objects, rowsHierarchyLevels, columnsHierarchyLevels);
            }

            while (this.target.firstChild) {
                this.target.removeChild(this.target.firstChild);
            }
            if (!this.isSorted) {
                this.sortRowsInAscendingOrder();
            }
            this.isSorted = !this.isSorted;
            this.target.appendChild(MatrixDataviewHtmlFormatter.formatDataViewMatrix(options.dataViews[0].matrix));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private sortRowsInAscendingOrder() {
        let rows = this.dataView?.matrix.rows.levels;
        if (rows.length != 0) {
            let args: CustomVisualApplyCustomSortArgs = {
                sortDescriptors: []
            };
            for (let i = 0; i < rows.length; i++) {
                let sortDescriptor = {
                    queryName: rows[i].sources[0].queryName,
                    sortDirection: SortDirection.Ascending
                }
                args.sortDescriptors.push(sortDescriptor);
            }
            this.host.applyCustomSort(args);
        }
    }
}