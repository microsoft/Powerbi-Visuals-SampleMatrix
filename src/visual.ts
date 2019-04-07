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
                    case SubtotalProperties.ObjectSubTotals:
                        this.enumerateSubTotalsOptions(enumeration, objects);
                        break;
                    default:
                        break;
                }
            }

            return enumeration.complete();
        }

        public enumerateSubTotalsOptions(enumeration, objects: DataViewObjects): void {
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

        private enumeratePerLevelSubtotals(enumeration, hierarchyLevels: DataViewHierarchyLevel[]) {
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
}