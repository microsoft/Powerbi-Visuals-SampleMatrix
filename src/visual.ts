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

module powerbi.extensibility.visual {
    "use strict";
    export class Visual implements IVisual {
        private target: HTMLElement;
        private dataView: DataView;

        private rowSubtotals: DataViewObjectPropertyReference<boolean> = {
            "propertyIdentifier": {
                "objectName": "subTotals",
                "propertyName": "rowSubtotals"
            },
            "defaultValue": true
        };

        private rowSubtotalsPerLevel: DataViewObjectPropertyReference<boolean> = {
            "propertyIdentifier": {
                "objectName": "subTotals",
                "propertyName": "perRowLevel"
            },
            "defaultValue": false
        }

        private columnSubtotals: DataViewObjectPropertyReference<boolean> = {
            "propertyIdentifier": {
                "objectName": "subTotals",
                "propertyName": "columnSubtotals"
            },
            "defaultValue": true
        };

        private columnSubtotalsPerLevel: DataViewObjectPropertyReference<boolean> = {
            "propertyIdentifier": {
                "objectName": "subTotals",
                "propertyName": "perColumnLevel"
            },
            "defaultValue": false
        };

        private levelSubtotalEnabled: DataViewObjectPropertyReference<boolean> = {
            "propertyIdentifier": {
                "objectName": "subTotals",
                "propertyName": "levelSubtotalEnabled"
            },
            "defaultValue": true
        };

        constructor(options: VisualConstructorOptions) {
            console.log('Visual constructor', options);
            this.target = options.element;
        }

        public update(options: VisualUpdateOptions) {
            debugger;
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
                this.target.innerHTML = Visual.formatDataViewMatrix(options.dataViews[0].matrix);
            }
        }

        private static formatDataViewMatrix(matrix: DataViewMatrix): string {
            let htmlString = "<div class='datagrid'><table>";
            let levelToColumnNodesMap: any[][] = [];
            Visual.countColumnNodeLeaves(matrix.columns.root, levelToColumnNodesMap);
            htmlString += Visual.formatColumnNodes(matrix.columns.root, levelToColumnNodesMap);
            htmlString += Visual.formatRowNodes(matrix.rows.root);
            return htmlString += "</table></div>";
        }

        private static countColumnNodeLeaves(root, levelToColumnNodesMap: any[][]): number {
            if (!(typeof root.level === 'undefined' || root.level === null)) {
                if (!levelToColumnNodesMap[root.level]) {
                    levelToColumnNodesMap[root.level] = [root];
                } else {
                    levelToColumnNodesMap[root.level].push(root);
                }
            }
            let leafCount;
            if (root.isSubtotal || !root.children) {
                return leafCount = 1;
            } else {
                leafCount = 0;
                for (let child of root.children) {
                    leafCount += Visual.countColumnNodeLeaves(child, levelToColumnNodesMap);
                }
            }
            return root.leafCount = leafCount;
        }

        private static formatColumnNodes(root, levelToColumnNodesMap: any[][]): string {
            let res = "";
            for (let level = 0; level < levelToColumnNodesMap.length; level++) {
                let levelNodes = levelToColumnNodesMap[level];
                res += "<tr>";
                res += "<th></th>";
                for (let i = 0; i < levelNodes.length; i++) {
                    let node = levelNodes[i];
                    res += "<th colspan='" + node.leafCount + "' >";
                    res += node.isSubtotal ? "Totals" : node.value;
                    res += "</th>";
                }
                res += "</tr>";
            }
            return res;
        }

        private static formatRowNodes(root): string {
            let res = "";
            if (!(typeof root.level === 'undefined' || root.level === null)) {
                res += "<tr><th>";
                for (let level = 0; level < root.level; level++) {
                    res += "&nbsp;&nbsp;&nbsp;&nbsp;"
                }
                res += root.isSubtotal ? "Totals" : root.value;
                res += "</th>";
                if (root.values) {
                    for (let i = 0; !(typeof root.values[i] === 'undefined' || root.values[i] === null); i++) {
                        res += "<td>" + root.values[i].value + "</td>";
                    }
                }
                res += "</tr>";
            }
            if (root.children) {
                for (let child of root.children) {
                    res += Visual.formatRowNodes(child);
                }
            }
            return res;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
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
                    case "subTotals":
                        this.enumerateSubTotalsOptions(enumeration, objects);
                        break;
                    default:
                        break;
                }
            }

            return enumeration.complete();
        }

        public enumerateSubTotalsOptions(enumeration, objects: DataViewObjects): void {
            let instance = this.createVisualObjectInstance("subTotals");
            let rowSubtotalsEnabled: boolean = Visual.setInstanceProperty(objects, this.rowSubtotals, instance);
            let columnSubtotalsEnabled: boolean = Visual.setInstanceProperty(objects, this.columnSubtotals, instance);
            enumeration.pushInstance(instance);

            if (rowSubtotalsEnabled) {

                // Per row level
                instance = this.createVisualObjectInstance("subTotals");
                let perLevel = Visual.setInstanceProperty(objects, this.rowSubtotalsPerLevel, instance);
                enumeration.pushInstance(instance, /* mergeInstances */ false);

                if (perLevel)
                    this.enumeratePerLevelSubtotals(enumeration, this.dataView.matrix.rows.levels);
            }

            if (columnSubtotalsEnabled) {

                // Per column level
                instance = this.createVisualObjectInstance("subTotals");
                let perLevel = Visual.setInstanceProperty(objects, this.columnSubtotalsPerLevel, instance);
                enumeration.pushInstance(instance, /* mergeInstances */ false);

                if (perLevel)
                    this.enumeratePerLevelSubtotals(enumeration, this.dataView.matrix.columns.levels);
            }
        }

        private enumeratePerLevelSubtotals(enumeration, hierarchyLevels: DataViewHierarchyLevel[]) {
            for (let level of hierarchyLevels) {
                for (let source of level.sources) {
                    if (!source.isMeasure) {
                        let instance = this.createVisualObjectInstance("subTotals", { metadata: source.queryName }, source.displayName);
                        Visual.setInstanceProperty(source.objects, this.levelSubtotalEnabled, instance);
                        enumeration.pushInstance(instance, /* mergeInstances */ false);
                    }
                }
            }
        }

        private createVisualObjectInstance(objectName: string, selector: Selector = null, displayName?: string): VisualObjectInstance {
            let instance: VisualObjectInstance = {
                selector: selector,
                objectName: objectName,
                properties: {},
            };

            if (displayName != null)
                instance.displayName = displayName;

            return instance;
        }


        private static getPropertyValue<T>(objects: DataViewObjects, dataViewObjectPropertyReference: DataViewObjectPropertyReference<T>): T {
            let object;
            if (objects) {
                object = objects[dataViewObjectPropertyReference.propertyIdentifier.objectName];
            }
            return Visual.getValue(object, dataViewObjectPropertyReference.propertyIdentifier.propertyName, dataViewObjectPropertyReference.defaultValue);
        }

        private static setInstanceProperty<T>(objects: DataViewObjects, dataViewObjectPropertyReference: DataViewObjectPropertyReference<T>, instance: VisualObjectInstance): T {
            let value = this.getPropertyValue(objects, dataViewObjectPropertyReference);
            if (instance && instance.properties) {
                instance.properties[dataViewObjectPropertyReference.propertyIdentifier.propertyName] = value;
            }
            return value;
        }

        private static getValue<T>(
            object: DataViewObject,
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


    interface DataViewObjectPropertyReference<T> {
        /** Property identifier that holds the Value. Only static properties (Null Selector) are supported */
        propertyIdentifier?: DataViewObjectPropertyIdentifier;

        /** Value to use if the PropertyDefinition does not exist */
        defaultValue: T;
    }

    /**
     * A helper class for building a VisualObjectInstanceEnumerationObject:
     * - Allows call chaining (e.g., builder.pushInstance({...}).pushInstance({...})
     * - Allows creating of containers (via pushContainer/popContainer)
     */
    export class ObjectEnumerationBuilder {
        private instances: VisualObjectInstance[];
        private containers: VisualObjectInstanceContainer[];
        private containerIdx: number;

        public pushInstance(instance: VisualObjectInstance, mergeInstances: boolean = true): ObjectEnumerationBuilder {

            let instances = this.instances;
            if (!instances) {
                instances = this.instances = [];
            }

            let containerIdx = this.containerIdx;
            if (containerIdx != null) {
                instance.containerIdx = containerIdx;
            }

            if (mergeInstances) {
                // Attempt to merge with an existing item if possible.
                for (let existingInstance of instances) {
                    if (this.canMerge(existingInstance, instance)) {
                        this.extend(existingInstance, instance, 'properties');
                        this.extend(existingInstance, instance, 'validValues');

                        return this;
                    }
                }
            }

            instances.push(instance);

            return this;
        }

        public pushContainer(container: VisualObjectInstanceContainer): ObjectEnumerationBuilder {

            let containers = this.containers;
            if (!containers) {
                containers = this.containers = [];
            }

            let updatedLen = containers.push(container);
            this.containerIdx = updatedLen - 1;

            return this;
        }

        public popContainer(): ObjectEnumerationBuilder {
            this.containerIdx = undefined;

            return this;
        }

        public complete(): VisualObjectInstanceEnumerationObject {
            if (!this.instances)
                return;

            let result: VisualObjectInstanceEnumerationObject = {
                instances: this.instances,
            };

            let containers = this.containers;
            if (containers) {
                result.containers = containers;
            }

            return result;
        }

        private canMerge(x: VisualObjectInstance, y: VisualObjectInstance): boolean {

            return x.objectName === y.objectName &&
                x.containerIdx === y.containerIdx &&
                ObjectEnumerationBuilder.selectorEquals(x.selector, y.selector);
        }

        private extend(target: VisualObjectInstance, source: VisualObjectInstance, propertyName: string): void {

            let sourceValues = source[propertyName];
            if (!sourceValues)
                return;

            let targetValues = target[propertyName];
            if (!targetValues)
                targetValues = target[propertyName] = {};

            for (let valuePropertyName in sourceValues) {
                if (targetValues[valuePropertyName]) {
                    // Properties have first-writer-wins semantics.
                    continue;
                }

                targetValues[valuePropertyName] = sourceValues[valuePropertyName];
            }
        }

        public static merge(x: VisualObjectInstanceEnumeration, y: VisualObjectInstanceEnumeration): VisualObjectInstanceEnumerationObject {
            let xNormalized = ObjectEnumerationBuilder.normalize(x);
            let yNormalized = ObjectEnumerationBuilder.normalize(y);

            if (!xNormalized || !yNormalized)
                return xNormalized || yNormalized;

            let xCategoryCount = xNormalized.containers ? xNormalized.containers.length : 0;

            for (let yInstance of yNormalized.instances) {
                xNormalized.instances.push(yInstance);

                if (yInstance.containerIdx != null)
                    yInstance.containerIdx += xCategoryCount;
            }

            let yContainers = yNormalized.containers;
            if (!_.isEmpty(yContainers)) {
                if (xNormalized.containers)
                    Array.prototype.push.apply(xNormalized.containers, yContainers);
                else
                    xNormalized.containers = yContainers;
            }

            return xNormalized;
        }

        public static normalize(x: VisualObjectInstanceEnumeration): VisualObjectInstanceEnumerationObject {

            if (_.isArray(x)) {
                return { instances: <VisualObjectInstance[]>x };
            }

            return <VisualObjectInstanceEnumerationObject>x;
        }

        public static getContainerForInstance(enumeration: VisualObjectInstanceEnumerationObject, instance: VisualObjectInstance): VisualObjectInstanceContainer {
            return enumeration.containers[instance.containerIdx];
        }

        public static selectorEquals(x: Selector, y: Selector): boolean {
            // Normalize falsy to null
            x = x || null;
            y = y || null;

            if (x === y)
                return true;

            if (!x !== !y)
                return false;

            if (x.id !== y.id)
                return false;
            if (x.metadata !== y.metadata)
                return false;

            return true;
        }

    }

    /** Defines a selector for content, including data-, metadata, and user-defined repetition. */
    export interface Selector {

        /** Metadata-bound repetition selection.  Refers to a DataViewMetadataColumn queryName. */
        metadata?: string;

        /** User-defined repetition selection. */
        id?: string;
    }

}