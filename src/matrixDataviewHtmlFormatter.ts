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


import powerbi from "powerbi-visuals-api";
export class MatrixDataviewHtmlFormatter {

    public static formatDataViewMatrix(matrix: powerbi.DataViewMatrix): HTMLElement {
        const htmlElement = document.createElement('div');
        htmlElement.classList.add('datagrid');
        const tableElement = document.createElement('table');
        const tbodyElement = document.createElement('tbody');
        const levelToColumnNodesMap: any[][] = [];
        MatrixDataviewHtmlFormatter.countColumnNodeLeaves(matrix.columns.root, levelToColumnNodesMap);
        MatrixDataviewHtmlFormatter.formatColumnNodes(matrix.columns.root, levelToColumnNodesMap, tbodyElement);
        MatrixDataviewHtmlFormatter.formatRowNodes(matrix.rows.root, tbodyElement);
        tableElement.appendChild(tbodyElement);
        htmlElement.appendChild(tableElement);
        return htmlElement;
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
            for (const child of root.children) {
                leafCount += MatrixDataviewHtmlFormatter.countColumnNodeLeaves(child, levelToColumnNodesMap);
            }
        }
        return root.leafCount = leafCount;
    }

    private static formatColumnNodes(root, levelToColumnNodesMap: any[][], topElement: HTMLElement) {
        for (let level = 0; level < levelToColumnNodesMap.length; level++) {
            const levelNodes = levelToColumnNodesMap[level];
            const trElement = document.createElement('tr');
            const thElement = document.createElement('th');
            thElement.style.textAlign = 'left';
            trElement.appendChild(thElement);
            for (let i = 0; i < levelNodes.length; i++) {
                const node = levelNodes[i];
                const thElement = document.createElement('th');
                thElement.colSpan = node.leafCount;
                const textElement = document.createTextNode(node.isSubtotal ? "Totals" : node.value);
                thElement.appendChild(textElement);
                thElement.style.textAlign = 'left';
                trElement.appendChild(thElement);
            }
            topElement.appendChild(trElement);
        }
    }

    private static formatRowNodes(root, topElement: HTMLElement) {
        if (!(typeof root.level === 'undefined' || root.level === null)) {
            const trElement = document.createElement('tr');
            const thElement = document.createElement('th');
            thElement.style.textAlign = 'left';
            let headerText = "";
            for (let level = 0; level < root.level; level++) {
                headerText += '\u00A0\u00A0\u00A0\u00A0';
            }
            headerText += root.isSubtotal ? "Totals" : root.value;
            const textElement = document.createTextNode(headerText);

            thElement.appendChild(textElement);
            trElement.appendChild(thElement);
            if (root.values) {
                for (let i = 0; !(typeof root.values[i] === 'undefined' || root.values[i] === null); i++) {
                    const tdElement = document.createElement('td');
                    if (root.values[i].value != null) {
                        tdElement.appendChild(document.createTextNode(root.values[i].value));
                    }
                    trElement.appendChild(tdElement);
                }
            }
            topElement.appendChild(trElement);
        }
        if (root.children) {
            for (const child of root.children) {
                MatrixDataviewHtmlFormatter.formatRowNodes(child, topElement);
            }
        }
    }
}
