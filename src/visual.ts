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
import powerbi from "powerbi-visuals-api";
import { Selector, DataViewObjectPropertyReference } from './common'
import { ObjectEnumerationBuilder } from './objectEnumerationBuilder'
import { SubtotalProperties } from './subtotalProperties'
import { MatrixDataviewHtmlFormatter } from './matrixDataviewHtmlFormatter'

import "../style/visual.less";

export class Visual implements powerbi.extensibility.IVisual {
    private target: HTMLElement;
    private dataView: powerbi.DataView;

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        this.target = options.element;
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
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
            this.target.innerHTML = MatrixDataviewHtmlFormatter.formatDataViewMatrix(options.dataViews[0].matrix);
        }
    }

    public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstance[] | powerbi.VisualObjectInstanceEnumerationObject {
        let enumeration = new ObjectEnumerationBuilder();

        // Visuals are initialized with an empty data view before queries are run, therefore we need to make sure that
        // we are resilient here when we do not have data view.
        if (this.dataView) {
            let objects = null;
            if (this.dataView && this.dataView.metadata) {
                objects = this.dataView.metadata.objects;
            }

            switch (options.objectName) {
                case "general":
                    break;
                case SubtotalProperties.ObjectSubTotals:
                    this.enumerateSubTotalsOptions(enumeration, objects);
                    break;
                default:
                    break;
            }
        }

        return enumeration.complete();
    }

    public enumerateSubTotalsOptions(enumeration, objects: powerbi.DataViewObjects): void {
        let instance = this.createVisualObjectInstance(SubtotalProperties.ObjectSubTotals);
        let rowSubtotalsEnabled: boolean = Visual.setInstanceProperty(objects, SubtotalProperties.rowSubtotals, instance);
        let columnSubtotalsEnabled: boolean = Visual.setInstanceProperty(objects, SubtotalProperties.columnSubtotals, instance);
        enumeration.pushInstance(instance);

        if (rowSubtotalsEnabled) {

            // Per row level
            instance = this.createVisualObjectInstance(SubtotalProperties.ObjectSubTotals);
            let perLevel = Visual.setInstanceProperty(objects, SubtotalProperties.rowSubtotalsPerLevel, instance);
            enumeration.pushInstance(instance, /* mergeInstances */ false);

            if (perLevel)
                this.enumeratePerLevelSubtotals(enumeration, this.dataView.matrix.rows.levels);
        }

        if (columnSubtotalsEnabled) {

            // Per column level
            instance = this.createVisualObjectInstance(SubtotalProperties.ObjectSubTotals);
            let perLevel = Visual.setInstanceProperty(objects, SubtotalProperties.columnSubtotalsPerLevel, instance);
            enumeration.pushInstance(instance, /* mergeInstances */ false);

            if (perLevel)
                this.enumeratePerLevelSubtotals(enumeration, this.dataView.matrix.columns.levels);
        }
    }

    private enumeratePerLevelSubtotals(enumeration, hierarchyLevels: powerbi.DataViewHierarchyLevel[]) {
        for (let level of hierarchyLevels) {
            for (let source of level.sources) {
                if (!source.isMeasure) {
                    let instance = this.createVisualObjectInstance(SubtotalProperties.ObjectSubTotals, { metadata: source.queryName }, source.displayName);
                    Visual.setInstanceProperty(source.objects, SubtotalProperties.levelSubtotalEnabled, instance);
                    enumeration.pushInstance(instance, /* mergeInstances */ false);
                }
            }
        }
    }

    private createVisualObjectInstance(objectName: string, selector: Selector = null, displayName?: string): powerbi.VisualObjectInstance {
        let instance: powerbi.VisualObjectInstance = {
            selector: selector,
            objectName: objectName,
            properties: {},
        };

        if (displayName != null)
            instance.displayName = displayName;

        return instance;
    }

    private static getPropertyValue<T>(objects: powerbi.DataViewObjects, dataViewObjectPropertyReference: DataViewObjectPropertyReference<T>): T {
        let object;
        if (objects) {
            object = objects[dataViewObjectPropertyReference.propertyIdentifier.objectName];
        }
        return Visual.getValue(object, dataViewObjectPropertyReference.propertyIdentifier.propertyName, dataViewObjectPropertyReference.defaultValue);
    }

    private static setInstanceProperty<T>(objects: powerbi.DataViewObjects, dataViewObjectPropertyReference: DataViewObjectPropertyReference<T>, instance: powerbi.VisualObjectInstance): T {
        let value = this.getPropertyValue(objects, dataViewObjectPropertyReference);
        if (instance && instance.properties) {
            instance.properties[dataViewObjectPropertyReference.propertyIdentifier.propertyName] = value;
        }
        return value;
    }

    private static getValue<T>(
        object: powerbi.DataViewObject,
        propertyName: string,
        defaultValue?: T,
        instanceId?: string): T {

        if (!object)
            return defaultValue;

        if (instanceId) {
            const instances = object.$instances;
            if (!instances)
                return defaultValue;

            const instance = instances[instanceId];
            if (!instance)
                return defaultValue;

            object = instance;
        }

        let propertyValue = <T>object[propertyName];
        if (propertyValue === undefined)
            return defaultValue;

        return propertyValue;
    }
}