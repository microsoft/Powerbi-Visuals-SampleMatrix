/*
 *  Power BI Visualizations
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
    export class MatrixDataviewHtmlFormatter {

        public static formatDataViewMatrix(matrix: powerbi.DataViewMatrix): string {
            let htmlString = "<div class='datagrid'><table>";
            let levelToColumnNodesMap: any[][] = [];
            MatrixDataviewHtmlFormatter.countColumnNodeLeaves(matrix.columns.root, levelToColumnNodesMap);
            htmlString += MatrixDataviewHtmlFormatter.formatColumnNodes(matrix.columns.root, levelToColumnNodesMap);
            htmlString += MatrixDataviewHtmlFormatter.formatRowNodes(matrix.rows.root);
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
                    leafCount += MatrixDataviewHtmlFormatter.countColumnNodeLeaves(child, levelToColumnNodesMap);
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
                    res += MatrixDataviewHtmlFormatter.formatRowNodes(child);
                }
            }
            return res;
        }
    }
}